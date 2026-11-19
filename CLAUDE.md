# CLAUDE.md

Personal portfolio and case-study site (`macieira.cc`) built with **SvelteKit 3** (Svelte 5 runes + strict TypeScript) and deployed via **`@sveltejs/adapter-cloudflare`** onto **Cloudflare Workers** (`wrangler.jsonc`), with **zero runtime npm dependencies**.

## Commands

```bash
npm run dev          # Vite dev server at http://localhost:4321
npm run check        # svelte-kit sync && svelte-check --tsconfig ./tsconfig.json
npm run check:worker # wrangler types --check (triggers wrangler build.command)
npm run check:all    # wrangler types --check && svelte-kit sync && svelte-check
npm run build        # vite build -> .svelte-kit/cloudflare
npm run preview      # wrangler dev --port 4321 (runs build.command, local Worker runtime)
npm run deploy       # wrangler deploy (runs build.command via wrangler.jsonc)
npm run gen          # wrangler types
npm run og           # regenerate static/assets/{og,apple-touch-icon,icon-192,icon-512}.png
```

## Project Layout

```text
src/
  env.ts                       SvelteKit 3 env schema (@sveltejs/kit/env) for optional GITHUB_TOKEN
  hooks.server.ts              Prerender %lang%/%dataLang% transform, ?lang= redirects & strict headers
  app.html / app.d.ts          Document shell (external /assets/boot.js, font preloads, %lang%)
  params.ts                    SvelteKit 3 defineParams matcher for optional [[lang=lang]] ('pt')
  lib/
    data/projects.ts           Single source of truth for Selected Work & /work/[slug]
    data/github-snapshot.ts    Curated offline/rate-limit fallback & language/push helpers
    i18n/                      en.ts (DeepWiden TranslationShape), pt.ts (satisfies TranslationShape), index.svelte.ts
    state/workbench.svelte.ts  Theme presets (theme:v1), bit depth, CRT scanlines, spin sync, shared toast
    styles/                    tokens.css (4-theme WCAG AA ramps/fonts), global.css (base layout + print rules)
    webgl/retroAppleShader.ts  Zero-dependency raw WebGL two-pass 4x4 Bayer renderer + procedural meshes
    components/                Header (desktop + mobile drawer + theme toggle), Footer, Icons, ProjectVisual, RetroAppleCanvas, GitHubPanel
  routes/
    +layout.ts / +layout.svelte Prerender config, shared shell, reactive lang sync & accessible shortcuts (1-5, P, B, R)
    +error.svelte              Bilingual 404/error view
    [[lang=lang]]/             Prerendered EN (/) and PT (/pt) route tree (12 static HTML pages)
      +page.ts|.svelte         Landing page (Hero + 01 Work + 02 Tabbed Background + 03 GitHub)
      cv/+page.ts|.svelte      Bilingual 1-page A4 print-to-PDF CV sheet
      work/+page.ts|.svelte    Filterable Selected Work archive
      work/[slug]/+page.ts|.svelte Engineering case study pages (emuhub, sgeep, finsight)
    sitemap.xml/+server.ts     Prerendered bilingual sitemap generated from PROJECTS
    api/github/+server.ts      Cloudflare edge-cached GitHub endpoint with cached snapshot fallback
static/                        manifest.webmanifest, robots.txt, .well-known/, assets/ (boot.js, pixel favicon, fonts, og.png)
_headers                       Root Cloudflare edge headers (adapter merges immutable /_app/* rules)
vite.config.ts                 SvelteKit 3 Vite plugin + @sveltejs/adapter-cloudflare + auto hash/nonce CSP
wrangler.jsonc                 Worker entry (.svelte-kit/cloudflare/_worker.js), ASSETS binding, workers_dev: false
```

## Architecture & Invariants (Important)

- **SvelteKit 3 Conventions:**
  - Adapter, runes, and CSP live inside `vite.config.ts` (`sveltekit({ adapter: adapter(), csp: { mode: 'auto', ... } })`); there is no `svelte.config.js`.
  - Import hooks types from `'@sveltejs/kit/hooks'`, client env flag from `'$app/env'`, and server env vars from `'$app/env/private'` declared via `src/env.ts` (`defineEnvVars`).
  - Subpath imports in `package.json` (`#lib/*`) map directly to `./src/lib/*` and include explicit `.ts` / `.svelte` extensions under TS 6 `moduleResolution: "bundler"` + `allowImportingTsExtensions: true`.
  - Keep `./worker-configuration.d.ts` **out** of root `tsconfig.json` `"types"` (the root tsconfig uses `DOM` lib, and Wrangler's global `HTMLRewriter` `Element` interface collides with `HTMLElement.append`). Run `npm run gen` whenever `wrangler.jsonc` changes.
- **Zero-Dependency Raw WebGL:** `RetroAppleCanvas.svelte` acquires WebGL directly on `<canvas>` before dynamically `import('#lib/webgl/retroAppleShader.ts')` (~5.3 kB gz, zero `three` dependency) and displays factual local telemetry (triangle count, FPS, session spins) with no backend counter calls.
- **Prerendered Bilingual Routes:** All pages prerender in EN (`/`, `/work`, `/work/[slug]`, `/cv`) and PT-PT (`/pt`, `/pt/work`, `/pt/work/[slug]`, `/pt/cv`). `i18n.lang` derives reactively from `page.url.pathname`. Backwards-compatible `?lang=pt` / `?lang=en` links redirect cleanly via `static/assets/boot.js` (static assets) and `src/hooks.server.ts` (dynamic routes).
- **Strict Hash-Mode CSP (`vite.config.ts`, `_headers`, `hooks.server.ts`):**
  - Never add inline `<script>` blocks to `src/app.html`; keep boot logic in `static/assets/boot.js` so `script-src 'self'` works without `'unsafe-inline'`.
  - Keep `_headers` at repo root (never inside `static/`). `_headers` enforces HTTP-only `frame-ancestors 'none'` without specifying `script-src` so it never collides with SvelteKit's per-page `<meta http-equiv="content-security-policy">` script hashes.
- **Keep case-study metrics factual:** All metrics in `src/lib/data/projects.ts` correspond to real repository artifacts (`EmuHub`, `SGEEP.Web`, `FinSight`).
- **Accessibility, Reduced Motion & Print:** Maintain `--ink-faint` contrast (`>= 4.5:1`), never hide icon-only text with `display: none` (use `.sr-only`), keep `prefers-reduced-motion` static for idle loops while keeping pointer drag functional, and keep `/cv` + `/pt/cv` printing cleanly on 1 A4 page with `.skip-link` and `.toast` hidden.

## Git

Work on the designated feature branch, commit with descriptive messages, and keep `.svelte-kit/` and `.wrangler/` untracked via `.gitignore`.
