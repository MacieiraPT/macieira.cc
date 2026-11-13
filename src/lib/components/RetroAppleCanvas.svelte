<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { i18n } from '#lib/i18n/index.svelte.ts';
  import { THEMES, workbench, type PixelMode } from '#lib/state/workbench.svelte.ts';

  let webglReady = $state(false);
  let isDragging = $state(false);
  let reducedMotion = $state(false);
  let spinCount = $state<number | null>(null);
  let spinningPulse = $state(false);

  let hostEl: HTMLDivElement | undefined = $state();
  let canvasEl: HTMLCanvasElement | undefined = $state();

  let setShaderMode: ((m: PixelMode) => void) | null = null;
  let setShaderPalette: ((pid: number) => void) | null = null;
  let applyImpulse: (() => void) | null = null;

  let prevSpinNonce = workbench.spinNonce;
  let spinTimer: ReturnType<typeof setTimeout> | undefined;

  function recordGlobalSpin() {
    spinCount = (spinCount ?? 0) + 1;
    spinningPulse = true;
    clearTimeout(spinTimer);
    spinTimer = setTimeout(() => {
      spinningPulse = false;
    }, 380);

    fetch('/api/apple', { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (typeof data?.count === 'number' && data.count >= (spinCount ?? 0)) {
          spinCount = data.count;
        }
      })
      .catch(() => {
        /* keep optimistic count */
      });
  }

  function handleInteractiveSpin() {
    workbench.triggerSpin();
  }

  // Keep WebGL uniforms in sync with global workbench runes (buttons or keyboard P / B / R)
  $effect(() => {
    const mode = workbench.mode;
    setShaderMode?.(mode);
  });

  $effect(() => {
    const pid = workbench.themeMeta.paletteIndex;
    setShaderPalette?.(pid);
  });

  $effect(() => {
    const nextNonce = workbench.spinNonce;
    if (nextNonce > prevSpinNonce) {
      prevSpinNonce = nextNonce;
      untrack(() => {
        applyImpulse?.();
        recordGlobalSpin();
      });
    }
  });

  onMount(() => {
    if (!canvasEl || !hostEl) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = mq.matches;

    const controller = new AbortController();
    fetch('/api/apple', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (typeof data?.count === 'number') {
          spinCount = data.count;
        }
      })
      .catch(() => {
        spinCount = 0;
      });

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
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
          Vector3,
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

        const initPid = workbench.themeMeta.paletteIndex;

        const makeMat = (matId: number) =>
          new ShaderMaterial({
            vertexShader: RETRO_VERTEX_SHADER,
            fragmentShader: RETRO_FRAGMENT_SHADER,
            side: matId === 2 ? DoubleSide : FrontSide,
            uniforms: {
              uMatId: { value: matId },
              uSteps: { value: workbench.mode === '16bit' ? 4.0 : 2.0 },
              uPaletteId: { value: initPid },
              uSnapGrid: { value: workbench.mode === '16bit' ? 112.0 : 60.0 },
              uSnapEnabled: { value: reducedMotion ? 0.0 : 1.0 },
            },
          });

        const fruitGeo = buildAppleFruitGeometry(18, 16);
        const fruitMat = makeMat(0.0);
        group.add(new Mesh(fruitGeo, fruitMat));

        const stemGeo = buildAppleStemGeometry();
        const stemMat = makeMat(1.0);
        group.add(new Mesh(stemGeo, stemMat));

        const leafGeo = buildAppleLeafGeometry();
        const leafMat = makeMat(2.0);
        const leafMesh = new Mesh(leafGeo, leafMat);
        leafMesh.position.set(0.08, 0.88, 0.02);
        leafMesh.rotation.set(0.16, 0.35, 0.14);
        leafMesh.scale.setScalar(1.06);
        group.add(leafMesh);

        const getRes = (m: PixelMode) => (m === '16bit' ? 148 : 82);

        let rtSize = getRes(workbench.mode);
        let target = new WebGLRenderTarget(rtSize, rtSize, {
          minFilter: NearestFilter,
          magFilter: NearestFilter,
          generateMipmaps: false,
          depthBuffer: true,
        });

        const outlineColor = (pid: number) =>
          pid > 2.5 ? new Vector3(0.06, 0.06, 0.08) : new Vector3(0.04, 0.02, 0.03);

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
            uOutline: { value: outlineColor(initPid) },
          },
        });
        const quadGeo = new PlaneGeometry(2, 2);
        blitScene.add(new Mesh(quadGeo, blitMat));

        const renderFrame = () => {
          renderer.setRenderTarget(target);
          renderer.clear();
          renderer.render(scene, camera);

          renderer.setRenderTarget(null);
          renderer.clear();
          renderer.render(blitScene, blitCam);
        };

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

        setShaderPalette = (pid: number) => {
          for (const mat of [fruitMat, stemMat, leafMat]) {
            mat.uniforms.uPaletteId.value = pid;
          }
          blitMat.uniforms.uOutline.value.copy(outlineColor(pid));
          renderFrame();
        };

        const syncCanvasSize = () => {
          if (!hostEl) return;
          const rect = hostEl.getBoundingClientRect();
          const side = Math.max(200, Math.round(Math.min(rect.width, rect.height || rect.width)));
          renderer.setSize(side, side, false);
        };
        syncCanvasSize();

        let velX = 0;
        let velY = 0;
        let lastX = 0;
        let lastY = 0;
        let activePointerId: number | null = null;
        let inViewport = true;
        let rafId = 0;
        let lastTs = performance.now();

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

        applyImpulse = () => {
          if (reducedMotion) {
            group.rotation.y += 0.65;
            group.rotation.x = 0.18;
            renderFrame();
            return;
          }
          velY = 0.24;
          velX = (Math.random() - 0.5) * 0.05;
          kickLoop();
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

        const onDoubleClick = () => {
          handleInteractiveSpin();
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
        canvasEl.addEventListener('dblclick', onDoubleClick);
        canvasEl.addEventListener('webglcontextlost', onContextLost);
        mq.addEventListener('change', onMotionChange);
        document.addEventListener('visibilitychange', onVisibility);

        renderFrame();
        webglReady = true;
        kickLoop();

        cleanup = () => {
          setShaderMode = null;
          setShaderPalette = null;
          applyImpulse = null;
          if (rafId) cancelAnimationFrame(rafId);
          ro.disconnect();
          io.disconnect();
          canvasEl?.removeEventListener('pointerdown', onPointerDown);
          canvasEl?.removeEventListener('pointermove', onPointerMove);
          canvasEl?.removeEventListener('pointerup', endDrag);
          canvasEl?.removeEventListener('pointercancel', endDrag);
          canvasEl?.removeEventListener('dblclick', onDoubleClick);
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
      clearTimeout(spinTimer);
      controller.abort();
      cleanup?.();
    };
  });

  let numberFmt = $derived(new Intl.NumberFormat(i18n.locale));
  let resSpec = $derived(workbench.mode === '16bit' ? '148x148 · 4-STEP' : '82x82 · 2-STEP');
</script>

<div class="apple-stage" data-mode={workbench.mode} data-theme-id={workbench.theme}>
  <!-- Retro CRT Specimen Header -->
  <div class="specimen-head mono">
    <span class="specimen-head__id">
      <span class="specimen-head__dot" aria-hidden="true"></span>
      <span>{i18n.t.hero.workbenchTag}</span>
    </span>
    <span class="specimen-head__spec">{resSpec}</span>
    <button
      type="button"
      class="crt-btn"
      class:is-on={workbench.scanlines}
      aria-pressed={workbench.scanlines}
      aria-label={i18n.t.hero.crtToggleAria}
      onclick={() => workbench.toggleScanlines()}
    >
      {i18n.t.hero.crtToggleLabel}
    </button>
  </div>

  <div class="apple-stage__viewport" bind:this={hostEl}>
    <div class="apple-stage__spotlight" aria-hidden="true"></div>

    <!-- Crisp 16-bit Pixel SVG Apple Fallback (instant first paint + no-JS / no-WebGL) -->
    <svg
      class="apple-stage__fallback"
      class:is-hidden={webglReady}
      class:is-pulsing={spinningPulse}
      viewBox="0 0 24 24"
      shape-rendering="crispEdges"
      role="img"
      aria-label={i18n.t.hero.shaderCanvasAria}
    >
      <rect x="11" y="3" width="2" height="2" fill="var(--bark)" />
      <rect x="12" y="2" width="2" height="1" fill="var(--bark)" />
      <rect x="11" y="5" width="2" height="2" fill="var(--bark)" />

      <rect x="13" y="4" width="3" height="1" fill="var(--leaf-mid)" />
      <rect x="14" y="3" width="3" height="2" fill="var(--acid)" />
      <rect x="16" y="4" width="2" height="1" fill="var(--leaf-mid)" />

      <rect x="7" y="6" width="4" height="1" fill="var(--apple-deep)" />
      <rect x="13" y="6" width="4" height="1" fill="var(--apple)" />

      <rect x="6" y="7" width="6" height="1" fill="var(--apple)" />
      <rect x="12" y="7" width="6" height="1" fill="var(--apple-hi)" />

      <rect x="5" y="8" width="2" height="1" fill="var(--apple-deep)" />
      <rect x="7" y="8" width="6" height="1" fill="var(--apple)" />
      <rect x="13" y="8" width="1" height="1" fill="var(--apple-hi)" />
      <rect x="14" y="8" width="3" height="1" fill="var(--apple)" />
      <rect x="17" y="8" width="2" height="1" fill="var(--apple-deep)" />

      <rect x="4" y="9" width="2" height="7" fill="var(--apple-deep)" />
      <rect x="6" y="9" width="10" height="6" fill="var(--apple)" />
      <rect x="16" y="9" width="2" height="7" fill="var(--apple-deep)" />
      <rect x="18" y="9" width="2" height="6" fill="var(--apple-deep)" />

      <rect x="13" y="9" width="2" height="2" fill="var(--apple-hi)" />
      <rect x="12" y="10" width="1" height="1" fill="var(--apple-hi)" />
      <rect x="6" y="12" width="1" height="1" fill="var(--apple-deep)" />
      <rect x="8" y="14" width="1" height="1" fill="var(--apple-deep)" />
      <rect x="6" y="14" width="1" height="1" fill="var(--apple-deep)" />
      <rect x="15" y="14" width="1" height="1" fill="var(--apple-deep)" />

      <rect x="5" y="15" width="3" height="3" fill="var(--apple-deep)" />
      <rect x="8" y="15" width="8" height="3" fill="var(--apple-deep)" />
      <rect x="16" y="15" width="3" height="3" fill="var(--apple-deep)" />

      <rect x="6" y="18" width="5" height="2" fill="var(--apple-deep)" />
      <rect x="11" y="18" width="2" height="1" fill="var(--apple-deep)" />
      <rect x="13" y="18" width="5" height="2" fill="var(--apple-deep)" />

      <rect x="7" y="20" width="3" height="1" fill="var(--apple-deep)" />
      <rect x="14" y="20" width="3" height="1" fill="var(--apple-deep)" />
    </svg>

    <canvas
      bind:this={canvasEl}
      class="apple-stage__canvas"
      class:is-live={webglReady}
      class:is-dragging={isDragging}
      aria-label={i18n.t.hero.shaderCanvasAria}
    ></canvas>

    {#if workbench.scanlines}
      <div class="apple-stage__scanlines" aria-hidden="true"></div>
    {/if}
  </div>

  <!-- Retro Palette Preset Selector -->
  <div class="theme-bar" role="group" aria-label={i18n.t.hero.themeGroupAria}>
    {#each THEMES as preset (preset.id)}
      <button
        type="button"
        class="theme-chip mono"
        class:is-active={workbench.theme === preset.id}
        aria-pressed={workbench.theme === preset.id}
        onclick={() => workbench.setTheme(preset.id)}
      >
        <span class="theme-chip__idx">{preset.code}</span>
        <span>{preset.shortLabel}</span>
      </button>
    {/each}
  </div>

  <!-- Quantization Mode & Global Spin Counter -->
  <div class="apple-stage__bar">
    <div class="spin-cluster">
      <button
        type="button"
        class="spin-btn mono"
        class:is-pulsing={spinningPulse}
        aria-label={i18n.t.hero.spinAria}
        onclick={handleInteractiveSpin}
      >
        {i18n.t.hero.spinCta}
      </button>
      <span class="apple-stage__status mono">
        {#if spinCount !== null}
          {i18n.t.hero.spinsCount(numberFmt.format(spinCount), spinCount)}
        {:else}
          {reducedMotion ? i18n.t.hero.shaderStatusReduced : i18n.t.hero.shaderStatusIdle}
        {/if}
      </span>
    </div>

    <div class="mode-toggle" role="group" aria-label="Pixel quantization mode">
      <button
        type="button"
        class="mode-toggle__btn mono"
        class:is-active={workbench.mode === '16bit'}
        aria-pressed={workbench.mode === '16bit'}
        onclick={() => workbench.setMode('16bit')}
      >
        {i18n.t.hero.shaderMode16}
      </button>
      <button
        type="button"
        class="mode-toggle__btn mono"
        class:is-active={workbench.mode === '8bit'}
        aria-pressed={workbench.mode === '8bit'}
        onclick={() => workbench.setMode('8bit')}
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
    gap: 0.75rem;
    padding: clamp(0.95rem, 1.8vw, 1.35rem);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    background: var(--bg-raise);
  }

  .specimen-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding-bottom: 0.65rem;
    border-bottom: 1px solid var(--line);
    color: var(--ink-dim);
    font-size: 0.64rem;
    letter-spacing: 0.1em;
  }

  .specimen-head__id {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: var(--ink);
  }

  .specimen-head__dot {
    width: 7px;
    height: 7px;
    border-radius: 2px;
    background: var(--acid);
  }

  .specimen-head__spec {
    color: var(--ink-faint);
    margin-left: auto;
  }

  .crt-btn {
    padding: 0.18rem 0.48rem;
    border-radius: 4px;
    border: 1px solid var(--line);
    font-size: 0.58rem;
    letter-spacing: 0.1em;
    color: var(--ink-faint);
    cursor: pointer;
    transition: background-color 0.2s var(--ease-out), color 0.2s var(--ease-out), border-color 0.2s var(--ease-out);
  }

  .crt-btn.is-on {
    border-color: var(--line-strong);
    color: var(--ink);
    background: var(--hover-wash);
  }

  :global(html.no-js) .specimen-head__spec,
  :global(html.no-js) .crt-btn,
  :global(html.no-js) .theme-bar,
  :global(html.no-js) .apple-stage__bar {
    display: none;
  }

  .apple-stage__viewport {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    max-height: clamp(240px, 42svh, 390px);
    margin-inline: auto;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 8px;
  }

  .apple-stage__spotlight {
    position: absolute;
    inset: 10%;
    border-radius: 50%;
    pointer-events: none;
    background: radial-gradient(
      circle,
      color-mix(in oklab, var(--apple-deep) 28%, transparent) 0%,
      color-mix(in oklab, var(--acid) 9%, transparent) 46%,
      transparent 72%
    );
  }

  .apple-stage__scanlines {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    opacity: 0.35;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0 2px,
      rgb(0 0 0 / 0.18) 2px 3px
    );
  }

  :global(html[data-theme='mac1bit']) .apple-stage__scanlines {
    opacity: 0.18;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0 3px,
      rgb(16 16 20 / 0.08) 3px 4px
    );
  }

  .apple-stage__fallback {
    position: relative;
    z-index: 1;
    width: 68%;
    height: 68%;
    transition: opacity 0.35s var(--ease-out), transform 0.32s var(--ease-out);
  }

  .apple-stage__fallback.is-pulsing {
    transform: scale(1.07) rotate(-8deg);
  }

  @media (prefers-reduced-motion: reduce) {
    .apple-stage__fallback.is-pulsing {
      transform: none;
    }
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

  .theme-bar {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.35rem;
    padding-top: 0.65rem;
    border-top: 1px solid var(--line);
  }

  .theme-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.32rem;
    padding: 0.34rem 0.35rem;
    border-radius: 6px;
    border: 1px solid var(--line);
    color: var(--ink-dim);
    font-size: 0.58rem;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition:
      background-color 0.2s var(--ease-out),
      color 0.2s var(--ease-out),
      border-color 0.2s var(--ease-out);
  }

  .theme-chip:hover {
    color: var(--ink);
    border-color: var(--line-strong);
    background: var(--hover-wash);
  }

  .theme-chip__idx {
    color: var(--ink-faint);
  }

  .theme-chip.is-active {
    background: var(--acid);
    border-color: var(--acid);
    color: var(--acid-ink);
    font-weight: 600;
  }

  .theme-chip.is-active .theme-chip__idx {
    color: var(--acid-ink);
    opacity: 0.8;
  }

  .apple-stage__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    flex-wrap: wrap;
    padding-top: 0.65rem;
    border-top: 1px solid var(--line);
  }

  .spin-cluster {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
  }

  .spin-btn {
    padding: 0.28rem 0.6rem;
    border-radius: 999px;
    border: 1px solid var(--line-strong);
    color: var(--ink);
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    font-weight: 600;
    cursor: pointer;
    transition:
      transform 0.2s var(--ease-out),
      background-color 0.2s var(--ease-out),
      border-color 0.2s var(--ease-out),
      color 0.2s var(--ease-out);
  }

  .spin-btn:hover {
    background: var(--acid);
    border-color: var(--acid);
    color: var(--acid-ink);
  }

  .spin-btn.is-pulsing {
    transform: scale(0.95);
  }

  .apple-stage__status {
    color: var(--ink-faint);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.62rem;
    font-variant-numeric: tabular-nums;
  }

  .mode-toggle {
    display: inline-flex;
    padding: 2px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--bg);
  }

  .mode-toggle__btn {
    padding: 0.24rem 0.58rem;
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
    color: var(--acid-ink);
    font-weight: 600;
  }

  @media (max-width: 460px) {
    .theme-bar {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .specimen-head__spec {
      display: none;
    }
  }
</style>
