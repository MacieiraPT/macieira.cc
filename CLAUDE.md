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
js/modules/           env · lang · smooth-scroll · scrollbar · hero · reveals · split · tree · github · details · work · ui
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

**`prefers-reduced-motion` is honoured as *reduce*, not *remove*.** The rule is who
started the motion, not how much of it there is. Reactive motion stays — the smooth scroll
and the tree answer input and stop when it stops. Self-starting motion goes: marquee,
pulsing dots, scroll cue, idle bob, hero parallax, entrance reveals. The policy is written
out in `js/modules/env.js`; CSS start states are released in the reduced-motion block at
the bottom of `base.css`, and each module skips its own tweens. **Both halves must agree** —
release an element in CSS while its tween still runs and it flashes. Libraries that check
the query themselves still have to be handled by hand: Lenis' `respectReducedMotion` stays
off in `smooth-scroll.js`, because all it does is turn anchor scrolls into teleports while
the wheel keeps its inertia, and a jump cut is not a reduced scroll.

**Text that comes off the screen must not come out of the accessibility tree.** Use the
clipped `.sr-only` pattern, never `display: none`, on anything that is an element's only
label. This has already caused two bugs of exactly the same shape: the apple tags below
620 px and the masthead GitHub link below 720 px both left buttons with no accessible name
at all on phones.

**`--ink-faint` and `--plasma` are pinned to a contrast floor.** Both carry real text —
the tree's invitation, the GitHub panel's stat labels, the colophon — at 9–11 px, which is
far too small for WCAG's large-text allowance. Don't darken either without re-checking
them against `--bg` *and* `--bg-raise`; the note in `base.css` has the numbers.

**New external hosts need a CSP edit.** `_headers` allows only `api.github.com` and
`avatars.githubusercontent.com`.

**Portuguese lives in `index.html`, not in a JS string table.** Every translatable
element carries `data-pt="…"` (or `data-pt-aria-label` / `-title` / `-alt`) beside its
English, and `js/modules/lang.js` copies the shipped English into `data-en` on boot before
anything else touches the DOM. Two things follow: `data-pt` replaces an element's *whole*
content, so a sentence with a tag inside it needs a span per piece; and anything JS writes
at runtime can't be in the markup, so those strings — and only those — go in the table at
the bottom of `lang.js`. A module that renders its own text has to re-render on
`onLanguageChange()`; `github.js`, `work.js`, `ui.js` and `reveals.js` already do.

**The scrollbar is an element, not a styled native one.** Styling the browser's own can't
be made to match across engines — Firefox has only `scrollbar-width`/`scrollbar-color`,
Chromium and Safari have `::-webkit-scrollbar`, and in Chromium setting the standard
property silently disables the pseudo-elements. So `base.css` removes the native bar and
`js/modules/scrollbar.js` draws the replacement. The removal is gated on
`html.js:not(.boot-failed)` and the markup ships `hidden`: ungate either one and a page
whose JS failed has no scrollbar at all.

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

- Copy, links, handles and facts are plain HTML in `index.html` — in both languages. New
  copy needs a `data-pt` on the same element, or it stays English when the page switches.
- Add work by appending an object to the array in `js/data/projects.js`. The work grid also
  ships as real markup in `index.html` so it is never empty without JS — the first entry
  exists in both places, and the two have to stay in step.
- Colours live in the `:root` block of `styles/base.css`. The WebGL scenes read `--acid`
  and `--plasma` at mount, so change them in one place.
- Headlines marked `data-reveal-lines` are split by JS at runtime — no tags inside them.
- Match the surrounding comment style: these files explain *why*, at some length, and
  that is intentional. Don't strip it, and don't add ceremony where the existing code has
  none.

## Git

Work on the designated feature branch, commit with a descriptive message, and push with
`git push -u origin <branch>`. Don't open a PR unless asked.
