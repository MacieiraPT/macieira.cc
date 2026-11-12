# CLAUDE.md

Personal portfolio and case-study site (`macieira.cc`) built with **SvelteKit 3** (Svelte 5 runes + strict TypeScript) and deployed via **`@sveltejs/adapter-cloudflare`** onto **Cloudflare Workers** (`wrangler.jsonc`).

## Commands

```bash
npm run dev       # Vite dev server at http://localhost:4321
npm run check     # wrangler types --check && svelte-kit sync && svelte-check
npm run build     # wrangler types --check && vite build -> .svelte-kit/cloudflare
npm run preview   # wrangler dev --port 4321 (local Cloudflare Worker runtime)
npm run deploy    # build + wrangler deploy
npm run og        # regenerate static/assets/{og,apple-touch-icon,icon-192,icon-512}.png
```

## Project Layout

```text
src/
  env.ts                       SvelteKit 3 env schema (@sveltejs/kit/env) for optional GITHUB_TOKEN
  hooks.server.ts              Strict security headers & CSP for dynamic Worker responses
  app.html / app.d.ts          Document shell (no-js/js boot, lang:v2 detection, JSON-LD)
  lib/
    data/projects.ts           Single source of truth for Selected Work & /work/[slug]
    data/github-snapshot.ts    Curated offline/rate-limit fallback for /api/github
    i18n/                      en.ts, pt.ts, index.svelte.ts ($app/env)
    styles/                    tokens.css (palette/fonts), global.css (base layout)
    webgl/retroAppleShader.ts  4x4 Bayer ordered-dither GLSL + low-poly fruit/stem/leaf meshes
    components/                Header, Footer, Icons, ProjectVisual, RetroAppleCanvas, GitHubPanel
  routes/
    +layout.ts / +layout.svelte Prerender config (prerender = true) & shared shell
    +page.svelte               Landing page (Hero + 01 Work + 02 Background + 03 GitHub + Footer)
    +error.svelte              Bilingual 404/error view
    work/+page.svelte          Filterable Selected Work archive
    work/[slug]/+page.ts|.svelte Engineering case study pages (emuhub, sgeep, finsight)
    api/github/+server.ts      Cloudflare edge-cached GitHub endpoint with snapshot fallback
static/                        manifest.webmanifest, robots.txt, sitemap.xml, .well-known/, assets/
_headers                       Root Cloudflare edge headers (adapter merges immutable /_app/* rules)
vite.config.ts                 SvelteKit 3 Vite plugin + @sveltejs/adapter-cloudflare config
wrangler.jsonc                 Worker entry (.svelte-kit/cloudflare/_worker.js) & ASSETS binding
```

## Architecture & Invariants (Important)

- **SvelteKit 3 Conventions:**
  - Adapter and runes live inside `vite.config.ts` (`sveltekit({ adapter: adapter() })`); there is no `svelte.config.js`.
  - Import hooks types from `'@sveltejs/kit/hooks'`, client env flag from `'$app/env'`, and server env vars from `'$app/env/private'` declared via `src/env.ts` (`defineEnvVars`).
  - Subpath imports in `package.json` (`#lib/*`) map directly to `./src/lib/*` and include explicit `.ts` / `.svelte` extensions under TS 6 `moduleResolution: "bundler"` + `allowImportingTsExtensions: true`.
  - Keep `./worker-configuration.d.ts` **out** of root `tsconfig.json` `"types"` (the root tsconfig uses `DOM` lib, and Wrangler's global `HTMLRewriter` `Element` interface collides with `HTMLElement.append`). Keep `wrangler types --check` active in `check`/`build`.
- **`_headers` stays at repo root:** Never move `_headers` into `static/`. `@sveltejs/adapter-cloudflare` reads root `_headers` and merges generated `/_app/immutable/*` headers into `.svelte-kit/cloudflare/_headers`.
- **Keep Three.js code-split:** `RetroAppleCanvas.svelte` must probe WebGL before dynamically `import('three')` and `#lib/webgl/retroAppleShader.ts` so non-WebGL browsers never download `three` and initial critical JS remains tiny.
- **Keep case-study metrics factual:** All metrics in `src/lib/data/projects.ts` correspond to real repository artifacts (`EmuHub`, `SGEEP.Web`, `FinSight`).
- **CSP (`_headers` and `hooks.server.ts`):** `connect-src 'self'` routes GitHub fetches strictly through `/api/github`. Allow only `avatars.githubusercontent.com` in `img-src` when displaying avatars.
- **Accessibility & Reduced Motion:** Maintain `--ink-faint` contrast (`>= 4.5:1`), never hide icon-only text with `display: none` (use `.sr-only`), and keep `prefers-reduced-motion` static for idle loops while keeping pointer drag functional.

## Git

Work on the designated feature branch, commit with descriptive messages, and keep `.svelte-kit/` and `.wrangler/` untracked via `.gitignore`.
