/**
 * main.js — the only entry point.
 *
 * Boot order is deliberate, and it is the performance story of this page:
 *
 *   1. Interactions that must work no matter what (copy buttons, clock).
 *   2. The scroll layer — Lenis driven by GSAP's ticker.
 *   3. Anything that measures text, once webfonts have settled.
 *   4. Idle work: the live GitHub panel, then the anime.js details.
 *   5. Idle + capability-gated: the WebGL field, ~130 kB that is never
 *      fetched unless the device has agreed to it.
 *
 * Critical-path JS is steps 1–3 (GSAP + Lenis + this app code, ~55 kB gzip).
 * Everything below that is additive, and every step is independently
 * survivable — a failure in one does not take the page down with it.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { allowMotion, allowWebGL, fontsReady, whenIdle } from './modules/env.js';
import { createSmoothScroll, initAnchors } from './modules/smooth-scroll.js';
import { playIntro } from './modules/hero.js';
import {
  initMagnetic,
  initMarquee,
  initNav,
  initPin,
  initProgress,
  initReveals,
  initTint,
} from './modules/reveals.js';
import { initClock, initCopyButtons } from './modules/ui.js';
import { initWork } from './modules/work.js';

gsap.registerPlugin(ScrollTrigger);

// Tells the failsafe in index.html that the module graph is alive, which
// releases the CSS rules that keep reveal targets hidden.
document.documentElement.classList.add('booted');

/* -------------------------------------------------------------------------- */
/* 1. Baseline interactions                                                    */
/* -------------------------------------------------------------------------- */

initCopyButtons();
initClock();
initWork();

/* -------------------------------------------------------------------------- */
/* 2. Scroll layer                                                             */
/* -------------------------------------------------------------------------- */

// Reduced motion gets the browser's own scrolling — inertia is exactly the
// kind of thing that setting exists to switch off.
const lenis = allowMotion ? createSmoothScroll() : null;
initAnchors(lenis);

/* -------------------------------------------------------------------------- */
/* 3. Choreography (after fonts, because line splitting measures text)         */
/* -------------------------------------------------------------------------- */

await fontsReady();

initReveals();
initPin();
initProgress();
initNav();
initTint();
initMarquee();
initMagnetic();
playIntro();

// Fonts swapping in changes every measurement ScrollTrigger took at setup.
ScrollTrigger.refresh();

/* -------------------------------------------------------------------------- */
/* 4. Deferred enhancements                                                    */
/* -------------------------------------------------------------------------- */

// Live GitHub data. Refreshing ScrollTrigger afterwards matters: real
// repositories make the panel taller, which moves every trigger below it.
// Live GitHub data. Imported here rather than at the top so the fetch layer
// isn't part of first paint either. The panel renders its own failure state,
// so the catch only has to stay quiet enough not to break the page — but
// loud enough to be findable in devtools.
whenIdle(() => {
  import('./modules/github.js')
    .then(({ initGitHub }) => initGitHub(() => ScrollTrigger.refresh()))
    .catch((error) => console.warn('[macieira.cc] GitHub panel:', error));
});

// anime.js (~24 kB gzip) arrives with its module, not before it.
// If it never arrives: the SVG paths stay drawn and the stickers stay put.
whenIdle(() => {
  import('./modules/details.js')
    .then(({ initDetails }) => initDetails())
    .catch((error) => console.warn('[macieira.cc] details layer:', error));
});

/* -------------------------------------------------------------------------- */
/* 5. WebGL field                                                              */
/* -------------------------------------------------------------------------- */

if (allowWebGL) {
  whenIdle(mountBackdrop, 2500);
}

async function mountBackdrop() {
  const canvas = document.querySelector('[data-scene-canvas]');
  if (!canvas) return;

  let scene = null;
  // Scroll can move before the module resolves, so the current value is kept
  // here and handed over the moment the scene exists.
  let phase = 0;

  const setPhase = (value) => {
    phase = value;
    scene?.setPhase(value);
  };

  /**
   * Two scrubbed triggers, deliberately non-overlapping, map the page onto
   * the field's morph:
   *   hero → play : the orb loosens into a drifting wave field
   *   play → seam : the field pulls together into the "M"
   * It then stays as the letterform behind the dev section, dimmed so the
   * GitHub panel keeps its contrast.
   */
  ScrollTrigger.create({
    trigger: '.section--play',
    start: 'top bottom',
    end: 'top center',
    scrub: true,
    onUpdate: (self) => setPhase(self.progress),
  });

  ScrollTrigger.create({
    trigger: '.seam',
    start: 'top bottom',
    end: 'top 40%',
    scrub: true,
    onUpdate: (self) => setPhase(1 + self.progress),
  });

  ScrollTrigger.create({
    trigger: '.section--dev',
    start: 'top 60%',
    end: 'max',
    onToggle: ({ isActive }) => scene?.setOpacity(isActive ? 0.4 : 1),
  });

  try {
    const { mountScene } = await import('./scene/index.js');
    scene = mountScene(canvas, { onReady: () => ScrollTrigger.refresh() });
    scene?.setPhase(phase);
  } catch (error) {
    // Chunk failed, or the GPU refused the context. The CSS backdrop already
    // looks like the finished design, so there is nothing to swap in — but
    // don't swallow the reason, or the next bug here is invisible.
    console.warn('[macieira.cc] WebGL scene:', error);
  }
}
