/**
 * split.js — a small text splitter for mask reveals.
 *
 * GSAP ships SplitText, but this page needs exactly two things from it, and
 * hand-rolling them keeps ~9 kB out of the critical bundle while making the
 * markup contract explicit:
 *
 *   splitLines(el)  → <span class="line"><span class="line__inner">…</span></span>
 *   splitChars(el)  → <span class="char"><span class="char__inner">…</span></span>
 *
 * Both wrap in a clipping box + a moving inner element, which is what makes a
 * "text slides up from behind a mask" reveal possible with transforms only
 * (no layout thrash, no repaints of the text itself).
 *
 * Lines depend on where the browser actually broke the text, so splitting has
 * to happen after webfonts load, and has to be redone when the width changes.
 */

/** Elements that were split, so a resize can rebuild them from the original text. */
const registry = new WeakMap();

function remember(el) {
  if (!registry.has(el)) registry.set(el, el.innerHTML);
}

/** Restores an element to its pre-split markup. */
export function revert(el) {
  const original = registry.get(el);
  if (original !== undefined) el.innerHTML = original;
}

/**
 * Wraps each rendered line. Returns the inner (moving) elements, in order.
 * Elements containing markup are left alone — measuring them word-by-word
 * would throw the nested tags away.
 */
export function splitLines(el) {
  if (el.children.length && !el.querySelector('.line')) return [];
  remember(el);
  revert(el);

  const words = (el.textContent || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  // Pass 1: every word in its own inline-block so offsetTop reveals the wrap points.
  const fragment = document.createDocumentFragment();
  const probes = words.map((word, i) => {
    const span = document.createElement('span');
    span.style.display = 'inline-block';
    span.textContent = word;
    fragment.append(span);
    if (i < words.length - 1) fragment.append(document.createTextNode(' '));
    return span;
  });
  el.replaceChildren(fragment);

  // Pass 2: group words that share a baseline into lines.
  const lines = [];
  let lastTop = null;
  probes.forEach((probe) => {
    const top = Math.round(probe.offsetTop);
    if (top !== lastTop) {
      lines.push([]);
      lastTop = top;
    }
    lines.at(-1).push(probe.textContent);
  });

  // Pass 3: rebuild as mask + inner.
  const out = document.createDocumentFragment();
  const inners = lines.map((line) => {
    const mask = document.createElement('span');
    mask.className = 'line';
    const inner = document.createElement('span');
    inner.className = 'line__inner';
    // Trailing space keeps textContent readable when the lines are re-joined
    // by anything that ignores block boundaries.
    inner.textContent = `${line.join(' ')} `;
    mask.append(inner);
    out.append(mask);
    return inner;
  });
  el.replaceChildren(out);

  return inners;
}

/**
 * Wraps each character. The whole string stays available to assistive tech via
 * aria-label, and the pieces are hidden from it — otherwise a screen reader
 * reads "R o d r i g o".
 *
 * Characters are grouped per word, because every mask is an inline-block and
 * the browser will happily break a line between any two of them — a two-word
 * name would wrap as "Rodrig / o Macieira". The `.word` box is `nowrap`, so
 * the only break opportunity left is the real space between words.
 */
export function splitChars(el) {
  remember(el);
  const text = (el.textContent || '').trim();
  if (!text) return [];

  el.setAttribute('aria-label', text);
  const fragment = document.createDocumentFragment();
  const inners = [];

  // split on the spaces but keep them, so they can be re-emitted as real text
  // nodes rather than as zero-width inline-blocks.
  text.split(/(\s+)/).forEach((chunk) => {
    if (!chunk) return;
    if (/^\s+$/.test(chunk)) {
      fragment.append(document.createTextNode(' '));
      return;
    }
    const word = document.createElement('span');
    word.className = 'word';
    for (const character of chunk) {
      const mask = document.createElement('span');
      mask.className = 'char';
      mask.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.className = 'char__inner';
      inner.textContent = character;
      mask.append(inner);
      word.append(mask);
      inners.push(inner);
    }
    fragment.append(word);
  });

  el.replaceChildren(fragment);

  return inners;
}
