/**
 * scene/index.js — mounts and drives the WebGL field.
 *
 * This module (and Three.js with it) is only ever reached through a dynamic
 * import in js/main.js, after first paint and only when the device has said
 * yes to it. Nothing on the page waits for it, and if it never loads — no
 * WebGL, Data Saver on, a GPU that gives up mid-session — the CSS backdrop
 * underneath is the design, not an error state.
 *
 * Responsibilities kept here: renderer/camera lifecycle, the frame loop,
 * input, and knowing when to stop. The look lives in particles.js/shaders.js.
 */

import { Group, MathUtils, PerspectiveCamera, Scene, Timer, Vector2, Vector3, WebGLRenderer } from 'three';
import { createParticleField } from './particles.js';
import { APPLE_SILHOUETTE } from '../data/apple.js';
import { env } from '../modules/env.js';

const CAMERA_FOV = 38;
const CAMERA_Z = 14;
/** Above this frame time the watchdog starts giving things up. */
const SLOW_FRAME_MS = 26;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ onReady?: () => void }} [options]
 * @returns {{ setPhase(value: number): void, burst(): void, destroy(): void } | null}
 */
/**
 * Builds the renderer, preferring a real GPU but never refusing to run without
 * one.
 *
 * `failIfMajorPerformanceCaveat: true` makes the browser hand back nothing
 * when it would have to fall back to software rendering. That sounds prudent
 * and is a bad trade in practice: it fires on any desktop with hardware
 * acceleration switched off, a blocklisted driver, a VM, or a remote desktop
 * session — machines that render this field perfectly well. So we ask for the
 * good context first, then accept the compromised one and turn the quality
 * down to match.
 *
 * @returns {{ renderer: WebGLRenderer, software: boolean } | null}
 */
function createRenderer(canvas) {
  const options = {
    canvas,
    alpha: true,
    antialias: false, // additive points don't benefit; MSAA just costs fill rate
    powerPreference: 'high-performance',
  };

  try {
    return { renderer: new WebGLRenderer({ ...options, failIfMajorPerformanceCaveat: true }), software: false };
  } catch {
    /* no hardware path — take what we can get */
  }

  try {
    return { renderer: new WebGLRenderer(options), software: true };
  } catch {
    return null; // genuinely no WebGL; the CSS backdrop stands in
  }
}

export function mountScene(canvas, { onReady } = {}) {
  const context = createRenderer(canvas);
  if (!context) return null;
  const { renderer, software } = context;

  // Hardware decides how *much* runs, never whether it runs. A software
  // rasteriser pays per fragment, so it gets fewer, and the frame-time
  // watchdog below can still cut further if this guess was optimistic.
  const count = software ? 6000 : env.smallScreen ? 9000 : env.lowCores ? 15000 : 26000;
  let pixelRatio = software ? 1 : Math.min(window.devicePixelRatio || 1, 1.75);
  // A phone screen puts the field much closer to the text it sits behind.
  const baseOpacity = env.smallScreen ? 0.7 : 1;

  const styles = getComputedStyle(document.documentElement);
  const field = createParticleField({
    count,
    // The same mark as the masthead and the hero: macieira, an apple tree.
    shape: APPLE_SILHOUETTE,
    colorA: styles.getPropertyValue('--acid').trim() || '#cdfb45',
    colorB: styles.getPropertyValue('--plasma').trim() || '#7d5cff',
    pixelRatio,
  });

  renderer.setPixelRatio(pixelRatio);
  renderer.setClearAlpha(0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
  camera.position.z = CAMERA_Z;

  const group = new Group();
  group.add(field.points);
  scene.add(group);

  /* ---------------------------------------------------------------------- */
  /* State                                                                   */
  /* ---------------------------------------------------------------------- */

  // Timer (three's replacement for Clock) hooks the Page Visibility API, so
  // a backgrounded tab can't come back with a multi-second delta.
  const timer = new Timer();
  timer.connect(document);
  const pointer = new Vector2(0, 0);        // -1..1, raw
  const pointerEased = new Vector2(0, 0);   // -1..1, smoothed
  const cursorWorld = new Vector3();
  let targetPhase = 0;
  let phase = 0;
  let targetOpacity = baseOpacity;
  let burstEnergy = 0;
  let spin = 0;
  let running = true;
  let frameHandle = 0;
  let firstFrame = true;

  // Frame-time watchdog: two strikes, two mitigations, then it stops nagging.
  let sampled = 0;
  let accumulated = 0;
  let mitigations = 0;

  /* ---------------------------------------------------------------------- */
  /* Sizing                                                                  */
  /* ---------------------------------------------------------------------- */

  function resize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false); // false: CSS owns the canvas box
  }

  /** Half-extents of the z = 0 plane in world units — used to place the cursor. */
  function viewportAtOrigin() {
    const halfHeight = Math.tan(MathUtils.degToRad(CAMERA_FOV) / 2) * CAMERA_Z;
    return { halfHeight, halfWidth: halfHeight * camera.aspect };
  }

  /* ---------------------------------------------------------------------- */
  /* Input                                                                   */
  /* ---------------------------------------------------------------------- */

  function onPointerMove(event) {
    pointer.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -((event.clientY / window.innerHeight) * 2 - 1)
    );
  }

  function onPointerDown() {
    burstEnergy = 1;
  }

  function onVisibilityChange() {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  }

  /**
   * A lost context means the browser (or the OS) took the GPU away. Rather
   * than fight for it, hand the page back to the CSS backdrop.
   */
  function onContextLost(event) {
    event.preventDefault();
    stop();
    canvas.classList.remove('is-live');
    document.documentElement.classList.remove('scene-live');
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVisibilityChange);
  canvas.addEventListener('webglcontextlost', onContextLost);

  /* ---------------------------------------------------------------------- */
  /* Frame loop                                                              */
  /* ---------------------------------------------------------------------- */

  function watchPerformance(frameMs) {
    if (mitigations > 1) return;
    accumulated += frameMs;
    sampled += 1;
    if (sampled < 120) return;

    const average = accumulated / sampled;
    accumulated = 0;
    sampled = 0;
    if (average <= SLOW_FRAME_MS) return;

    mitigations += 1;
    if (mitigations === 1 && pixelRatio > 1) {
      // Fill rate is almost always the bottleneck for additive points.
      pixelRatio = 1;
      renderer.setPixelRatio(pixelRatio);
      field.material.uniforms.uPixelRatio.value = pixelRatio;
      resize();
    } else {
      // Still slow: draw fewer points. setDrawRange avoids rebuilding buffers.
      field.geometry.setDrawRange(0, Math.floor(count * 0.55));
      mitigations = 2;
    }
  }

  function frame(timestamp) {
    frameHandle = requestAnimationFrame(frame);

    timer.update(timestamp);
    const delta = Math.min(timer.getDelta(), 0.05); // clamp after a tab stall
    const uniforms = field.material.uniforms;

    // Ease everything the pointer and the scroll write, so no input jitters
    // straight into the geometry.
    phase += (targetPhase - phase) * Math.min(1, delta * 4.5);
    pointerEased.lerp(pointer, Math.min(1, delta * 3.5));
    burstEnergy *= Math.exp(-delta * 3.2);

    // Locked to the apple: 0 while the field is loose, 1 once it has resolved.
    const settle = MathUtils.clamp(phase - 1, 0, 1);
    const journey = MathUtils.clamp(phase, 0, 2) / 2;

    // The cloud starts high over the tree — the left half of the hero, where
    // the only thing it can land on is canopy — and travels to centre as it
    // becomes the apple. Keeping it off the right column is what lets the
    // wordmark and the fact cards there stay legible without a scrim behind
    // them. On phones the hero is one column, so it goes straight overhead.
    group.position.x = MathUtils.lerp(env.smallScreen ? 0 : -3.4, 0, journey);
    group.position.y = MathUtils.lerp(env.smallScreen ? 4.0 : 2.2, 0, journey);

    spin += delta * 0.1 * (1 - settle);
    group.rotation.y = MathUtils.lerp(spin, 0, settle) + pointerEased.x * 0.22;
    group.rotation.x = -pointerEased.y * 0.13;

    // Cursor → world → the cloud's own space, so repulsion still lines up
    // once the group has been moved and rotated.
    const { halfWidth, halfHeight } = viewportAtOrigin();
    cursorWorld.set(pointerEased.x * halfWidth, pointerEased.y * halfHeight, 0);
    group.updateMatrixWorld();
    group.worldToLocal(cursorWorld);
    uniforms.uMouse.value.set(cursorWorld.x, cursorWorld.y);

    uniforms.uTime.value = timer.getElapsed();
    uniforms.uPhase.value = phase;
    uniforms.uBurst.value = burstEnergy;
    // Phase 0 is atmosphere behind the hero — the tree is the thing being
    // looked at there, and the field's own moment comes later, as the wave and
    // then the apple. So it starts at half strength and earns the rest.
    const wanted = targetOpacity * MathUtils.lerp(0.45, 1, MathUtils.clamp(phase, 0, 1));
    uniforms.uOpacity.value += (wanted - uniforms.uOpacity.value) * Math.min(1, delta * 2.5);

    const started = performance.now();
    renderer.render(scene, camera);
    watchPerformance(performance.now() - started);

    if (firstFrame) {
      firstFrame = false;
      canvas.classList.add('is-live');
      document.documentElement.classList.add('scene-live');
      onReady?.();
    }
  }

  function start() {
    if (running && frameHandle) return;
    running = true;
    timer.reset();
    frameHandle = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frameHandle);
    frameHandle = 0;
  }

  resize();
  start();

  /* ---------------------------------------------------------------------- */

  return {
    /** Scroll position, 0 (orb) → 1 (wave) → 2 (apple). */
    setPhase(value) {
      targetPhase = value;
    },
    /**
     * Global alpha, eased, as a fraction of this device's base level. Used to
     * step the field back behind dense content like the GitHub panel.
     */
    setOpacity(value) {
      targetOpacity = value * baseOpacity;
    },
    burst() {
      burstEnergy = 1;
    },
    destroy() {
      stop();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      timer.disconnect();
      field.geometry.dispose();
      field.material.dispose();
      renderer.dispose();
    },
  };
}
