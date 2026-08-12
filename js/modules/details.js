/**
 * details.js — the anime.js v4 layer.
 *
 * GSAP owns the page-scale choreography; anime.js is used here for the two
 * things it is genuinely better at, and nothing else:
 *
 *   1. SVG. `svg.createDrawable()` turns a path into a stroke that can be
 *      drawn on like a pen line, and `svg.morphTo()` resamples two unrelated
 *      paths so one can become the other — the controller turning into the
 *      GitHub mark at the seam between the two halves of the page.
 *   2. Physical dragging. `createDraggable()` + `spring()` gives real
 *      spring dynamics on release, with velocity carried out of the gesture.
 *
 * This module is dynamically imported, so anime.js is never on the critical
 * path — see js/main.js.
 */

import { animate, createDraggable, spring, stagger, svg } from 'animejs';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env } from './env.js';

/* -------------------------------------------------------------------------- */
/* 1a. Line drawing                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Draws a stroked path on. `createDrawable` wraps the element in a proxy whose
 * `draw` property is a "start end" pair in 0–1 of the path length, so
 * '0 0' → '0 1' is the pen travelling from one end to the other.
 */
function drawPath(path, { duration = 1400, delay = 0 } = {}) {
  const [drawable] = svg.createDrawable(path);
  return animate(drawable, {
    draw: ['0 0', '0 1'],
    duration,
    delay,
    ease: 'inOut(3)',
  });
}

function initDrawings() {
  const seam = document.querySelector('.seam__line [data-draw]');

  // The apple in the masthead: the body outline, then the stem out of the top
  // of it. GSAP pours the red in behind them a moment later (js/modules/hero.js),
  // so the mark is never left as an outline if this module fails to arrive.
  document
    .querySelectorAll('.monogram [data-draw]')
    .forEach((path, index) => drawPath(path, { duration: 900, delay: 250 + index * 260 }));

  // The seam draws itself as it arrives. ScrollTrigger is already running the
  // page's scroll layer, so it decides *when*; anime.js decides *how*.
  if (seam) {
    ScrollTrigger.create({
      trigger: seam,
      start: 'top 85%',
      once: true,
      onEnter: () => drawPath(seam, { duration: 1600 }),
    });
  }
}

/* -------------------------------------------------------------------------- */
/* 1b. Morphing glyph                                                          */
/* -------------------------------------------------------------------------- */

/**
 * The seam's mark morphs from the apple into the GitHub logo — the page's
 * whole argument in one 30 px shape — once, as the seam scrolls into view.
 *
 * It used to be a <button aria-pressed> you could flip back and forth, and
 * that was the problem: the most call-to-action-shaped element on the page,
 * captioned "tap to switch", whose entire function was redrawing its own icon.
 * Real interactivity, no destination. The element is now the link to this
 * page's source, which is what the morph was illustrating all along, so the
 * animation kept its home and stopped pretending to be the point of it.
 *
 * One direction, once. A link's label cannot swap under the pointer — the
 * caption is static markup with its own `data-pt` now, not a runtime string —
 * and there is nothing to toggle back to.
 */
function initMorph() {
  const toggle = document.querySelector('[data-morph-toggle]');
  const shape = document.querySelector('[data-morph-shape]');
  if (!toggle || !shape) return;

  ScrollTrigger.create({
    trigger: toggle,
    start: 'top 78%',
    once: true,
    onEnter: () =>
      setTimeout(() => {
        // Drives the fill colour from CSS; see `.seam__toggle.is-gh`.
        toggle.classList.add('is-gh');
        animate(shape, {
          // morphTo resamples both paths to a matching point count, which is
          // what lets two shapes with nothing structurally in common
          // interpolate.
          d: svg.morphTo('#shape-gh'),
          duration: 900,
          ease: 'out(3)',
        });
      }, 700),
  });
}

/* -------------------------------------------------------------------------- */
/* 2. Spring-physics stickers                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Three draggable stickers in the footer, bounded to their container.
 *
 * `releaseEase: spring(...)` is the whole point: on release the sticker
 * keeps the velocity from the gesture and settles under real spring dynamics,
 * and with `releaseContainerFriction: 0` it bounces off the walls instead of
 * sticking to them. Low damping is what makes it feel like an object rather
 * than a tween.
 */
function initStickers() {
  const stickers = document.querySelectorAll('[data-sticker]');
  if (!stickers.length) return;

  let topLayer = 1;

  stickers.forEach((sticker) => {
    createDraggable(sticker, {
      container: '[data-stickers]',
      containerPadding: 10,
      releaseEase: spring({ stiffness: 90, damping: 9, mass: 1.1 }),
      releaseContainerFriction: 0,
      velocityMultiplier: 1.25,
      minVelocity: 0,
      onGrab: () => {
        sticker.style.zIndex = String(++topLayer);
      },
    });
  });

  // Drop them in when the footer arrives, so the first impression is that
  // they're objects with weight. The drag itself stays under the preference —
  // it only ever happens because a hand made it happen — but an entrance that
  // plays itself is exactly what the policy in env.js switches off, and these
  // start from `scale: 0.4` and a random rotation.
  if (env.reducedMotion) return;

  ScrollTrigger.create({
    trigger: '[data-stickers]',
    start: 'top 85%',
    once: true,
    onEnter: () =>
      animate(stickers, {
        scale: [0.4, 1],
        rotate: [() => -30 + Math.random() * 60, 0],
        opacity: [0, 1],
        duration: 900,
        delay: stagger(90),
        ease: spring({ stiffness: 120, damping: 12 }),
      }),
  });
}

/* -------------------------------------------------------------------------- */

export function initDetails() {
  // Both of these are entrances: lines that draw themselves on and a shape
  // that redraws itself, neither asked for. The paths ship fully drawn in the
  // markup, so skipping them leaves the finished picture rather than a gap —
  // which is the same contract the rest of the page keeps (see env.js).
  if (!env.reducedMotion) {
    initDrawings();
    initMorph();
  }
  initStickers();
}
