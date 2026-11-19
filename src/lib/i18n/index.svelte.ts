import { browser } from '$app/env';
import { page } from '$app/state';
import { en, type TranslationShape } from './en.ts';
import { pt } from './pt.ts';

export type Lang = 'en' | 'pt';

const STORAGE_KEY = 'lang:v2';

export function langFromPathname(pathname: string): Lang {
  return pathname === '/pt' || pathname.startsWith('/pt/') ? 'pt' : 'en';
}

export function stripLangPrefix(pathname: string): string {
  if (pathname === '/pt') return '/';
  if (pathname.startsWith('/pt/')) return pathname.slice(3) || '/';
  return pathname || '/';
}

export function localizePath(path: string, targetLang: Lang): string {
  const hashIdx = path.indexOf('#');
  const rawPath = hashIdx >= 0 ? path.slice(0, hashIdx) : path;
  const hash = hashIdx >= 0 ? path.slice(hashIdx) : '';
  const clean = stripLangPrefix(rawPath.startsWith('/') ? rawPath : `/${rawPath}`);

  if (targetLang === 'pt') {
    const ptPath = clean === '/' ? '/pt' : `/pt${clean}`;
    return `${ptPath}${hash}`;
  }
  return `${clean}${hash}`;
}

export function applyDocumentLang(lang: Lang): void {
  if (!browser) return;
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang === 'pt' ? 'pt-PT' : 'en';
}

export const i18n = {
  get lang(): Lang {
    return langFromPathname(page.url.pathname);
  },
  get locale(): string {
    return this.lang === 'pt' ? 'pt-PT' : 'en-GB';
  },
  get t(): TranslationShape {
    return this.lang === 'pt' ? pt : en;
  },
  get isHome(): boolean {
    const clean = stripLangPrefix(page.url.pathname);
    return clean === '/';
  },
  href(path: string, targetLang?: Lang): string {
    return localizePath(path, targetLang ?? this.lang);
  },
  alternatePath(targetLang: Lang): string {
    return localizePath(page.url.pathname, targetLang);
  },
  remember(lang: Lang): void {
    applyDocumentLang(lang);
    if (!browser) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* private browsing */
    }
  },
};
