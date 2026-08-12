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
  coarsePointer: mq('(hover: none)'),
  finePointer: mq('(hover: hover) and (pointer: fine)'),
  smallScreen: mq('(max-width: 860px)'),

  /** See the policy note below. Read by reveals.js, hero.js and tree.js. */
  reducedMotion: mq('(prefers-reduced-motion: reduce)'),

  /**
   * Core count, used only to pick a particle budget in js/scene/index.js.
   * Absence is treated as "fine" — an unknown machine is not a slow one.
   */
  lowCores: (navigator.hardwareConcurrency ?? 8) <= 4,
};

/**
 * `prefers-reduced-motion`: reduce, don't remove.
 *
 * The history matters, because both extremes have already been tried here.
 * The preference first switched off Lenis, the hero intro, the scroll reveals
 * and the sticker physics — and half the page animating while the other half
 * sat still read as broken rather than as considerate. So it was made to
 * switch off nothing at all, which was worse in a quieter way: the claim that
 * justified it ("no parallax on text") was not even true — hero.js scrubs the
 * whole hero block, headline included, on scroll.
 *
 * The line that actually holds is not "how much motion" but "who started it":
 *
 *   Reactive motion stays. The smooth scroll and the tree answer a wheel, a
 *   drag or a click, they stop when the visitor stops, and they are the page
 *   rather than an effect applied to it. Someone who gets neither is looking
 *   at a different site.
 *
 *   Self-starting motion goes. The marquee, the pulsing status dots, the
 *   scroll cue, the idle bob in the canopy, the hero parallax and the entrance
 *   reveals all run without being asked. That is the category the preference
 *   exists for, and the looping half of it is WCAG 2.2.2 (Level A) as soon as
 *   it outlasts five seconds beside other content — with no pause control on
 *   this page, all of them did.
 *
 * Anything with a CSS-only start state is released in the reduced-motion block
 * at the bottom of base.css; anything driven by a tween is skipped by the
 * module that owns it. The two halves have to agree — release an element in
 * CSS while its tween still runs and it flashes.
 *
 * One caveat, because it cost a bug: nothing here can enforce the policy on a
 * library that checks the media query itself. Lenis does, and its
 * `respectReducedMotion` default silently turned every anchor scroll into a
 * teleport while the wheel stayed smooth — which is why it stays off even now
 * that the preference is honoured everywhere else. Reactive motion stays
 * reactive; a teleport is not a reduced scroll, it is a broken one. Any
 * library added later needs the same audit.
 */

/**
 * Why the WebGL field is not running, or null when it is.
 *
 * Exactly one thing switches it off: the browser cannot give us a WebGL
 * context. Nothing else — not reduced motion, not Data Saver, not device
 * class. That is a deliberate decision by the site owner: the field is the
 * identity of the page and it runs everywhere it technically can.
 *
 * What that trades away, recorded so it isn't rediscovered as a bug:
 *   - Data Saver visitors get the ~135 kB Three.js chunk. It is still loaded
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

/**
 * requestIdleCallback with a setTimeout fallback (Safari shipped it late).
 *
 * The fallback can't detect idle, so it approximates it with a delay — but it
 * has to keep the *ordering* the caller asked for, which a flat constant threw
 * away. `whenIdle(mountBackdrop, 2500)` exists precisely so the ~135 kB WebGL
 * field arrives after everything else; with a fixed 200 ms it arrived at the
 * same moment as the two steps it is meant to queue behind. A fraction of the
 * requested deadline scales with the caller's intent and keeps the old 200 ms
 * as the floor, so nothing that asked for the default got slower.
 */
export function whenIdle(fn, timeout = 2000) {
  if ('requestIdleCallback' in window) return window.requestIdleCallback(fn, { timeout });
  return window.setTimeout(fn, Math.max(200, timeout * 0.2));
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
