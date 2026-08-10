# CLAUDE.md

Personal site for macieira.cc. Static HTML + CSS + ES modules, deployed to Cloudflare
Workers as an assets-only Worker. **What is committed is what ships — there is no build
step in the deploy path.** `README.md` is the long-form design document; this file is the
short list of things that are easy to break.

## Commands

```bash
npm run dev        # python3 -m http.server 4321 → http://localhost:4321
npm run vendor     # re-bundle /vendor from node_modules AND restamp the import map
npx wrangler deploy
node tools/og.mjs  # regenerate assets/og.png (needs playwright chromium)
```

There are no tests, no linter, and no formatter. Opening `index.html` from the filesystem
does not work — ES modules and the import map need a real origin.

## Layout

```
index.html            all copy and markup; nothing readable is rendered by JS
styles/base.css       tokens, reset, typography, the reveal contract
styles/site.css       chrome, sections, components
js/main.js            boot order and nothing else
js/modules/           env · smooth-scroll · hero · reveals · split · tree · github · details · work · ui
js/scene/             orchard (3D tree) · index (field lifecycle) · particles · shaders
js/data/projects.js   the file to edit to add work
vendor/               pre-built ES modules, mapped to bare specifiers by the import map
tools/                vendor.mjs · og.mjs
_headers              CSP + caching, parsed by Cloudflare, not served
.assetsignore         keeps node_modules and tooling out of the asset upload
```

## Rules that are not obvious

**Never hand-edit `/vendor` without re-running `npm run vendor`.** `_headers` serves
`/vendor/*` as `immutable` for a year; that is only safe because `tools/vendor.mjs` hashes
each bundle and rewrites the `?v=<hash>` stamps in the import map in `index.html`. A
stale stamp strands every returning visitor on the old bytes. This has already caused one
production bug.

**Three.js and anime.js are tree-shaken against explicit export lists in
`tools/vendor.mjs`.** Using a new API from either means adding it to that list and
re-running `npm run vendor`, or the browser throws `does not provide an export named …`.

**Don't delete `.assetsignore`.** Cloudflare's build container runs `npm clean-install`
inside the assets directory, and Wrangler's own `workerd` binary is far over the 25 MiB
per-asset limit.

**`prefers-reduced-motion` is deliberately not honoured.** This is the owner's decision,
recorded in `js/modules/env.js`. Do not "fix" it.

**New external hosts need a CSP edit.** `_headers` allows only `api.github.com` and
`avatars.githubusercontent.com`.

**The GitHub panel must stay tokenless.** A token in a static site is a public token;
`js/modules/github.js` works within the 60 req/hour anonymous limit with a 30-minute
`localStorage` cache.

## How the front page is wired

`js/modules/tree.js` (critical path, no WebGL) owns the seven apple buttons, the fact
cards and the ARIA. The buttons and facts are real HTML in `index.html`, paired by
`data-apple` / `data-fact`; there is no list of facts in JS. `js/scene/orchard.js` is a
*renderer*, not a rewrite: it grows the tree and each frame calls `tree.place()` with
projected screen coordinates. The renderer never touches the DOM beyond that hook, and
`tree.js` never learns what a camera is. Keep that seam intact — it is what makes the
no-WebGL fallback identical for keyboard and screen readers.

The tree is grown recursively from a fixed `SEED` in `orchard.js`; apple placement is
chosen by `chooseFruit()`, not authored. To change the arrangement, change `SEED`. The
`--x`/`--y` percentages in `index.html` only position the 2D SVG fallback.

Boot order in `js/main.js` is load-bearing: the 3D tree requests its WebGL context first
because browsers cap live contexts and the field (`js/scene/index.js`) has a full CSS
fallback. Every step runs through `safely()` — a feature failing must not take the page
down, and content visibility must never depend on JS succeeding.

## Editing conventions

- Copy, links, handles and facts are plain HTML in `index.html`.
- Add work by appending an object to the array in `js/data/projects.js`; the placeholders
  disappear on their own.
- Colours live in the `:root` block of `styles/base.css`. The WebGL scenes read `--acid`
  and `--plasma` at mount, so change them in one place.
- Headlines marked `data-reveal-lines` are split by JS at runtime — no tags inside them.
- Match the surrounding comment style: these files explain *why*, at some length, and
  that is intentional. Don't strip it, and don't add ceremony where the existing code has
  none.

## Git

Work on the designated feature branch, commit with a descriptive message, and push with
`git push -u origin <branch>`. Don't open a PR unless asked.
