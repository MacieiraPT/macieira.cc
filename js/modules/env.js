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

  /**
   * Core count, used only to pick a particle budget in js/scene/index.js.
   * Absence is treated as "fine" — an unknown machine is not a slow one.
   */
  lowCores: (navigator.hardwareConcurrency ?? 8) <= 4,
};

/** Smooth scrolling and choreography: anything but an explicit request for less motion. */
export const allowMotion = !env.reducedMotion;

/**
 * Why the WebGL field is not running, or null when it is.
 *
 * Exactly one thing switches it off: the browser cannot give us a WebGL
 * context. Nothing else — not reduced motion, not Data Saver, not device
 * class. That is a deliberate decision by the site owner: the field is the
 * identity of the page and it runs everywhere it technically can.
 *
 * What that trades away, recorded so it isn't rediscovered as a bug:
 *   - prefers-reduced-motion visitors get the animated field anyway. The
 *     preference still governs everything else on the page — no smooth
 *     scrolling, no intro, no reveals, no sticker physics — so this is the
 *     one exception rather than the setting being ignored wholesale.
 *   - Data Saver visitors get the ~136 kB Three.js chunk. It is still loaded
 *     at idle, after everything else, so it never delays the page itself.
 *
 * Hardware only decides how *many* particles run; see js/scene/index.js,
 * which also drops quality on its own if frames get slow.
 */
export function webglBlockReason() {
  if (!supportsWebGL()) return 'this browser reports no WebGL context at all';
  return null;
}

export const allowWebGL = webglBlockReason() === null;

/** requestIdleCallback with a setTimeout fallback (Safari shipped it late). */
export function whenIdle(fn, timeout = 2000) {
  if ('requestIdleCallback' in window) return window.requestIdleCallback(fn, { timeout });
  return window.setTimeout(fn, 200);
}

/**
 * Waits for webfonts, but never longer than `limit`. Anything that measures
 * text (line splitting) has to run after the real
 * face is in — but not at the cost of a stuck page on a bad connection.
 */
export function fontsReady(limit = 1500) {
  if (!document.fonts) return Promise.resolve();
  return Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, limit)),
  ]);
}
