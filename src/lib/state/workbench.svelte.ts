import { browser } from '$app/env';

export type ThemeId = 'orchard' | 'dmg' | 'amber' | 'mac1bit';
export type PixelMode = '16bit' | '8bit';

export interface ThemeMeta {
  id: ThemeId;
  code: string;
  shortLabel: string;
  label: string;
  paletteIndex: 0 | 1 | 2 | 3;
  themeColor: string;
  colorScheme: 'dark' | 'light';
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'orchard',
    code: '01',
    shortLabel: 'ORCHARD',
    label: 'Acid Orchard',
    paletteIndex: 0,
    themeColor: '#08080a',
    colorScheme: 'dark',
  },
  {
    id: 'dmg',
    code: '02',
    shortLabel: 'DMG',
    label: 'Game Boy DMG',
    paletteIndex: 1,
    themeColor: '#0d150c',
    colorScheme: 'dark',
  },
  {
    id: 'amber',
    code: '03',
    shortLabel: 'AMBER',
    label: 'Amber CRT',
    paletteIndex: 2,
    themeColor: '#0c0804',
    colorScheme: 'dark',
  },
  {
    id: 'mac1bit',
    code: '04',
    shortLabel: '1-BIT',
    label: '1-Bit Mac',
    paletteIndex: 3,
    themeColor: '#f2f1ec',
    colorScheme: 'light',
  },
];

const THEME_STORAGE_KEY = 'theme:v1';

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return value === 'orchard' || value === 'dmg' || value === 'amber' || value === 'mac1bit';
}

export function getThemeMeta(id: ThemeId): ThemeMeta {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

let currentTheme = $state<ThemeId>('orchard');
let currentMode = $state<PixelMode>('16bit');
let scanlinesEnabled = $state(true);
let spinNonce = $state(0);

function applyDocumentTheme(id: ThemeId): void {
  if (!browser) return;
  const meta = getThemeMeta(id);
  const root = document.documentElement;
  root.dataset.theme = id;
  root.style.colorScheme = meta.colorScheme;

  const themeMetaEl = document.querySelector('meta[name="theme-color"]');
  if (themeMetaEl) themeMetaEl.setAttribute('content', meta.themeColor);

  const schemeMetaEl = document.querySelector('meta[name="color-scheme"]');
  if (schemeMetaEl) schemeMetaEl.setAttribute('content', meta.colorScheme);
}

export const workbench = {
  get theme(): ThemeId {
    return currentTheme;
  },
  get themeMeta(): ThemeMeta {
    return getThemeMeta(currentTheme);
  },
  get mode(): PixelMode {
    return currentMode;
  },
  get scanlines(): boolean {
    return scanlinesEnabled;
  },
  get spinNonce(): number {
    return spinNonce;
  },
  syncFromClient(): void {
    if (!browser) return;
    let next: ThemeId = 'orchard';
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemeId(saved)) next = saved;
    } catch {
      /* private browsing */
    }
    currentTheme = next;
    applyDocumentTheme(next);
  },
  setTheme(next: ThemeId): void {
    currentTheme = next;
    applyDocumentTheme(next);
    if (browser) {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* non-fatal */
      }
    }
  },
  cycleTheme(): ThemeId {
    const idx = THEMES.findIndex((t) => t.id === currentTheme);
    const next = THEMES[(idx + 1) % THEMES.length].id;
    this.setTheme(next);
    return next;
  },
  setMode(next: PixelMode): void {
    currentMode = next;
  },
  toggleMode(): PixelMode {
    const next: PixelMode = currentMode === '16bit' ? '8bit' : '16bit';
    currentMode = next;
    return next;
  },
  toggleScanlines(): boolean {
    scanlinesEnabled = !scanlinesEnabled;
    return scanlinesEnabled;
  },
  triggerSpin(): void {
    spinNonce += 1;
  },
};
