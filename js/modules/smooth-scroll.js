/**
 * smooth-scroll.js — Lenis, wired into GSAP's ticker.
 *
 * The important part is that there is exactly ONE clock on this page.
 * Lenis is *not* left to run its own requestAnimationFrame loop: it is driven
 * by `gsap.ticker`, and it tells ScrollTrigger to update whenever it moves.
 * That ordering (lenis.raf → scroll event → ScrollTrigger.update → tweens)
 * is what keeps pinned elements and scrubbed animations locked to the
 * interpolated scroll position instead of lagging a frame behind it.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/** Offset used when scrolling to an anchor, so the fixed masthead never covers it. */
const HEADER_OFFSET = -84;

/**
 * How long an anchor scroll runs for, in seconds: the travel divided by
 * ANCHOR_SPEED, then clamped.
 *
 * A single fixed duration was the wrong shape for a page this tall. The
 * masthead tabs are 800 px apart at the top and 3800 px apart end to end, and
 * giving both the same 1.4 s meant the short hop crawled while the long one
 * moved at four screens a second — which reads as a jump, not as a scroll.
 * Tying the duration to the distance keeps the *speed* roughly constant
 * instead, so every tab feels like the same gesture. The ceiling is the old
 * 1.4 s, so the longest scroll on the page is unchanged.
 */
const ANCHOR_SPEED = 2800; // px per second
const ANCHOR_MIN = 0.7;
const ANCHOR_MAX = 1.4;

/**
 * ease-in-out cubic, shared by Lenis and by the no-Lenis fallback below.
 *
 * Lenis' own default is an expo *out*, which spends nearly a third of the
 * travel in the first 50 ms. On a short hop that is fine; on a long one the
 * page has already arrived before the eye has followed it, and the tail end
 * is all that reads as motion. Easing in as well as out costs a little
 * immediacy at the start and buys a scroll you can actually track.
 */
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const clamp = (low, value, high) => Math.min(high, Math.max(low, value));

export function createSmoothScroll() {
  const lenis = new Lenis({
    // A slightly long ramp: heavy enough to feel like weight, short enough
    // that the page still answers immediately to a flick on a trackpad.
    lerp: 0.085,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
    // Touch devices already have excellent native inertia; overriding it
    // usually makes things worse, so Lenis only smooths wheel input.
    smoothWheel: true,
    syncTouch: false,
    autoRaf: false, // GSAP owns the loop — see below.
    // Off even though the rest of the page now honours the preference — see
    // the policy note in env.js. Lenis' flag does exactly one thing, and it is
    // not "less motion": it forces `immediate: true` on every programmatic
    // scrollTo, so the masthead tabs teleport while the wheel keeps its
    // inertia. A jump cut is not a reduced scroll, it is a worse one, and the
    // scroll is reactive motion either way — it only ever moves because
    // somebody asked it to.
    respectReducedMotion: false,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000)); // gsap.ticker is in seconds, Lenis wants ms
  gsap.ticker.lagSmoothing(0); // never let GSAP "catch up" after a stall; it desyncs the scroll

  return lenis;
}

/**
 * Anchor links — the masthead tabs, the hero cue, "back to top".
 *
 * Handled manually rather than with Lenis' `anchors` option so the same code
 * path works when Lenis isn't running at all (its constructor threw, and
 * `safely()` in main.js handed us null), and so the URL hash still updates for
 * shareable links.
 */
export function initAnchors(lenis) {
  document.querySelectorAll('a[data-anchor]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      const target = hash && hash.startsWith('#') ? document.querySelector(hash) : null;
      if (!target) return;

      event.preventDefault();

      // Where the page has to end up, in document coordinates. Lenis works
      // this out for itself from the element, but the duration depends on how
      // far away it is, so it has to be measured here either way.
      const goal = clamp(
        0,
        target.getBoundingClientRect().top + window.scrollY + HEADER_OFFSET,
        Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      );
      const duration = clamp(ANCHOR_MIN, Math.abs(goal - window.scrollY) / ANCHOR_SPEED, ANCHOR_MAX);

      if (lenis) {
        lenis.scrollTo(target, { offset: HEADER_OFFSET, duration, easing: easeInOutCubic });
      } else {
        // Not `scrollIntoView({ behavior: 'smooth' })`: it ignores the header
        // offset, so the heading lands underneath the masthead — and browsers
        // turn it into an instant jump under reduced motion, which is the
        // teleport this whole function exists to avoid. GSAP is already here.
        const proxy = { y: window.scrollY };
        gsap.to(proxy, {
          y: goal,
          duration,
          ease: easeInOutCubic,
          overwrite: true,
          onUpdate: () => window.scrollTo(0, proxy.y),
        });
      }

      history.pushState(null, '', hash);
    });
  });
}
