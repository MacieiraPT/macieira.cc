/**
 * ui.js — small interactions that have to work no matter what else fails:
 * copy-to-clipboard for the handles that aren't links, and the local clock.
 * No animation library involved.
 */

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
        showToast(`Couldn't copy — it's ${value}`);
        return;
      }

      showToast(`Copied ${value}`);
      button.classList.add('is-copied');
      // Swap the icon to a checkmark for the length of the toast.
      const icon = button.querySelector('use');
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
/* Local clock                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Shows the time where I actually am, rather than the visitor's clock.
 * Pinned to the Europe/Lisbon zone so it stays right across DST.
 */
export function initClock() {
  const outputs = document.querySelectorAll('[data-clock]');
  if (!outputs.length) return;

  const format = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Lisbon',
  });

  const tick = () => {
    const now = format.format(new Date());
    outputs.forEach((output) => {
      output.textContent = now;
    });
  };

  tick();
  // Align the first update to the top of the next minute, then run per minute.
  setTimeout(() => {
    tick();
    setInterval(tick, 60_000);
  }, (60 - new Date().getSeconds()) * 1000);
}
