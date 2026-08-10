/**
 * main.js — the only entry point.
 *
 * Boot order is deliberate, and it is the performance story of this page:
 *
 *   1. The language, then the interactions that must work no matter what
 *      (copy buttons, clock, the apple tree), then the 3D tree — the one
 *      deferred chunk that is asked for immediately, because it *is* the
 *      front page.
 *   2. The scroll layer — Lenis driven by GSAP's ticker.
 *   3. Anything that measures text, once webfonts have settled.
 *   4. Idle work: the live GitHub panel, then the anime.js details.
 *   5. Idle: the WebGL field, ~135 kB, fetched last and only where the
 *      browser can actually give us a context.
 *
 * Steps 1 and 5 share the Three.js chunk, so the field is nearly free by the
 * time it asks. They also compete for a WebGL context, and browsers cap how
 * many a page may hold: the tree asks first on purpose, because it is content
 * and the field is atmosphere with a CSS fallback already painted behind it.
 *
 * Critical-path JS is steps 1–3 (GSAP + Lenis + this app code, ~55 kB gzip).
 * Everything below that is additive, and every step is independently
 * survivable — a failure in one does not take the page down with it.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { allowWebGL, fontsReady, webglBlockReason, whenIdle } from './modules/env.js';
import { createSmoothScroll, initAnchors } from './modules/smooth-scroll.js';
import { initLanguage } from './modules/lang.js';
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
import { initScrollbar } from './modules/scrollbar.js';
import { initTree } from './modules/tree.js';
import { initAge, initClock, initCopyButtons } from './modules/ui.js';
import { initWork } from './modules/work.js';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;

/* -------------------------------------------------------------------------- */
/* 0. The safety net                                                           */
/* -------------------------------------------------------------------------- */

/**
 * base.css hides animated elements while the page boots, on the promise that
 * JS will bring them back. `boot-failed` is how that promise gets released.
 *
 * The inline failsafe in index.html covers a module graph that never loads.
 * This covers everything after it — because the failure that actually matters
 * is subtler: the modules load, `booted` disarms the failsafe, and *then* one
 * call throws in one browser. Everything downstream never runs, the hiding
 * rules stay on, and the page is blank in that browser and perfect in every
 * other. Content visibility is not allowed to depend on any of this working.
 */
function releaseHiddenContent() {
  root.classList.add('boot-failed');
}

window.addEventListener('error', (event) => {
  // Failed resource loads bubble here too; only script errors mean the
  // choreography is compromised.
  if (event instanceof ErrorEvent) releaseHiddenContent();
});
window.addEventListener('unhandledrejection', releaseHiddenContent);

/** Runs one feature in isolation: a failure costs that feature, not the page. */
function safely(label, fn) {
  try {
    return fn();
  } catch (error) {
    console.warn(`[macieira.cc] ${label} failed:`, error);
    releaseHiddenContent();
    return undefined;
  }
}

// Tells the inline failsafe that the module graph is alive.
root.classList.add('booted');

/* -------------------------------------------------------------------------- */
/* 1. Baseline interactions                                                    */
/* -------------------------------------------------------------------------- */

// First, and before anything else has touched the DOM: this is what captures
// the English that shipped in the document, and a Portuguese visitor should
// never see a frame of English on the way to their own language.
safely('language', initLanguage);

safely('copy buttons', initCopyButtons);
safely('clock', initClock);
safely('age', initAge);
safely('work grid', initWork);
// Before the font wait below, not after: the six facts all ship in the HTML,
// and this is what collapses them into a deck. A second of them stacked up
// while a webfont downloads would be a worse first impression than the wait.
const tree = safely('apple tree', initTree) ?? null;

// The 3D tree, requested straight away rather than at idle. It is the front
// page, and the SVG tree in the markup is a fallback for browsers that can't
// run this — not a loading state anyone should be shown on the way to it. So
// `expectRenderer()` keeps the SVG out of sight from the first paint, and the
// only thing that puts it back is this failing.
//
// Placed above the `await` below so the fetch starts immediately; it is a
// separate chunk, so nothing on the page waits for it either way.
if (tree && allowWebGL) {
  tree.expectRenderer();
  import('./scene/orchard.js')
    .then(({ mountOrchard }) => {
      const canvas = document.querySelector('[data-orchard-canvas]');
      if (!canvas || !mountOrchard(canvas, tree)) tree.abandonRenderer();
    })
    .catch((error) => {
      console.warn('[macieira.cc] 3D tree:', error);
      tree.abandonRenderer();
    });
}

/* -------------------------------------------------------------------------- */
/* 2. Scroll layer                                                             */
/* -------------------------------------------------------------------------- */

// Unconditional: the inertia is the feel of the page, and it is what every
// scroll-linked thing below measures against. See the note in env.js.
const lenis = safely('smooth scroll', createSmoothScroll) ?? null;
safely('anchor links', () => initAnchors(lenis));
// After Lenis, because the bar hands it a target during a drag — and early,
// because taking the native scrollbar away reflows the page by its width.
safely('scrollbar', () => initScrollbar(lenis));

/* -------------------------------------------------------------------------- */
/* 3. Choreography (after fonts, because line splitting measures text)         */
/* -------------------------------------------------------------------------- */

await fontsReady().catch(() => {});

safely('reveals', initReveals);
safely('pinned rail', initPin);
safely('progress bar', initProgress);
safely('nav state', initNav);
safely('accent tint', initTint);
safely('marquee', initMarquee);
safely('magnetic buttons', initMagnetic);
safely('hero intro', playIntro);

// Fonts swapping in changes every measurement ScrollTrigger took at setup.
safely('scroll refresh', () => ScrollTrigger.refresh());

/* -------------------------------------------------------------------------- */
/* 4. Deferred enhancements                                                    */
/* -------------------------------------------------------------------------- */

// Live GitHub data, imported here rather than at the top so the fetch layer
// isn't part of first paint. Refreshing ScrollTrigger afterwards matters:
// real repositories make the panel taller, which moves every trigger below
// it. The panel renders its own failure state, so the catch only has to stay
// quiet enough not to break the page — but loud enough to find in devtools.
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
} else {
  // Say so out loud. "The particles don't show up on my machine" is otherwise
  // an unanswerable question.
  console.info(
    `[macieira.cc] WebGL field off — ${webglBlockReason()}. The CSS backdrop is standing in.`
  );
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
   *   play → seam : the field pulls together into the apple
   * It then stays as the apple behind the dev section, dimmed so the
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
    if (scene) {
      scene.setPhase(phase);
    } else {
      console.info('[macieira.cc] WebGL field off — no context available. CSS backdrop standing in.');
    }
  } catch (error) {
    // Chunk failed, or the GPU refused the context. The CSS backdrop already
    // looks like the finished design, so there is nothing to swap in — but
    // don't swallow the reason, or the next bug here is invisible.
    console.warn('[macieira.cc] WebGL scene:', error);
  }
}
