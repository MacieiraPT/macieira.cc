/**
 * reveals.js — everything ScrollTrigger drives.
 *
 *   initReveals()   fade/mask reveals for blocks and headlines
 *   initPin()       the pinned rail in the dev section
 *   initProgress()  the scrub bar at the top of the window
 *   initNav()       "you are here" state in the masthead
 *   initTint()      the page accent shifting from play → build
 *   initMarquee()   a strip whose speed and skew come from scroll velocity
 *   initMagnetic()  pointer-tracking buttons (GSAP quickTo, not ScrollTrigger)
 *
 * All of it is additive: nothing here is required to read the page.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env } from './env.js';
import { onLanguageChange } from './lang.js';
import { splitLines, revert, forget } from './split.js';

/* -------------------------------------------------------------------------- */
/* Reveals                                                                     */
/* -------------------------------------------------------------------------- */

export function initReveals() {
  // Simple blocks. ScrollTrigger.batch groups elements that cross the line in
  // the same frame into one staggered tween — far cheaper than one trigger
  // per card, and it reads better too.
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.09,
        ease: 'power3.out',
        overwrite: true,
      }),
  });

  // Headlines, revealed line by line from behind a mask.
  const headlines = [...document.querySelectorAll('[data-reveal-lines]')];
  const played = new WeakSet();
  const triggers = new Map();

  function setupHeadline(headline) {
    triggers.get(headline)?.scrollTrigger?.kill();

    const lines = splitLines(headline);
    if (!lines.length) return;

    // A headline that already played must not hide itself again just because
    // the viewport changed and the lines were rebuilt.
    if (played.has(headline)) {
      gsap.set(lines, { yPercent: 0 });
      return;
    }

    // The hidden state comes from CSS as `translateY(105%)`, but a percentage
    // translate reads back out of the computed matrix as *pixels* — so GSAP
    // sees `y: 72px, yPercent: 0` and animating yPercent alone either does
    // nothing or stacks a second offset on top. `y: 0` in the from-state
    // hands the whole transform over to yPercent, and fromTo's immediate
    // render applies it in the same frame as the split (no flash).
    const tween = gsap.fromTo(
      lines,
      { yPercent: 105, y: 0 },
      {
        yPercent: 0,
        duration: 1.15,
        stagger: 0.085,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: headline,
          start: 'top 85%',
          once: true,
          onEnter: () => played.add(headline),
        },
      }
    );

    triggers.set(headline, tween);
  }

  headlines.forEach(setupHeadline);

  // A language switch replaces the headline's text outright (js/modules/lang.js
  // writes textContent, masks and all), so the split has to be rebuilt from
  // it. `forget` first: the remembered markup is the *previous* language, and
  // reverting to it would undo the switch on the way past.
  onLanguageChange(() => {
    headlines.forEach((headline) => {
      forget(headline);
      setupHeadline(headline);
    });
    ScrollTrigger.refresh();
  });

  // Line breaks depend on the viewport, so a width change invalidates them.
  // Height-only changes (mobile browser chrome collapsing) are ignored.
  let lastWidth = window.innerWidth;
  window.addEventListener(
    'resize',
    debounce(() => {
      if (Math.abs(window.innerWidth - lastWidth) < 60) return;
      lastWidth = window.innerWidth;
      headlines.forEach((headline) => {
        revert(headline);
        setupHeadline(headline);
      });
      ScrollTrigger.refresh();
    }, 250)
  );
}

/* -------------------------------------------------------------------------- */
/* Pinned rail                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Pins the dev section's left column while the GitHub panel scrolls past it.
 * gsap.matchMedia() scopes the whole thing to wide screens; leaving that
 * media query reverts it cleanly back to normal document flow.
 */
export function initPin() {
  const mm = gsap.matchMedia();

  mm.add('(min-width: 981px)', () => {
    const section = document.querySelector('.dev');
    const rail = document.querySelector('[data-pin-rail] .dev__rail-inner');
    if (!section || !rail) return;

    ScrollTrigger.create({
      trigger: section,
      start: 'top top+=120',
      // Release the pin exactly when the section's bottom reaches the rail's
      // bottom, recalculated on every refresh so it survives late-loading
      // GitHub content changing the section height.
      end: () => `+=${Math.max(0, section.offsetHeight - rail.offsetHeight - 160)}`,
      pin: rail,
      pinSpacing: false,
      invalidateOnRefresh: true,
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Chrome: progress bar, nav state, accent tint                                */
/* -------------------------------------------------------------------------- */

export function initProgress() {
  const bar = document.querySelector('[data-progress-bar]');
  if (!bar) return;

  gsap.to(bar, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
  });
}

export function initNav() {
  document.querySelectorAll('.masthead__nav a[href^="#"]').forEach((link) => {
    const section = document.querySelector(link.getAttribute('href'));
    if (!section) return;

    ScrollTrigger.create({
      trigger: section,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: ({ isActive }) => link.classList.toggle('is-current', isActive),
    });
  });
}

/**
 * The page's accent colour is a single custom property. `@property --tint` in
 * base.css registers it as a real colour, which is what lets the browser
 * *transition* it — so this only ever has to set an end state.
 */
export function initTint() {
  const root = document.documentElement;
  const acid = getComputedStyle(root).getPropertyValue('--acid').trim();
  const plasma = getComputedStyle(root).getPropertyValue('--plasma').trim();

  ScrollTrigger.create({
    trigger: '.section--dev',
    start: 'top 70%',
    end: 'max',
    onToggle: ({ isActive }) => root.style.setProperty('--tint', isActive ? plasma : acid),
  });
}

/* -------------------------------------------------------------------------- */
/* Velocity marquee                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The strip always creeps along on its own, but scrolling drives it: fast
 * scrolling speeds it up, direction follows the scroll, and the type skews
 * with the velocity before settling back. This is the clearest place on the
 * page where the smooth-scroll layer and the animation layer are visibly the
 * same system rather than two libraries running side by side.
 */
export function initMarquee() {
  const track = document.querySelector('[data-marquee-track]');
  if (!track) return;

  // Duplicate the content once so a -50% translation loops seamlessly.
  const clone = track.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  [...clone.children].forEach((child) => track.append(child));

  const loop = gsap.to(track, {
    xPercent: -50,
    duration: 26,
    ease: 'none',
    repeat: -1,
  });

  const skewTo = gsap.quickTo(track, 'skewX', { duration: 0.6, ease: 'power3.out' });

  ScrollTrigger.create({
    onUpdate: (self) => {
      const velocity = self.getVelocity(); // px/second, signed
      // Scroll direction flips the marquee; magnitude speeds it up, capped so
      // a fast flick can't turn it into a blur.
      loop.timeScale(gsap.utils.clamp(-6, 6, Math.sign(velocity) * (1 + Math.abs(velocity) / 900)));
      skewTo(gsap.utils.clamp(-8, 8, velocity / 260));
    },
    // Scrolling stopped: unskew and go back to the idle drift.
    onScrubComplete: () => skewTo(0),
  });

  // getVelocity() only reports while scrolling, so idle needs its own reset.
  let idle;
  window.addEventListener(
    'scroll',
    () => {
      clearTimeout(idle);
      idle = setTimeout(() => {
        gsap.to(loop, { timeScale: 1, duration: 0.8, ease: 'power2.out' });
        skewTo(0);
      }, 160);
    },
    { passive: true }
  );
}

/* -------------------------------------------------------------------------- */
/* Magnetic buttons                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Buttons lean toward the cursor when it gets close. gsap.quickTo() builds a
 * reusable, pre-compiled tween per property — the right tool for something
 * fired on every pointermove, where a fresh gsap.to() would allocate garbage
 * at 120 Hz.
 */
export function initMagnetic() {
  if (!env.finePointer) return; // pointless, and jumpy, on touch

  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const moveX = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const moveY = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    const strength = 0.32;

    el.addEventListener('pointermove', (event) => {
      const box = el.getBoundingClientRect();
      moveX((event.clientX - (box.left + box.width / 2)) * strength);
      moveY((event.clientY - (box.top + box.height / 2)) * strength);
    });

    el.addEventListener('pointerleave', () => {
      moveX(0);
      moveY(0);
    });
  });
}

/* -------------------------------------------------------------------------- */

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
