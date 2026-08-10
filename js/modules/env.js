/**
 * env.js — one place that answers "how much is this device willing to do?".
 *
 * Every expensive feature on the page (Lenis, the GSAP choreography, the
 * WebGL field) asks here first, so the decisions live together instead of
 * being scattered as ad-hoc `if (matchMedia(...))` checks.
 */

const mq = (query) => window.matchMedia?.(query).matches ?? false;

/** Cheap, cached WebGL probe — creating a context is not free, so do it once. */
let webglSupport;
export function supportsWebGL() {
  if (webglSupport !== undefined) return webglSupport;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    webglSupport = Boolean(gl && gl.getExtension);
    // Release the probe context immediately; browsers cap how many can exist.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

export const env = {
  reducedMotion: mq('(prefers-reduced-motion: reduce)'),
  coarsePointer: mq('(hover: none)'),
  finePointer: mq('(hover: hover) and (pointer: fine)'),
  smallScreen: mq('(max-width: 860px)'),

  /** Data Saver / metered connection — a strong "don't download 130 kB of Three.js" signal. */
  saveData: Boolean(navigator.connection?.saveData),

  /** Rough device class. `deviceMemory` is Chromium-only; absence is treated as "fine". */
  lowMemory: (navigator.deviceMemory ?? 8) <= 2,
  lowCores: (navigator.hardwareConcurrency ?? 8) <= 4,
};

/** Smooth scrolling and choreography: anything but an explicit request for less motion. */
export const allowMotion = !env.reducedMotion;

/**
 * The WebGL field is the single heaviest thing here, so it needs everything:
 * motion is welcome, the GPU exists, and the connection/device isn't asking
 * for mercy. Failing this check is not a degraded page — the CSS backdrop is
 * a designed fallback, not an empty box.
 */
export const allowWebGL =
  allowMotion && !env.saveData && !env.lowMemory && supportsWebGL();

/** requestIdleCallback with a setTimeout fallback (Safari shipped it late). */
export function whenIdle(fn, timeout = 2000) {
  if ('requestIdleCallback' in window) return window.requestIdleCallback(fn, { timeout });
  return window.setTimeout(fn, 200);
}

/**
 * Waits for webfonts, but never longer than `limit`. Anything that measures
 * text (line splitting, canvas glyph sampling) has to run after the real
 * face is in — but not at the cost of a stuck page on a bad connection.
 */
export function fontsReady(limit = 1500) {
  if (!document.fonts) return Promise.resolve();
  return Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, limit)),
  ]);
}
