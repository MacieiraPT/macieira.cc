/**
 * tree.js — the tree is the introduction.
 *
 * Seven apples, seven things worth knowing. Picking one swaps the card beside
 * the wordmark; picking the same one again puts it back on the branch.
 *
 * In 3D they hang in the canopy where the tree grew them, which means some of
 * them are behind it at any moment. `place()` below is what keeps that honest.
 *
 * This module is on the critical path and knows nothing about WebGL. It owns
 * the buttons, the card deck and the ARIA, and it works completely on its own
 * against the inline SVG tree in index.html.
 *
 * If a renderer turns up (js/scene/orchard.js, at idle, only where there's a
 * context to draw in) it calls `beginProjection()` and then `place()` once per
 * apple per frame, and the same buttons move to sit on the 3D fruit instead of
 * on the SVG's branch tips. That is the entire coupling: the renderer never
 * touches the DOM, and nothing about tab order, Enter, focus rings or
 * screen-reader output differs between the two modes.
 *
 * With JavaScript off none of this runs and all six facts are simply on the
 * page, which is the same content in a longer form.
 *
 * Nothing in here checks `prefers-reduced-motion`. The tree is the identity of
 * the site rather than decoration on top of it, and it animates for everyone —
 * the same exemption the WebGL field already had. The setting still governs
 * the rest of the page.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initTree() {
  const root = document.querySelector('[data-tree]');
  const deck = document.querySelector('[data-tree-facts]');
  if (!root || !deck) return null;

  const buttons = [...root.querySelectorAll('[data-apple]')];
  const facts = new Map(
    [...deck.querySelectorAll('[data-fact]')].map((card) => [card.dataset.fact, card])
  );
  if (!buttons.length || !facts.size) return null;

  const prompt = document.querySelector('[data-tree-prompt]');
  // Resolved once. `place()` below runs six times a frame, and a querySelector
  // per apple per frame is 360 tree walks a second to find elements that never
  // move in the DOM.
  const cells = new Map(buttons.map((button) => [button.dataset.apple, button.parentElement]));
  const hoverListeners = [];
  const pickListeners = [];

  let picked = null;
  let projected = false;
  let bobs = [];

  /* ---------------------------------------------------------------------- */
  /* The deck                                                                */
  /* ---------------------------------------------------------------------- */

  // Only now that JS is definitely running does the invitation become true.
  // It stands rather than toggling: one apple is always open (see below), so
  // there is no empty state for it to fill — it is just how you learn the
  // tree is a control and not a picture.
  if (prompt) prompt.hidden = false;
  facts.forEach((card) => {
    card.hidden = true;
  });

  // The cards replace each other in place, so the change has to be spoken.
  // "polite" rather than "assertive": it answers a deliberate press, and must
  // never interrupt something already being read. Set after the hiding above
  // so none of that initial churn is announced.
  deck.setAttribute('aria-live', 'polite');

  function show(card) {
    card.hidden = false;

    // Children stagger rather than the card as a whole, so the label, headline
    // and body arrive in reading order.
    gsap.fromTo(
      card.children,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.055, ease: 'power3.out', overwrite: true }
    );
  }

  function hide(card) {
    gsap.killTweensOf(card.children);
    gsap.set(card.children, { clearProps: 'opacity,transform' });
    card.hidden = true;
  }

  /* ---------------------------------------------------------------------- */
  /* Picking                                                                 */
  /* ---------------------------------------------------------------------- */

  function pick(next, { measure = true } = {}) {
    const key = next === picked ? null : next;

    buttons.forEach((button) => {
      button.setAttribute('aria-expanded', String(button.dataset.apple === key));
    });

    if (picked) hide(facts.get(picked));
    picked = key;

    if (picked) show(facts.get(picked));

    pickListeners.forEach((fn) => fn(picked));

    // A taller or shorter card moves everything below the hero. Cheap on a
    // click, and skipping it leaves every trigger on the page measuring
    // against a layout that no longer exists.
    if (measure) ScrollTrigger.refresh();
  }

  /**
   * The 2D swing, for when no renderer has taken over. transform-origin sits
   * at the top of the button (see site.css), so this pivots the apple around
   * its stem. In 3D the scene does the equivalent to the mesh instead, and
   * this would fight the projection for the same transform.
   */
  function swing(button) {
    if (projected) return;
    gsap.fromTo(
      button,
      { rotate: -15, scale: 1.14 },
      { rotate: 0, scale: 1, duration: 1.15, ease: 'elastic.out(1, 0.34)', overwrite: 'auto' }
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Idle bob (2D only — in 3D the mesh moves and the button follows it)      */
  /* ---------------------------------------------------------------------- */

  function startBob() {
    if (projected) return;

    bobs = buttons.map((button) => {
      const fruit = button.querySelector('.apple__fruit');
      // --sway is set per apple in the markup purely to break up the rhythm.
      const sway = Number.parseFloat(button.parentElement?.style.getPropertyValue('--sway')) || 0;

      return gsap.to(fruit, {
        y: 5,
        rotation: 2.4,
        duration: 2.4 + (sway % 1.3),
        delay: sway * 0.3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    });

    const canopy = document.querySelector('[data-canopy]');
    if (canopy) {
      bobs.push(
        gsap.to(canopy, { scale: 1.03, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      );
    }
  }

  function stopBob() {
    bobs.forEach((tween) => tween.kill());
    bobs = [];
    gsap.set(
      buttons.map((button) => button.querySelector('.apple__fruit')),
      { clearProps: 'transform' }
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Wiring                                                                  */
  /* ---------------------------------------------------------------------- */

  buttons.forEach((button) => {
    const key = button.dataset.apple;
    // Hover and keyboard focus are the same signal — attention on one apple —
    // so they're merged here rather than leaving a renderer to work it out.
    let hovered = false;
    let focused = false;
    let active = false;

    const settle = () => {
      const next = hovered || focused;
      if (next === active) return;
      active = next;
      hoverListeners.forEach((fn) => fn(key, active));
    };

    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('pointerenter', () => {
      hovered = true;
      settle();
    });
    button.addEventListener('pointerleave', () => {
      hovered = false;
      settle();
    });
    button.addEventListener('focus', () => {
      focused = true;
      settle();
    });
    button.addEventListener('blur', () => {
      focused = false;
      settle();
    });

    button.addEventListener('click', () => {
      swing(button);
      pick(key);
    });
  });

  startBob();

  // Deep link: /#fact-steam opens that apple. Shareable, and it means the
  // aria-controls ids point at something a URL can actually reach.
  // Otherwise the first apple opens itself — an introduction that has to be
  // clicked before it says anything isn't an introduction, and a panel that
  // starts empty is a panel that starts looking broken.
  const target = decodeURIComponent(location.hash.replace(/^#/, ''));
  const linked = [...facts.values()].find((card) => card.id === target);
  pick(linked ? linked.dataset.fact : buttons[0].dataset.apple, { measure: false });

  /* ---------------------------------------------------------------------- */
  /* Renderer interface                                                      */
  /* ---------------------------------------------------------------------- */

  const subscribe = (list, fn) => {
    list.push(fn);
    return () => {
      const at = list.indexOf(fn);
      if (at >= 0) list.splice(at, 1);
    };
  };

  return {
    /** The .orchard box — a renderer hangs its drag handling off this. */
    element: root,

    get picked() {
      return picked;
    },

    /** @param {(key: string, active: boolean) => void} fn */
    onHover: (fn) => subscribe(hoverListeners, fn),
    /** @param {(key: string | null) => void} fn */
    onPick: (fn) => subscribe(pickListeners, fn),

    /**
     * A renderer is on its way. The SVG tree hides *now*, before it has ever
     * been painted, because it is a fallback and not a loading state — showing
     * a flat line drawing for 400 ms and then swapping it for the real thing
     * is worse than showing the glow and nothing else. Only `abandonRenderer`
     * puts it back.
     */
    expectRenderer() {
      root.classList.add('is-pending');
    },

    /** No context, or the chunk never arrived. The SVG is all there is. */
    abandonRenderer() {
      root.classList.remove('is-pending');
    },

    /**
     * Hand placement to a renderer. The buttons stop being positioned by the
     * percentages in the markup and start being moved by `place()`; the SVG
     * tree and the flat apple artwork go away (see the `.is-3d` rules in
     * site.css) leaving each button as a transparent hit area with a label.
     */
    beginProjection() {
      if (projected) return;
      projected = true;
      stopBob();
      // The hero intro may still be part-way through fading these in. Killing
      // its tween and then clearing the transform would leave them stranded at
      // whatever opacity it had reached, so the end state is written directly.
      gsap.killTweensOf(buttons);
      gsap.set(buttons, { opacity: 1, scale: 1, rotate: 0 });
      root.classList.remove('is-pending');
      root.classList.add('is-3d');
    },

    /** Back to the SVG — a lost context, or a renderer that gave up. */
    endProjection() {
      if (!projected) return;
      projected = false;
      root.classList.remove('is-3d', 'is-pending');
      cells.forEach((cell) => {
        cell.style.removeProperty('--px');
        cell.style.removeProperty('--py');
        cell.style.removeProperty('--reveal');
        cell.style.removeProperty('z-index');
        cell.style.removeProperty('pointer-events');
      });
      startBob();
    },

    /**
     * Where one apple is on screen, in CSS pixels within the tree's box.
     *
     * @param {number} depth  normalised device z — nearer fruit sorts on top
     * @param {number} reveal 1 when the apple faces the camera, 0 when it has
     *   turned behind the trunk. Drives opacity *and* pointer events: a button
     *   you cannot see must not be a button you can click, or the tree becomes
     *   a minefield of invisible hit targets. It stays focusable either way —
     *   the renderer turns the tree to face whatever the keyboard lands on.
     */
    place(key, x, y, depth, reveal = 1) {
      const cell = cells.get(key);
      if (!cell) return;
      cell.style.setProperty('--px', `${x.toFixed(1)}px`);
      cell.style.setProperty('--py', `${y.toFixed(1)}px`);
      cell.style.setProperty('--reveal', reveal.toFixed(3));

      const layer = String(Math.round((1 - depth) * 2000));
      if (cell.style.zIndex !== layer) cell.style.zIndex = layer;

      // pointer-events can't read a custom property, so this one is a plain
      // toggle — written only when it changes.
      const clickable = reveal > 0.12 ? '' : 'none';
      if (cell.style.pointerEvents !== clickable) cell.style.pointerEvents = clickable;
    },

    /**
     * Hit-area diameter, in CSS pixels. Set on resize, not per frame: depth
     * varies an apple's on-screen size by a few percent, and chasing that
     * would mean writing a width to six elements sixty times a second.
     */
    setAppleSize(px) {
      root.style.setProperty('--apple-3d', `${Math.round(px)}px`);
    },
  };
}
