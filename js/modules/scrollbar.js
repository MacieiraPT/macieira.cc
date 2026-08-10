/**
 * scrollbar.js — the page's own scrollbar.
 *
 * The native one is removed rather than styled, because styling it cannot be
 * made to look the same twice: Firefox offers `scrollbar-width` and two flat
 * colours and nothing else, Chromium and Safari offer the ::-webkit-scrollbar
 * pseudo-elements, and the two mechanisms don't overlap — worse, setting the
 * standard property in Chromium makes it *ignore* the pseudo-elements. One bar
 * that is identical in every browser has to be an element we draw.
 *
 * What it is: a short bar pinned to the middle of the right edge — a fixed
 * length of travel rather than a full-height rail, so it reads the same on a
 * laptop and on a 4K monitor. It fades in while the page is moving and fades
 * out about a second after it stops, and it is a real control, not a readout:
 * grab the thumb and it scrubs, press the track and it jumps.
 *
 * Two rules it lives by:
 *
 *   - The native bar is only hidden while JS is alive and this has mounted
 *     (`html.js:not(.boot-failed)` in base.css, plus the `hidden` attribute on
 *     the markup). A page that took away the only visible scroll affordance
 *     and then failed to draw its replacement would be worse than one that
 *     never tried.
 *   - It never owns the scroll position. Lenis does, when Lenis is running;
 *     this only reads it, and hands a target back during a drag. With Lenis
 *     missing it falls through to the window, so the bar works either way.
 */

/** Thumb length, as a fraction of the track. */
const MIN_THUMB = 0.34;
const MAX_THUMB = 0.7;

/** How long the bar stays up after the page stops moving. */
const IDLE_MS = 1000;

const clamp = (low, value, high) => Math.min(high, Math.max(low, value));

export function initScrollbar(lenis) {
  const bar = document.querySelector('[data-scrollbar]');
  const thumb = bar?.querySelector('[data-scrollbar-thumb]');
  if (!bar || !thumb) return;

  // Cached in measure(), read in place(): the scroll handler must not touch a
  // property that forces layout, or every frame of a scroll pays for it.
  let track = 0;
  let thumbHeight = 0;
  let maxScroll = 0;

  let dragging = false;
  let grab = 0; // where inside the thumb the pointer landed, in px
  let idle;

  /* ---------------------------------------------------------------------- */
  /* Geometry                                                                */
  /* ---------------------------------------------------------------------- */

  function measure() {
    const doc = document.documentElement;
    track = bar.clientHeight;
    maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);

    // Proportional, like a real scrollbar — but floored, because this page is
    // long enough that an honest ratio would draw a 12 px sliver.
    const ratio = doc.scrollHeight > 0 ? window.innerHeight / doc.scrollHeight : 1;
    thumbHeight = Math.round(track * clamp(MIN_THUMB, ratio, MAX_THUMB));
    thumb.style.height = `${thumbHeight}px`;

    // Nothing to scroll (a short page, or a phone with the address bar out):
    // a scrollbar for a document that fits is a lie.
    bar.classList.toggle('is-inert', maxScroll <= 0);
    place();
  }

  function place() {
    const progress = maxScroll ? clamp(0, window.scrollY / maxScroll, 1) : 0;
    const y = progress * (track - thumbHeight);
    thumb.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
  }

  /* ---------------------------------------------------------------------- */
  /* Coming and going                                                        */
  /* ---------------------------------------------------------------------- */

  function wake() {
    if (maxScroll <= 0) return;
    bar.classList.add('is-awake');
    clearTimeout(idle);
    idle = setTimeout(() => {
      // A drag that pauses is still a drag. Hover is handled in CSS, which
      // keeps that state out of here entirely.
      if (!dragging) bar.classList.remove('is-awake');
    }, IDLE_MS);
  }

  /* ---------------------------------------------------------------------- */
  /* Dragging                                                               */
  /* ---------------------------------------------------------------------- */

  /** Where the page would have to be for the thumb's top to sit at `top`. */
  function scrollFor(top) {
    const travel = track - thumbHeight;
    return travel > 0 ? clamp(0, top / travel, 1) * maxScroll : 0;
  }

  function scrollTo(target) {
    // Lenis owns the scroll position when it is running, and setting
    // window.scrollY behind its back only makes the two fight. `immediate`
    // because the pointer is already the easing.
    if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
    else window.scrollTo(0, target);
  }

  bar.addEventListener('pointerdown', (event) => {
    if (maxScroll <= 0) return;
    event.preventDefault();

    const box = bar.getBoundingClientRect();
    const thumbTop = box.top + (window.scrollY / maxScroll) * (track - thumbHeight);
    const onThumb = event.clientY >= thumbTop && event.clientY <= thumbTop + thumbHeight;

    // Grabbing the thumb keeps hold of the exact spot you grabbed; pressing
    // the track centres it under the pointer and goes there.
    grab = onThumb ? event.clientY - thumbTop : thumbHeight / 2;

    dragging = true;
    bar.classList.add('is-dragging');
    bar.setPointerCapture(event.pointerId);
    wake();

    if (!onThumb) scrollTo(scrollFor(event.clientY - box.top - grab));
  });

  bar.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    scrollTo(scrollFor(event.clientY - bar.getBoundingClientRect().top - grab));
  });

  const release = (event) => {
    if (!dragging) return;
    dragging = false;
    bar.classList.remove('is-dragging');
    if (bar.hasPointerCapture?.(event.pointerId)) bar.releasePointerCapture(event.pointerId);
    wake(); // restart the idle countdown from the moment it was let go
  };
  bar.addEventListener('pointerup', release);
  bar.addEventListener('pointercancel', release);

  /* ---------------------------------------------------------------------- */
  /* Wiring                                                                  */
  /* ---------------------------------------------------------------------- */

  window.addEventListener(
    'scroll',
    () => {
      place();
      wake();
    },
    { passive: true }
  );

  // A window resize changes the viewport half of the ratio…
  window.addEventListener('resize', measure);

  // …and the document's own height moves under this all day without one: the
  // GitHub panel fills in, the work grid renders, a headline re-splits into a
  // different number of lines when the language changes. A ResizeObserver
  // catches all of that without any of those modules knowing this exists.
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);

  measure();

  // Last, and only now: the markup ships hidden, so nothing is on screen until
  // there is something real to show. base.css takes the native bar away on the
  // same terms — see the note there.
  bar.hidden = false;
}
