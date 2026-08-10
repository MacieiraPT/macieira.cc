/**
 * lang.js — English and European Portuguese, both authored in index.html.
 *
 * The rule everywhere else on this site is that the copy lives in the markup,
 * and the language switch keeps it that way: a translatable element carries
 * its Portuguese next to its English, as an attribute.
 *
 *   <p class="card__body" data-pt="Este site.">This site.</p>
 *
 * English is what ships in the document, so a visitor with no JavaScript — or
 * a crawler — still gets the whole page, and nobody is ever shown a flash of
 * translation keys. On the first pass this module copies the shipped English
 * into `data-en`, and from then on switching is one attribute or the other.
 *
 * Putting the English *back into the DOM* rather than into a Map is what makes
 * cloned content work: js/modules/reveals.js duplicates the marquee track at
 * boot, and the copy arrives already carrying both languages instead of being
 * stranded in whichever one happened to be showing when it was made.
 *
 * Attributes translate the same way, for the handful that get read out loud:
 * `data-pt-aria-label`, `data-pt-title`, `data-pt-alt`.
 *
 * Two consequences worth knowing:
 *   - `data-pt` replaces the element's entire content, so it only goes on
 *     elements that hold text and nothing else. Where a sentence has a tag
 *     inside it, each piece gets its own span and its own translation.
 *   - Strings that JS writes at runtime can't be in the markup, so those — and
 *     only those — live in the table at the bottom of this file.
 *
 * The choice is remembered, and honoured from the browser's own language list
 * on a first visit, so a Portuguese visitor lands in Portuguese without
 * touching anything. `?lang=pt` forces it, which is what makes a Portuguese
 * link shareable.
 */

const STORAGE_KEY = 'lang:v1';

/** `tag` goes on <html lang>; `locale` is what Intl gets. */
const LANGUAGES = {
  en: { tag: 'en', locale: 'en-GB' },
  pt: { tag: 'pt-PT', locale: 'pt-PT' },
};

const ATTRIBUTES = ['aria-label', 'title', 'alt'];
const SELECTOR = ['[data-pt]', ...ATTRIBUTES.map((name) => `[data-pt-${name}]`)].join(', ');

const listeners = new Set();
const root = document.documentElement;

let current = 'en';

/** 'en' | 'pt' */
export function language() {
  return current;
}

/** The BCP-47 tag to hand to Intl — see the clock and the GitHub panel. */
export function locale() {
  return LANGUAGES[current].locale;
}

/**
 * Anything that renders its own text has to be told when the language moves
 * under it. Returns an unsubscribe, in the same shape as tree.js.
 * @param {(lang: string) => void} fn
 */
export function onLanguageChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* -------------------------------------------------------------------------- */
/* Applying                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Copies the English that shipped in the document into `data-en`, once, before
 * anything has had a chance to rewrite it. Everything downstream — the line
 * splitter, the GSAP reveals, the marquee clone — edits the DOM, so this has
 * to be the first thing that happens after the module graph boots.
 */
function prime(node) {
  if (node.hasAttribute('data-pt') && !node.hasAttribute('data-en')) {
    node.setAttribute('data-en', node.textContent);
  }
  for (const name of ATTRIBUTES) {
    if (node.hasAttribute(`data-pt-${name}`) && !node.hasAttribute(`data-en-${name}`)) {
      node.setAttribute(`data-en-${name}`, node.getAttribute(name) ?? '');
    }
  }
}

function paint(lang) {
  document.querySelectorAll(SELECTOR).forEach((node) => {
    prime(node); // cheap, and it catches anything cloned since the last pass

    const text = node.getAttribute(`data-${lang}`);
    if (text !== null && node.textContent !== text) node.textContent = text;

    for (const name of ATTRIBUTES) {
      const value = node.getAttribute(`data-${lang}-${name}`);
      if (value !== null && node.getAttribute(name) !== value) node.setAttribute(name, value);
    }
  });
}

/**
 * First-visit choice, in order of how deliberate it is:
 * an explicit `?lang=`, then a remembered switch, then the browser's own
 * preference list. English is the floor.
 */
function preferred() {
  const asked = new URLSearchParams(location.search).get('lang')?.slice(0, 2).toLowerCase();
  if (asked && Object.hasOwn(LANGUAGES, asked)) return asked;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && Object.hasOwn(LANGUAGES, stored)) return stored;
  } catch {
    /* private mode — fall through to the browser's own preference */
  }

  const offered = navigator.languages?.length ? navigator.languages : [navigator.language ?? ''];
  return offered.some((tag) => /^pt\b/i.test(tag)) ? 'pt' : 'en';
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                 */
/* -------------------------------------------------------------------------- */

export function initLanguage() {
  const switches = [...document.querySelectorAll('[data-lang-switch]')];

  const apply = (next, { notify }) => {
    current = next;
    root.lang = LANGUAGES[next].tag;
    // The sliding chip under the switch is positioned off this, so the control
    // never has to be told where it is — see .lang in site.css.
    root.dataset.lang = next;

    paint(next);
    switches.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.langSwitch === next));
    });

    if (notify) listeners.forEach((fn) => fn(next));
  };

  apply(preferred(), { notify: false });

  switches.forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.dataset.langSwitch;
      if (!Object.hasOwn(LANGUAGES, next) || next === current) return;

      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* the switch still works for this visit */
      }
      apply(next, { notify: true });
    });
  });

  // Hidden in the file, un-hidden here — the same contract as the tree's
  // prompt. A switch that can't switch anything is worse than no switch.
  document.querySelectorAll('[data-lang-switcher]').forEach((el) => {
    el.hidden = false;
  });
}

/* -------------------------------------------------------------------------- */
/* Strings that can't live in the markup                                       */
/* -------------------------------------------------------------------------- */

/**
 * Everything here is written by JS at runtime — a toast, a status line, a
 * count that only exists once the API has answered. Page copy does not belong
 * in this table; it belongs in index.html next to the English.
 */
const STRINGS = {
  copied: {
    en: (value) => `Copied ${value}`,
    pt: (value) => `${value} copiado`,
  },
  copyFailed: {
    en: (value) => `Couldn't copy — it's ${value}`,
    pt: (value) => `Não deu para copiar — é ${value}`,
  },

  /* GitHub panel ---------------------------------------------------------- */
  ghFetching: { en: 'fetching…', pt: 'a carregar…' },
  ghOffline: { en: 'offline', pt: 'offline' },
  ghLive: { en: 'live from the GitHub API', pt: 'em direto da API do GitHub' },
  ghFromCache: { en: 'from cache', pt: 'em cache' },
  ghRateLimited: {
    en: "GitHub's public API is rate-limited from this network right now — the profile link still works.",
    pt: 'A API pública do GitHub está a limitar os pedidos desta rede neste momento — o link do perfil continua a funcionar.',
  },
  ghUnreachable: {
    en: "Couldn't reach the GitHub API from here. The profile link still works.",
    pt: 'Não foi possível chegar à API do GitHub a partir daqui. O link do perfil continua a funcionar.',
  },
  ghCacheNote: {
    en: 'Cached for up to 30 minutes to stay inside the public rate limit.',
    pt: 'Em cache até 30 minutos para não passar o limite de pedidos público.',
  },
  ghForksOnly: {
    en: 'Nothing public of my own yet — only forks so far.',
    pt: 'Ainda nada de público que seja meu — só forks, para já.',
  },
  ghNoRepos: {
    en: 'No public repositories yet. First one lands here the moment it exists.',
    pt: 'Ainda sem repositórios públicos. O primeiro aparece aqui assim que existir.',
  },
  ghEvents: {
    en: (count) => `${count} event${count === 1 ? '' : 's'}`,
    pt: (count) => `${count} evento${count === 1 ? '' : 's'}`,
  },
  ghActivityLabel: {
    en: (count, days) =>
      `${count} public GitHub event${count === 1 ? '' : 's'} in the last ${days} days`,
    pt: (count, days) =>
      `${count} evento${count === 1 ? '' : 's'} público${count === 1 ? '' : 's'} no GitHub nos últimos ${days} dias`,
  },
  ghActivityNote: {
    en: (count, days) => `${count} event${count === 1 ? '' : 's'} · last ${days} days`,
    pt: (count, days) => `${count} evento${count === 1 ? '' : 's'} · últimos ${days} dias`,
  },
  ghQuiet: {
    en: (days) => `quiet · last ${days} days`,
    pt: (days) => `sem atividade · últimos ${days} dias`,
  },
  ghDayTitle: {
    en: (day, count) => `${day}: ${count} event${count === 1 ? '' : 's'}`,
    pt: (day, count) => `${day}: ${count} evento${count === 1 ? '' : 's'}`,
  },
  justNow: { en: 'just now', pt: 'agora mesmo' },
};

/**
 * One string, in the language showing right now. Entries are either a string
 * or a function of whatever the caller has to interpolate.
 */
export function t(key, ...args) {
  const entry = STRINGS[key]?.[current] ?? STRINGS[key]?.en;
  if (entry === undefined) return '';
  return typeof entry === 'function' ? entry(...args) : entry;
}
