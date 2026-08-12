/**
 * hero.js — the opening choreography.
 *
 * One GSAP timeline owns the whole intro so the pieces are positioned
 * relative to each other (overlapping deliberately) instead of racing on
 * independent delays. Everything animated here starts hidden in CSS *only*
 * when JS is running and motion is welcome — see the reveal contract in
 * base.css — so this is enhancement, never a gate on the content.
 *
 * The tree grows here rather than in js/modules/details.js, and the logo
 * fills in here rather than being coloured by the anime.js pass that draws
 * its outline. Both for the same reason: this module is on the critical
 * path and details.js is fetched at idle. Anything that ends with content
 * on screen has to be owned by the one that always runs — details.js is only
 * ever allowed to make something that already works look better.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env } from './env.js';
import { splitChars } from './split.js';

export function playIntro() {
  // Nothing here is reactive: the intro and the parallax below both start on
  // their own, which is exactly the half of the page the preference switches
  // off (see env.js). base.css has already released every start state, so the
  // hero is simply *there* — which is also what it should have been all along
  // for anyone whose fonts or chunks were slow.
  if (env.reducedMotion) return null;

  const name = document.querySelector('[data-hero="name"]');
  const chars = name ? splitChars(name) : [];

  const lede = document.querySelector('[data-hero="lede"]');
  const actions = document.querySelector('[data-hero="actions"]');
  const basket = document.querySelector('[data-hero="basket"]');

  // The orchard. Branches are hidden by a dash offset the stylesheet can set
  // on its own (every path declares pathLength="1", so one rule covers all
  // thirteen); the fruit and the foliage by opacity.
  const branches = document.querySelectorAll('.orchard__wood [data-branch]');
  const canopy = document.querySelector('[data-canopy]'); // the CSS glow, shared by both trees
  const apples = document.querySelectorAll('.orchard .apple');
  const logoFills = document.querySelectorAll('.monogram__body, .monogram__leaf');

  gsap.set(chars, { yPercent: 118 });
  gsap.set([lede, actions, basket], { y: 22 });

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

    // The tree draws itself trunk-first, because that is the order the
    // branches are written in — the stagger doesn't need to know the shape.
    .to(branches, { strokeDashoffset: 0, duration: 1.5, stagger: 0.07, ease: 'power2.inOut' }, 0.1)
    .to(canopy, { opacity: 1, duration: 1.5, ease: 'power2.out' }, 0.45)

    // Quicker than it was: at 0.075 per character a fifteen-letter name spent
    // 1.1 s assembling *after* its own 1.4 s tween, so the one word an employer
    // is here to read finished arriving somewhere near the third second. The
    // shape of the reveal survives the tightening; the wait does not.
    .set(name, { opacity: 1 }, 0.2)
    .to(chars, { yPercent: 0, duration: 1, stagger: 0.04 }, 0.2)
    .to(axis, { wdth: 118, duration: 1.2, ease: 'power3.out', onUpdate: applyAxis }, 0.2)

    // Fruit ripens onto the finished branches, in a random order so it reads
    // as seven separate apples rather than one wipe across the canopy.
    .to(
      apples,
      {
        opacity: 1,
        scale: 1,
        duration: 0.9,
        ease: 'back.out(2.1)',
        stagger: { each: 0.075, from: 'random' },
      },
      0.95
    )

    // The two buttons ride in with the sentence above them. They carry
    // `data-hero`, so base.css holds them at opacity 0 until this line runs —
    // which makes this the one tween on the page that a *call to action*
    // depends on, and the reason the whole timeline no longer waits for fonts.
    .to([lede, actions, basket], { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }, 0.55)
    // The mark in the masthead fills in last — anime.js has been drawing its
    // outline since ~250 ms, and this is the colour arriving behind it.
    .to(logoFills, { fillOpacity: 1, duration: 0.8, ease: 'power2.out' }, 1.05)
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
