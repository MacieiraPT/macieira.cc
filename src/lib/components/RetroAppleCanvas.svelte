<script lang="ts">
  import { onMount } from 'svelte';
  import { i18n } from '#lib/i18n/index.svelte.ts';

  type PixelMode = '16bit' | '8bit';

  let mode = $state<PixelMode>('16bit');
  let webglReady = $state(false);
  let isDragging = $state(false);
  let reducedMotion = $state(false);

  let hostEl: HTMLDivElement | undefined = $state();
  let canvasEl: HTMLCanvasElement | undefined = $state();

  // Subtle reactive prop exposed via callback to update shader uniforms without remounting Three.js
  let setShaderMode: ((m: PixelMode) => void) | null = null;

  function selectMode(next: PixelMode) {
    mode = next;
    setShaderMode?.(next);
  }

  onMount(() => {
    if (!canvasEl || !hostEl) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = mq.matches;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        // Test quick context probe before importing Three.js on WebGL-disabled browsers
        const probe = document.createElement('canvas');
        const hasGl = Boolean(
          probe.getContext('webgl2', { alpha: true }) ||
            probe.getContext('webgl', { alpha: true })
        );
        if (!hasGl || disposed) return;

        const {
          BLIT_FRAGMENT_SHADER,
          BLIT_VERTEX_SHADER,
          DoubleSide,
          FrontSide,
          Group,
          MathUtils,
          Mesh,
          NearestFilter,
          OrthographicCamera,
          PerspectiveCamera,
          PlaneGeometry,
          RETRO_FRAGMENT_SHADER,
          RETRO_VERTEX_SHADER,
          Scene,
          ShaderMaterial,
          Vector2,
          WebGLRenderTarget,
          WebGLRenderer,
          buildAppleFruitGeometry,
          buildAppleLeafGeometry,
          buildAppleStemGeometry,
        } = await import('#lib/webgl/retroAppleShader.ts');

        if (disposed || !canvasEl || !hostEl) return;

        const renderer = new WebGLRenderer({
          canvas: canvasEl,
          alpha: true,
          antialias: false,
          powerPreference: 'default',
        });
        renderer.setPixelRatio(1);
        renderer.setClearColor(0x000000, 0);

        const scene = new Scene();
        const camera = new PerspectiveCamera(34, 1, 0.1, 20);
        camera.position.set(0, 0.2, 4.35);
        camera.lookAt(0, 0.12, 0);

        const group = new Group();
        group.position.set(0, -0.04, 0);
        group.rotation.set(0.18, -0.45, -0.06);
        scene.add(group);

        const makeMat = (matId: number) =>
          new ShaderMaterial({
            vertexShader: RETRO_VERTEX_SHADER,
            fragmentShader: RETRO_FRAGMENT_SHADER,
            side: matId === 2 ? DoubleSide : FrontSide,
            uniforms: {
              uMatId: { value: matId },
              uSteps: { value: mode === '16bit' ? 4.0 : 2.0 },
              uSnapGrid: { value: 96.0 },
              uSnapEnabled: { value: reducedMotion ? 0.0 : 1.0 },
            },
          });

        const fruitGeo = buildAppleFruitGeometry(18, 16);
        const fruitMat = makeMat(0.0);
        const fruitMesh = new Mesh(fruitGeo, fruitMat);
        group.add(fruitMesh);

        const stemGeo = buildAppleStemGeometry();
        const stemMat = makeMat(1.0);
        const stemMesh = new Mesh(stemGeo, stemMat);
        group.add(stemMesh);

        const leafGeo = buildAppleLeafGeometry();
        const leafMat = makeMat(2.0);
        const leafMesh = new Mesh(leafGeo, leafMat);
        leafMesh.position.set(0.08, 0.88, 0.02);
        leafMesh.rotation.set(0.16, 0.35, 0.14);
        leafMesh.scale.setScalar(1.06);
        group.add(leafMesh);

        const getRes = (m: PixelMode) => (m === '16bit' ? 148 : 82);

        let rtSize = getRes(mode);
        let target = new WebGLRenderTarget(rtSize, rtSize, {
          minFilter: NearestFilter,
          magFilter: NearestFilter,
          generateMipmaps: false,
          depthBuffer: true,
        });

        const blitScene = new Scene();
        const blitCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const blitMat = new ShaderMaterial({
          vertexShader: BLIT_VERTEX_SHADER,
          fragmentShader: BLIT_FRAGMENT_SHADER,
          transparent: true,
          depthTest: false,
          uniforms: {
            tDiffuse: { value: target.texture },
            uTexelSize: { value: new Vector2(1 / rtSize, 1 / rtSize) },
          },
        });
        const quadGeo = new PlaneGeometry(2, 2);
        const quad = new Mesh(quadGeo, blitMat);
        blitScene.add(quad);

        setShaderMode = (nextMode: PixelMode) => {
          rtSize = getRes(nextMode);
          target.setSize(rtSize, rtSize);
          blitMat.uniforms.uTexelSize.value.set(1 / rtSize, 1 / rtSize);

          const steps = nextMode === '16bit' ? 4.0 : 2.0;
          const grid = nextMode === '16bit' ? 112.0 : 60.0;
          for (const mat of [fruitMat, stemMat, leafMat]) {
            mat.uniforms.uSteps.value = steps;
            mat.uniforms.uSnapGrid.value = grid;
          }
          renderFrame();
        };

        const syncCanvasSize = () => {
          if (!hostEl) return;
          const rect = hostEl.getBoundingClientRect();
          const side = Math.max(200, Math.round(Math.min(rect.width, rect.height || rect.width)));
          renderer.setSize(side, side, false);
        };
        syncCanvasSize();

        // Pointer drag state & inertia
        let velX = 0;
        let velY = 0;
        let lastX = 0;
        let lastY = 0;
        let activePointerId: number | null = null;
        let inViewport = true;
        let rafId = 0;
        let lastTs = performance.now();

        const renderFrame = () => {
          renderer.setRenderTarget(target);
          renderer.clear();
          renderer.render(scene, camera);

          renderer.setRenderTarget(null);
          renderer.clear();
          renderer.render(blitScene, blitCam);
        };

        const tick = (ts: number) => {
          rafId = 0;
          if (disposed || !inViewport || document.hidden) return;

          const dt = Math.min((ts - lastTs) / 1000, 0.05);
          lastTs = ts;

          if (!isDragging) {
            group.rotation.y += velY;
            group.rotation.x = MathUtils.clamp(group.rotation.x + velX, -0.58, 0.68);
            velY *= 0.92;
            velX *= 0.9;

            if (!reducedMotion) {
              group.rotation.y += dt * 0.45;
              // Gentle organic float
              group.position.y = -0.04 + Math.sin(ts * 0.0018) * 0.045;
            }
          }

          renderFrame();

          const moving = !reducedMotion || Math.abs(velX) > 0.0004 || Math.abs(velY) > 0.0004 || isDragging;
          if (moving) {
            rafId = requestAnimationFrame(tick);
          }
        };

        const kickLoop = () => {
          if (!rafId && !disposed && inViewport && !document.hidden) {
            lastTs = performance.now();
            rafId = requestAnimationFrame(tick);
          }
        };

        const onPointerDown = (e: PointerEvent) => {
          if (e.button !== 0 && e.pointerType === 'mouse') return;
          activePointerId = e.pointerId;
          isDragging = true;
          lastX = e.clientX;
          lastY = e.clientY;
          velX = 0;
          velY = 0;
          canvasEl?.setPointerCapture(e.pointerId);
          kickLoop();
        };

        const onPointerMove = (e: PointerEvent) => {
          if (!isDragging || e.pointerId !== activePointerId) return;
          const dx = e.clientX - lastX;
          const dy = e.clientY - lastY;
          lastX = e.clientX;
          lastY = e.clientY;

          const sens = 0.011;
          group.rotation.y += dx * sens;
          group.rotation.x = MathUtils.clamp(group.rotation.x + dy * sens, -0.58, 0.68);
          velY = dx * sens * 0.65;
          velX = dy * sens * 0.45;
          if (reducedMotion) renderFrame();
        };

        const endDrag = (e: PointerEvent) => {
          if (e.pointerId !== activePointerId) return;
          isDragging = false;
          activePointerId = null;
        };

        const onContextLost = (e: Event) => {
          e.preventDefault();
          webglReady = false;
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
          }
        };

        const onMotionChange = (ev: MediaQueryListEvent) => {
          reducedMotion = ev.matches;
          const snapFlag = reducedMotion ? 0.0 : 1.0;
          for (const mat of [fruitMat, stemMat, leafMat]) {
            mat.uniforms.uSnapEnabled.value = snapFlag;
          }
          if (!reducedMotion) kickLoop();
          else renderFrame();
        };

        const onVisibility = () => {
          if (!document.hidden) kickLoop();
        };

        const ro = new ResizeObserver(() => {
          syncCanvasSize();
          renderFrame();
        });
        ro.observe(hostEl);

        const io = new IntersectionObserver(
          (entries) => {
            inViewport = entries[0]?.isIntersecting ?? true;
            if (inViewport) kickLoop();
          },
          { threshold: 0.05 }
        );
        io.observe(hostEl);

        canvasEl.addEventListener('pointerdown', onPointerDown);
        canvasEl.addEventListener('pointermove', onPointerMove);
        canvasEl.addEventListener('pointerup', endDrag);
        canvasEl.addEventListener('pointercancel', endDrag);
        canvasEl.addEventListener('webglcontextlost', onContextLost);
        mq.addEventListener('change', onMotionChange);
        document.addEventListener('visibilitychange', onVisibility);

        // Draw first frame immediately and reveal canvas smoothly
        renderFrame();
        webglReady = true;
        kickLoop();

        cleanup = () => {
          setShaderMode = null;
          if (rafId) cancelAnimationFrame(rafId);
          ro.disconnect();
          io.disconnect();
          canvasEl?.removeEventListener('pointerdown', onPointerDown);
          canvasEl?.removeEventListener('pointermove', onPointerMove);
          canvasEl?.removeEventListener('pointerup', endDrag);
          canvasEl?.removeEventListener('pointercancel', endDrag);
          canvasEl?.removeEventListener('webglcontextlost', onContextLost);
          mq.removeEventListener('change', onMotionChange);
          document.removeEventListener('visibilitychange', onVisibility);

          fruitGeo.dispose();
          stemGeo.dispose();
          leafGeo.dispose();
          quadGeo.dispose();
          fruitMat.dispose();
          stemMat.dispose();
          leafMat.dispose();
          blitMat.dispose();
          target.dispose();
          renderer.dispose();
        };
      } catch {
        // Keep inline 16-bit pixel SVG fallback cleanly active
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  });
</script>

<div class="apple-stage" data-mode={mode}>
  <div class="apple-stage__viewport" bind:this={hostEl}>
    <div class="apple-stage__spotlight" aria-hidden="true"></div>

    <!-- Crisp 16-bit Pixel SVG Apple Fallback (instant first paint + no-JS / no-WebGL) -->
    <svg
      class="apple-stage__fallback"
      class:is-hidden={webglReady}
      viewBox="0 0 24 24"
      shape-rendering="crispEdges"
      role="img"
      aria-label={i18n.t.hero.shaderCanvasAria}
    >
      <!-- Woody pixel stem -->
      <rect x="11" y="3" width="2" height="2" fill="#8b7b69" />
      <rect x="12" y="2" width="2" height="1" fill="#c2b2a0" />
      <rect x="11" y="5" width="2" height="2" fill="#54463a" />

      <!-- Brand Acid pixel leaf (#cdfb45 ramp) -->
      <rect x="13" y="4" width="3" height="1" fill="#9be028" />
      <rect x="14" y="3" width="3" height="2" fill="#cdfb45" />
      <rect x="16" y="4" width="2" height="1" fill="#598e14" />

      <!-- 16-bit Bayer-dithered pixel apple silhouette -->
      <rect x="7" y="6" width="4" height="1" fill="#96201a" />
      <rect x="13" y="6" width="4" height="1" fill="#e4392f" />

      <rect x="6" y="7" width="6" height="1" fill="#e4392f" />
      <rect x="12" y="7" width="6" height="1" fill="#ff886b" />

      <rect x="5" y="8" width="2" height="1" fill="#96201a" />
      <rect x="7" y="8" width="6" height="1" fill="#e4392f" />
      <rect x="13" y="8" width="1" height="1" fill="#ff886b" />
      <rect x="14" y="8" width="3" height="1" fill="#e4392f" />
      <rect x="17" y="8" width="2" height="1" fill="#96201a" />

      <rect x="4" y="9" width="2" height="7" fill="#6d1314" />
      <rect x="6" y="9" width="10" height="6" fill="#e4392f" />
      <rect x="16" y="9" width="2" height="7" fill="#96201a" />
      <rect x="18" y="9" width="2" height="6" fill="#6d1314" />

      <!-- Retro Bayer dither checker specular + halftone shadow -->
      <rect x="13" y="9" width="2" height="2" fill="#ff886b" />
      <rect x="12" y="10" width="1" height="1" fill="#ff886b" />
      <rect x="6" y="12" width="1" height="1" fill="#96201a" />
      <rect x="8" y="14" width="1" height="1" fill="#96201a" />
      <rect x="6" y="14" width="1" height="1" fill="#6d1314" />
      <rect x="15" y="14" width="1" height="1" fill="#96201a" />

      <rect x="5" y="15" width="3" height="3" fill="#6d1314" />
      <rect x="8" y="15" width="8" height="3" fill="#96201a" />
      <rect x="16" y="15" width="3" height="3" fill="#6d1314" />

      <rect x="6" y="18" width="5" height="2" fill="#6d1314" />
      <rect x="11" y="18" width="2" height="1" fill="#2a090a" />
      <rect x="13" y="18" width="5" height="2" fill="#6d1314" />

      <rect x="7" y="20" width="3" height="1" fill="#2a090a" />
      <rect x="14" y="20" width="3" height="1" fill="#2a090a" />
    </svg>

    <canvas
      bind:this={canvasEl}
      class="apple-stage__canvas"
      class:is-live={webglReady}
      class:is-dragging={isDragging}
      aria-label={i18n.t.hero.shaderCanvasAria}
    ></canvas>
  </div>

  <div class="apple-stage__bar">
    <span class="apple-stage__status mono">
      {reducedMotion ? i18n.t.hero.shaderStatusReduced : i18n.t.hero.shaderStatusIdle}
    </span>

    <div class="mode-toggle" role="group" aria-label="Pixel quantization mode">
      <button
        type="button"
        class="mode-toggle__btn mono"
        class:is-active={mode === '16bit'}
        aria-pressed={mode === '16bit'}
        onclick={() => selectMode('16bit')}
      >
        {i18n.t.hero.shaderMode16}
      </button>
      <button
        type="button"
        class="mode-toggle__btn mono"
        class:is-active={mode === '8bit'}
        aria-pressed={mode === '8bit'}
        onclick={() => selectMode('8bit')}
      >
        {i18n.t.hero.shaderMode8}
      </button>
    </div>
  </div>
</div>

<style>
  .apple-stage {
    position: relative;
    display: grid;
    gap: 0.85rem;
    padding: clamp(1rem, 2vw, 1.5rem);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--bg-raise);
  }

  .apple-stage__viewport {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    max-height: clamp(260px, 46svh, 430px);
    margin-inline: auto;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .apple-stage__spotlight {
    position: absolute;
    inset: 10%;
    border-radius: 50%;
    pointer-events: none;
    background: radial-gradient(
      circle,
      color-mix(in oklab, var(--apple-deep) 28%, transparent) 0%,
      color-mix(in oklab, var(--acid) 8%, transparent) 46%,
      transparent 72%
    );
  }

  .apple-stage__fallback {
    position: relative;
    z-index: 1;
    width: 68%;
    height: 68%;
    transition: opacity 0.35s var(--ease-out);
  }

  .apple-stage__fallback.is-hidden {
    opacity: 0;
    pointer-events: none;
  }

  .apple-stage__canvas {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    z-index: 2;
    opacity: 0;
    cursor: grab;
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    transition: opacity 0.45s var(--ease-out);
  }

  .apple-stage__canvas.is-live {
    opacity: 1;
  }

  .apple-stage__canvas.is-dragging {
    cursor: grabbing;
  }

  .apple-stage__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--line);
  }

  :global(html.no-js) .apple-stage__bar {
    display: none;
  }

  .apple-stage__status {
    color: var(--ink-faint);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.65rem;
  }

  .mode-toggle {
    display: inline-flex;
    padding: 2px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--bg);
  }

  .mode-toggle__btn {
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    color: var(--ink-dim);
    cursor: pointer;
    transition: background-color 0.2s var(--ease-out), color 0.2s var(--ease-out);
  }

  .mode-toggle__btn:hover {
    color: var(--ink);
  }

  .mode-toggle__btn.is-active {
    background: var(--acid);
    color: #08080a;
    font-weight: 600;
  }
</style>
