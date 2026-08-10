/**
 * hero.js — the opening choreography.
 *
 * One GSAP timeline owns the whole intro so the pieces are positioned
 * relative to each other (overlapping deliberately) instead of racing on
 * independent delays. Everything animated here starts hidden in CSS *only*
 * when JS is running and motion is welcome — see the reveal contract in
 * base.css — so this is enhancement, never a gate on the content.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitChars } from './split.js';
import { env } from './env.js';

export function playIntro() {
  const name = document.querySelector('[data-hero="name"]');
  const chars = name ? splitChars(name) : [];

  // Reduced motion: the split still runs (it only adds the aria-label and
  // some spans), but nothing moves and nothing was hidden to begin with.
  if (env.reducedMotion) return null;

  const lede = document.querySelector('[data-hero="lede"]');
  const facts = document.querySelector('[data-hero="facts"]');

  gsap.set(chars, { yPercent: 118 });
  gsap.set([lede, facts], { y: 22 });

  // The display face has a width axis. Opening narrow and letting the
  // wordmark widen as it rises makes the reveal feel like it is being
  // *set* rather than just moved — the one thing a static font can't do.
  const axis = { wdth: 74 };
  const applyAxis = () => {
    if (name) name.style.fontVariationSettings = `'wdth' ${axis.wdth.toFixed(1)}`;
  };
  applyAxis();

  const tl = gsap.timeline({
    defaults: { ease: 'expo.out' },
    onComplete: () => {
      // Hand the axis back to the stylesheet so a later resize re-evaluates it.
      if (name) name.style.removeProperty('font-variation-settings');
    },
  });

  tl.to('[data-hero="kicker"]', { opacity: 1, duration: 0.9 }, 0.15)
    .set(name, { opacity: 1 }, 0.2)
    .to(chars, { yPercent: 0, duration: 1.4, stagger: 0.075 }, 0.2)
    .to(axis, { wdth: 118, duration: 1.6, ease: 'power3.out', onUpdate: applyAxis }, 0.2)
    .to([lede, facts], { opacity: 1, y: 0, duration: 1.1, stagger: 0.12 }, 0.8)
    .to('[data-hero="cue"]', { opacity: 1, duration: 0.9 }, 1.15);

  // Leaving the hero: the block drifts up and dims slightly faster than the
  // scroll, which hands the stage over to the first section.
  gsap.to('.hero__inner', {
    yPercent: -14,
    opacity: 0.15,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 0.4,
    },
  });

  return tl;
}
