/**
 * tree.js — the apple tree is the introduction.
 *
 * Six apples, six things about me. Picking one swaps the card underneath the
 * wordmark; picking the same one again puts it back on the branch.
 *
 * This module is on the critical path, deliberately. The tree is the front
 * page — it cannot depend on a chunk that arrives at idle, so everything the
 * interaction needs is here and in GSAP, which is already loaded. anime.js
 * never touches it.
 *
 * The markup does the accessibility work (real <button>s, real headings, all
 * six facts present in the HTML); this file only has to hide five of them and
 * keep the ARIA honest. With JavaScript off nothing here runs and the page
 * degrades into a list of six paragraphs, which is the same content.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env } from './env.js';

/** How long the swung apple takes to settle. */
const PLUCK = 1.15;

export function initTree() {
  const tree = document.querySelector('[data-tree]');
  const deck = document.querySelector('[data-tree-facts]');
  if (!tree || !deck) return;

  const buttons = [...tree.querySelectorAll('[data-apple]')];
  const facts = new Map(
    [...deck.querySelectorAll('[data-fact]')].map((card) => [card.dataset.fact, card])
  );
  if (!buttons.length || !facts.size) return;

  const prompt = document.querySelector('[data-tree-prompt]');
  let picked = null;

  /* ---------------------------------------------------------------------- */
  /* The deck                                                                */
  /* ---------------------------------------------------------------------- */

  // Only now that JS is definitely running does the invitation become true.
  if (prompt) prompt.hidden = false;
  facts.forEach((card) => {
    card.hidden = true;
  });

  // The cards replace each other in place, so the change has to be spoken.
  // "polite" rather than "assertive": it is a reply to a deliberate press,
  // not an alert, and it must never interrupt something already being read.
  deck.setAttribute('aria-live', 'polite');

  function show(card) {
    card.hidden = false;
    if (env.reducedMotion) return;

    // Children stagger rather than the card as a whole: the label, headline
    // and body arrive in reading order, which is the same order the reveals
    // elsewhere on the page use.
    gsap.fromTo(
      card.children,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.65, stagger: 0.06, ease: 'power3.out', overwrite: true }
    );
  }

  function hide(card) {
    gsap.killTweensOf(card.children);
    gsap.set(card.children, { clearProps: 'opacity,transform' });
    card.hidden = true;
  }

  /* ---------------------------------------------------------------------- */
  /* The fruit                                                               */
  /* ---------------------------------------------------------------------- */

  /**
   * The swing. transform-origin sits at the top of the button (see site.css),
   * so rotating it pivots the apple around its stem the way a real one would
   * when you tug it — elastic.out is the settle back onto the branch.
   */
  function swing(button) {
    if (env.reducedMotion) return;
    gsap.fromTo(
      button,
      { rotate: -15, scale: 1.14 },
      { rotate: 0, scale: 1, duration: PLUCK, ease: 'elastic.out(1, 0.34)', overwrite: 'auto' }
    );
  }

  /**
   * Idle bob, applied to the fruit inside the button rather than the button
   * itself. That keeps the two animations on separate elements, so a swing
   * mid-bob can't have its transform overwritten (or vice versa) — the
   * alternative is property-scoped overwrites, which is a lot of care to take
   * over something this small.
   */
  function bob() {
    if (env.reducedMotion) return;

    buttons.forEach((button) => {
      const fruit = button.querySelector('.apple__fruit');
      if (!fruit) return;

      // --sway is set per apple in the markup purely to break up the rhythm.
      const sway = Number.parseFloat(button.parentElement?.style.getPropertyValue('--sway')) || 0;

      gsap.to(fruit, {
        y: 5,
        rotation: 2.4,
        duration: 2.4 + (sway % 1.3),
        delay: sway * 0.3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    });

    // The canopy breathes with them, pivoting at the base of the trunk so the
    // whole crown leans instead of sliding sideways. svgOrigin takes viewBox
    // units, which is the only way to put a transform origin outside the
    // element's own bounding box.
    const canopy = tree.querySelector('[data-canopy]');
    if (canopy) {
      gsap.to(canopy, {
        rotation: 1.1,
        duration: 7,
        svgOrigin: '230 508',
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Picking                                                                 */
  /* ---------------------------------------------------------------------- */

  function pick(key, { measure = true } = {}) {
    const next = key === picked ? null : key;

    buttons.forEach((button) => {
      button.setAttribute('aria-expanded', String(button.dataset.apple === next));
    });

    if (picked) hide(facts.get(picked));
    picked = next;

    if (prompt) prompt.hidden = Boolean(picked);
    if (picked) show(facts.get(picked));

    // A taller or shorter card moves everything below the hero. Cheap enough
    // on a click, and skipping it leaves every trigger on the page measuring
    // against a layout that no longer exists.
    if (measure) ScrollTrigger.refresh();
  }

  buttons.forEach((button) => {
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
      swing(button);
      pick(button.dataset.apple);
    });
  });

  bob();

  // Deep link: /#fact-steam opens that apple. Shareable, and it means the
  // aria-controls ids point at something a URL can actually reach.
  const target = decodeURIComponent(location.hash.replace(/^#/, ''));
  const linked = [...facts.values()].find((card) => card.id === target);
  if (linked) pick(linked.dataset.fact, { measure: false });
}
