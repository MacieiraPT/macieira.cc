/**
 * ui.js — small interactions that have to work no matter what else fails:
 * copy-to-clipboard for the handles that aren't links, and the local clock.
 * No animation library involved.
 */

import { locale, onLanguageChange, t } from './lang.js';

/* -------------------------------------------------------------------------- */
/* Copy to clipboard                                                           */
/* -------------------------------------------------------------------------- */

let toastTimer;

function showToast(message) {
  const toast = document.querySelector('[data-toast]');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

/**
 * navigator.clipboard needs a secure context; the textarea trick covers
 * plain-http previews and older browsers. Both paths report honestly —
 * a silent no-op on a "copy" button is worse than an error.
 */
async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }

  try {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.append(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    return ok;
  } catch {
    return false;
  }
}

export function initCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach((button) => {
    const value = button.dataset.copy;

    button.addEventListener('click', async () => {
      const ok = await copyText(value);
      if (!ok) {
        showToast(t('copyFailed', value));
        return;
      }

      showToast(t('copied', value));
      button.classList.add('is-copied');
      // Swap the icon to a checkmark for the length of the toast.
      //
      // The *copy* glyph specifically, not the first <use> in the button: every
      // copy button leads with the service's own mark, so plain
      // querySelector('use') turns the Discord logo into a tick and leaves the
      // copy icon — the one the checkmark is meant to replace — sitting there
      // unchanged.
      const icon = button.querySelector('use[href="#i-copy"]');
      const previous = icon?.getAttribute('href');
      icon?.setAttribute('href', '#i-check');
      setTimeout(() => {
        button.classList.remove('is-copied');
        if (previous) icon?.setAttribute('href', previous);
      }, 2000);
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Age                                                                         */
/* -------------------------------------------------------------------------- */

/** 28 June 2008. The only place a birthday appears; the page renders a number. */
const BORN = { year: 2008, month: 5, day: 28 }; // month is 0-indexed

/**
 * Fills [data-age] with the current age.
 *
 * Computed rather than typed, for the same reason the GitHub panel is fetched
 * rather than typed: a hard-coded number is correct for at most one year, and
 * nobody remembers to come back and change it. The markup ships a plausible
 * value so the sentence still reads if this never runs.
 */
export function initAge() {
  const outputs = document.querySelectorAll('[data-age]');
  if (!outputs.length) return;

  const now = new Date();
  let age = now.getFullYear() - BORN.year;
  const month = now.getMonth();
  if (month < BORN.month || (month === BORN.month && now.getDate() < BORN.day)) age -= 1;

  outputs.forEach((output) => {
    output.textContent = String(age);
  });
}

/* -------------------------------------------------------------------------- */
/* Local clock                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Shows the time where I actually am, rather than the visitor's clock.
 * Pinned to the Europe/Lisbon zone so it stays right across DST.
 *
 * 24-hour in both languages — the format is fixed, only the locale that draws
 * the digits follows the switch.
 */
export function initClock() {
  const outputs = document.querySelectorAll('[data-clock]');
  if (!outputs.length) return;

  let format = formatter();

  function formatter() {
    return new Intl.DateTimeFormat(locale(), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Lisbon',
    });
  }

  const tick = () => {
    const now = format.format(new Date());
    outputs.forEach((output) => {
      output.textContent = now;
    });
  };

  onLanguageChange(() => {
    format = formatter();
    tick();
  });

  /**
   * Re-aimed at the top of the next minute every time, rather than aligning
   * once and handing off to setInterval(60_000).
   *
   * An interval accumulates its own error, and a background tab makes that
   * error enormous — browsers throttle timers there to once a minute at best
   * and once a *second* of wall clock per several minutes at worst. Left open
   * in another tab for an afternoon, the old clock came back minutes behind
   * and stayed there, because nothing ever recomputed the offset. Reading the
   * real clock on every tick means any single late fire is corrected by the
   * next one instead of being carried forever.
   */
  let timer;
  const schedule = () => {
    const now = new Date();
    const untilNextMinute = 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    clearTimeout(timer);
    timer = setTimeout(() => {
      tick();
      schedule();
    }, untilNextMinute);
  };

  // Coming back to a throttled tab shouldn't mean waiting up to a minute for
  // the display to catch up: repaint immediately and re-aim from now.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    tick();
    schedule();
  });

  tick();
  schedule();
}
