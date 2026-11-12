import { browser } from '$app/env';
import { en } from './en.ts';
import { pt } from './pt.ts';

export type Lang = 'en' | 'pt';

const STORAGE_KEY = 'lang:v2';

let currentLang = $state<Lang>('en');

export function detectClientLang(): Lang {
  if (!browser) return 'en';

  try {
    const param = new URLSearchParams(window.location.search)
      .get('lang')
      ?.slice(0, 2)
      .toLowerCase();
    if (param === 'pt' || param === 'en') return param;
  } catch {
    /* ignore query parsing failures */
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt' || saved === 'en') return saved;
  } catch {
    /* private browsing */
  }

  const offered = navigator.languages?.length ? navigator.languages : [navigator.language ?? ''];
  return offered.some((tag) => /^pt\b/i.test(tag)) ? 'pt' : 'en';
}

export function applyDocumentLang(lang: Lang): void {
  if (!browser) return;
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang === 'pt' ? 'pt-PT' : 'en';
}

export const i18n = {
  get lang(): Lang {
    return currentLang;
  },
  get locale(): string {
    return currentLang === 'pt' ? 'pt-PT' : 'en-GB';
  },
  get t() {
    return currentLang === 'pt' ? pt : en;
  },
  syncFromClient(): void {
    const next = detectClientLang();
    currentLang = next;
    applyDocumentLang(next);
  },
  set(next: Lang): void {
    if (next === currentLang) return;
    currentLang = next;
    applyDocumentLang(next);
    if (browser) {
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* non-fatal */
      }
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('lang')) {
          url.searchParams.set('lang', next);
          window.history.replaceState({}, '', url);
        }
      } catch {
        /* ignore history failures */
      }
    }
  },
};
