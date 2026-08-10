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
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000)); // gsap.ticker is in seconds, Lenis wants ms
  gsap.ticker.lagSmoothing(0); // never let GSAP "catch up" after a stall; it desyncs the scroll

  return lenis;
}

/**
 * Anchor links. Handled manually rather than with Lenis' `anchors` option so
 * the same code path works when Lenis isn't running at all (reduced motion),
 * and so the URL hash still updates for shareable links.
 */
export function initAnchors(lenis) {
  document.querySelectorAll('a[data-anchor]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      const target = hash && hash.startsWith('#') ? document.querySelector(hash) : null;
      if (!target) return;

      event.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: HEADER_OFFSET, duration: 1.4 });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      history.pushState(null, '', hash);
    });
  });
}
