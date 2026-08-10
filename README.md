# macieira.cc

Personal site for **rudi** ([@MacieiraPT](https://github.com/MacieiraPT)) — developer,
Portugal. An introduction on one half, a dev presence that grows over time on the other.

*Macieira* is Portuguese for **apple tree**, and it's the surname. So the mark is a red
apple, and the front page is one: a WebGL tree whose seven apples are real buttons —
click one, read a card. Three links only — Steam, Discord, GitHub.

Static HTML, CSS and ES modules. **No build step is required to deploy**: what's in the
repository is what ships.

---

## Running it locally

Any static file server works. The one shortcut in `package.json` needs nothing installed:

```bash
npm run dev          # python3 -m http.server 4321
# → http://localhost:4321
```

Opening `index.html` directly from the filesystem will **not** work — ES modules and the
import map need a real origin.

---

## The stack, and why each piece is there

| Library | Version | Job on this page |
| --- | --- | --- |
| [Lenis](https://github.com/darkroomengineering/lenis) | 1.3.26 | The inertia in the scroll. It is the base *feel* of the page, so nothing else animates on its own clock. |
| [GSAP](https://gsap.com) + ScrollTrigger | 3.15.0 | The hero intro, every scroll-triggered reveal, the pinned rail in the dev section, the progress bar. |
| [Three.js](https://threejs.org) | 0.185.1 | Two scenes. The tree in the hero — tapered branches, roots, 2 400 instanced leaves, lit fruit. And the field behind everything: 26k points morphing from a haze into a wave and then the **apple**. |
| [anime.js](https://animejs.com) | 4.5.0 | The fine detail: SVG line-drawing, the apple → GitHub morph at the seam, and the spring-physics draggable stickers. |

They are deliberately **not** interchangeable here. The clearest place to see them working
as one system is the marquee between sections 01 and 02: GSAP runs the loop, its speed and
skew come from Lenis' scroll velocity, and ScrollTrigger decides when to reset it.

### Where the approach comes from

The reference point is [OFF+BRAND](https://www.itsoffbrand.com), the studio behind
[landonorris.com](https://landonorris.com) (Awwwards Site of the Year 2025). Their stack
there is **Webflow + GSAP + WebGL + [Rive](https://rive.app)** — bold type, one heavy
vector-animation layer, cinematic scroll, and a hard performance budget held with
lazy-loading and trimmed asset delivery.

Three of those four map straight onto what's already here: GSAP is GSAP, the WebGL is
Three.js, and the scroll is Lenis. The fourth is the interesting one. Rive is a runtime for
designed vector motion — exactly the job anime.js v4 does on this page (`svg.createDrawable`,
`svg.morphTo`, `spring()`), for ~24 kB fetched at idle instead of a new toolchain. Webflow
is the one piece deliberately *not* copied: a hand-written static site has no CMS to pay
for, and this one has to survive with JavaScript switched off, which a Webflow build of it
would not.

What was taken directly: the discipline of loading almost nothing up front, and of putting
one big idea on the first screen instead of five small ones.

### Cache busting — read this before touching /vendor

`_headers` serves `/vendor/*` as `immutable` for a year. That is only safe because
`npm run vendor` hashes each bundle and **rewrites the import map in `index.html`** with a
`?v=<hash>` on every entry, so the URL changes when the bytes do.

This is not hypothetical hygiene. Adding the three.js exports for the 3D tree shipped an
orchard module that imported symbols the *cached* bundle didn't export — so every browser
that had visited before threw on import and silently fell back to the flat SVG tree, while
a fresh browser looked perfect. If you ever hand-edit a file in `/vendor`, run
`npm run vendor` afterwards or the stamp will lie.

### How they load

```
js/main.js  ──▶ GSAP + ScrollTrigger + Lenis + app        critical path, ~70 kB gzip
            ──▶ (at once, WebGL) js/scene/orchard.js ─┐
            ──▶ (idle) js/modules/github.js           │   live data, no library, ~4 kB
            ──▶ (idle) js/modules/details.js ──▶ anime.js       ~23 kB
            ──▶ (idle, WebGL) js/scene/index.js      ─┴──▶ Three.js  ~135 kB
```

The 3D tree is the one deferred chunk that is asked for **immediately** rather than at
idle, because it is the front page. Everything else waits for `requestIdleCallback`.

The two WebGL scenes share the Three.js chunk, so the field is nearly free by the time it
asks. They also compete for a context — see the priority note below.

`js/modules/env.js` holds the one remaining gate: the scenes run unless the browser cannot
give a WebGL context at all. Nothing else stops them — not reduced motion, not Data Saver,
not device class. Hardware decides only how much runs: a software renderer gets 6k
particles at 1× instead of 26k, and the frame-time watchdog in `js/scene/index.js` cuts
further if that was still optimistic. When there is no context, the reason is logged to the
console, because "the particles don't show up on my machine" is otherwise unanswerable.

**Two contexts, in priority order.** The tree mounts first, deliberately. Browsers cap how
many live WebGL contexts a page may hold (Safari and some mobile GPUs are strict, and
software rasterisers often allow exactly one) and when the cap is one, whoever asks first
wins. The tree is above the fold and it is content; the field is atmosphere and already has
a full CSS fallback painted behind it. So the tree asks straight away and the field at
2.5 s, and if the field loses it degrades to gradients without a word.

**`prefers-reduced-motion` is not honoured anywhere on this site.** That is a deliberate
decision by the owner, recorded in `js/modules/env.js` rather than left to be rediscovered
as a bug. It used to switch off Lenis, the hero intro, the scroll reveals and the sticker
physics; it now switches off nothing. The smooth scroll *is* the feel of the page, and half
of it animating while the other half sat still read as broken rather than as considerate.

What that trades away: visitors who set the preference for vestibular reasons get the full
thing. The honest mitigation is that nothing here is large-amplitude or unexpected — no
parallax on body text, no autoplaying transitions, no motion that starts without a scroll
or a click.

---

## The tree

The front page is one component in two implementations, and the interesting
part is what they share.

**The buttons are always HTML.** All seven apples are real `<button>`s in
`index.html`, and all seven facts are real `<article>`s. `js/modules/tree.js` —
critical path, no WebGL anywhere in it — owns the picking, the card deck and the
ARIA. On its own it drives the inline SVG tree, positioning each button with two
custom properties. That alone is a finished, working feature.

**The 3D tree is a renderer, not a rewrite.** `js/scene/orchard.js` grows the
tree, then does one thing to the page: every frame it projects each apple's
world position to screen coordinates and calls `tree.place()`. The buttons move
to sit on the mesh. That is the whole coupling — the renderer never touches the
DOM and never learns what a fact is, and `tree.js` never learns what a camera
is. Tab order, Enter, Space, focus rings and screen-reader output are identical
either way, because they are the same elements either way.

**The SVG tree is never shown when the 3D one is coming.**
`tree.expectRenderer()` hides it before first paint; only a missing WebGL
context or a chunk that fails to load brings it back. It is a fallback, not a
loading state.

### Grown, not drawn

The tree used to be a hand-written list of branches. Every child had to *start*
on a coordinate copied out of its parent, which was a promise rather than a
guarantee — and the root flare was a separate, wider cylinder butted onto the
bottom of the trunk, which is exactly as seamless as that sounds.

One recursive generator now grows the whole thing from `SEED`, and continuity is
structural:

- every child begins at its parent's end point, backed a little way *into* it,
  so the tubes overlap instead of meeting;
- a sphere sits at every fork, sized to the parent's end radius, so no angle of
  split can open a gap;
- radii follow the **pipe model** — a fork's children share out the parent's
  cross-section — so limbs thin the way a real one does. The exponent is the
  single most expressive number in the file: lower makes a broom, higher makes
  a candelabra;
- the trunk widens into its roots along one continuous radius curve, and the
  roots start *inside* it;
- the children of a fork are spaced **evenly** around the parent's direction.
  This is the one that matters most for the silhouette. Letting each child pick
  a random perpendicular lets two of three set off the same way, the error
  compounds at every depth, and the crown ends up hanging off one side.

The seed is fixed, so the tree is identical on every load and in every browser.
Change `SEED` and you get a different tree immediately — which is also the
fastest way to fix a layout you don't like.

### The apples are hidden, and that is the point

There is no clearing cut in front of the fruit any more. Apples hang where the
tree grew them, which means some are behind it at any moment and most are partly
under leaves. Finding them is the interaction.

That has a cost, and it is paid for three ways:

- **Orbit.** Drag anywhere on the tree to turn it — unlimited in yaw, clamped in
  pitch, with inertia on release and a slow idle drift so it reads as turnable
  before anyone touches it. The camera moves; the tree never does, or looking
  down at it would tilt the trunk off vertical.
- **Honest buttons.** Each apple gets a `reveal` every frame from how far its
  bearing is from the camera's. `tree.place()` fades the button with it *and*
  drops `pointer-events`, so a fruit you cannot see is never a hit target you
  cannot see either. The same clamp fades any apple that swings past the edge of
  the canvas, which would otherwise drift over the text beside it.
- **Keyboard, in reverse.** Tab still reaches all seven. Focusing one that has
  turned away spins the tree until it faces you — which is both the accessible
  answer and the nicest thing in the scene.

Two smaller things worth knowing:

- **The idle spin stops while an apple is hovered or focused.** A target that
  drifts under the cursor as you reach for it is a target you miss, and a slow
  drift is worse than a fast one because it looks stationary until you click.
- **A drag that starts on an apple must not pick it.** A capture-phase listener
  swallows the click when the pointer travelled more than a few pixels.

### And the rest

- **Leaves are one `InstancedMesh`** — a couple of thousand in a single draw
  call, scattered through the volume *around* each outer branch. Laid on the
  surface they read as a garland wound round a stick; it is the spread that
  makes a canopy. The only culling left keeps foliage from growing through the
  fruit, and the bubble that leaves is what makes an apple recognisable once you
  have turned it into view.
- **The tube taper is not a Three.js feature.** `TubeGeometry` has one radius
  for its whole length; `branchGeometry()` recovers each ring's centre from the
  curve and pulls the ring in toward it. The trunk passes a power curve instead
  of a straight line, and that is where the root flare comes from.
- **Bark and fruit carry vertex colours.** Paler young wood at the tips,
  faceting round each ring, and on the apples a gradient from deep at the
  shoulders to warm underneath with faint striping — most of what stops a red
  sphere reading as a tomato once the profile is right.
- **The hit area floors at 44 px.** A projected apple is about 25 px across on a
  phone — a good apple and a hopeless button — so the padding grows as the fruit
  shrinks.
- **A frame-time watchdog** drops the pixel ratio, then halves the foliage, if
  the average frame goes over 26 ms.

---

## Layout

```
index.html            all copy and markup — nothing is rendered by JS that matters for reading
styles/base.css       tokens, reset, typography, the reveal contract
styles/site.css       chrome, sections, components
js/main.js            boot order and nothing else
js/modules/           env · smooth-scroll · hero · reveals · split · tree · github · details · work · ui
js/modules/tree.js    the apples: buttons, cards, ARIA — and the hook a renderer plugs into
js/scene/orchard.js   the 3D tree
js/scene/             index (lifecycle + loop) · particles (geometry) · shaders (GLSL)
js/data/apple.js      the mark as path data — what the particle field samples
js/data/projects.js   ← the file to edit when there's work worth showing
vendor/               pre-built ES modules, mapped to bare specifiers by the import map
assets/               fonts, favicon, social card
tools/                vendor.mjs (rebuild vendor/) · og.mjs (rebuild the social card)
_headers              Cloudflare Pages caching + security headers
```

---

## Editing it

### Add a project

Open `js/data/projects.js` and add one object to the array:

```js
export const projects = [
  {
    title: 'Semester 1 — algorithms',
    summary: 'Sorting and search exercises worked through in C, with notes.',
    url: 'https://github.com/MacieiraPT/…',
    year: 2026,
    tags: ['C', 'coursework'],
  },
];
```

A card appears in "Selected work" and the three placeholder slots disappear on their own.
Nothing else needs touching.

### Change a link or a handle

They're plain HTML in `index.html`, in the `02 — elsewhere` section. Handles that
aren't linkable profiles (Discord) are `<button data-copy="…">` — the value in `data-copy`
is what lands on the clipboard.

### Change what an apple says

Also plain HTML: each one is an `<article class="fact" id="fact-…" data-fact="…">` inside
`.basket__deck`, and the button that picks it is the `<button data-apple="…">` with the
matching name. `js/modules/tree.js` pairs them up by that value and does nothing else —
there is no list of facts in JavaScript to keep in step.

**You cannot place an apple exactly any more, and that is on purpose.** The
generator picks which seven branch tips get fruit, in `chooseFruit()`: best
candidate per sector of the compass, never two closer together than
`MIN_SEPARATION`, outermost preferred. If the spread is wrong, change `SEED`
until it isn't — that is a one-character edit and the whole tree re-grows
deterministically.

The 2D fallback still uses the `--x` / `--y` percentages on each `<li>` in
`index.html`. They are percentages of the tree's box, which is locked to the
SVG's 460 × 520 viewBox, so `--x: 50%` really is `x = 230` in the drawing.

### Change the copy

Also plain HTML. Headlines marked `data-reveal-lines` are split into lines by JS at runtime;
write them as normal text and don't put tags inside them.

### Change the colours

`styles/base.css`, the `:root` block. `--acid` (the playing half) and `--plasma` (the
building half) are used by the CSS, and read by the WebGL scene at mount — change them once
and the particles follow. `--apple`, `--leaf` and `--bark` are the orchard; the sprite
symbol `#i-apple` paints itself from them, and because custom properties inherit into a
`<use>` shadow tree, that one symbol is the logo, the fruit, the prompt marker and the
footer sticker.

---

## The live GitHub panel

`js/modules/github.js` reads three unauthenticated endpoints: the profile, recent
repositories, and public events bucketed into a 14-day activity strip.

- **No token, by design.** A token in a static site is a public token. That caps the page at
  GitHub's 60 requests/hour *per IP*, so responses are cached in `localStorage` for 30
  minutes and a rate-limited response falls back to that cache.
- **Zero repos is a real state**, not an error — the panel says so plainly.
- **Anything can fail.** If the API is unreachable the panel keeps its markup, flips to
  `offline`, and explains itself. The GitHub link never depended on the fetch.

To point it at a different account, change `USER` at the top of the file.

---

## Deploying to Cloudflare

The site is the repository root, so both of Cloudflare's static hosting products work.
`_headers` applies either way — on both platforms it is *parsed*, not served — and it sets
a year of immutable caching on `vendor/` and the fonts plus a content security policy that
only allows the two external hosts the page uses (`api.github.com` and GitHub's avatar CDN).

### Workers (current setup)

`wrangler.jsonc` is committed, so a connected build just runs `npx wrangler deploy` and
serves this directory.

The one thing to know: Cloudflare's build container runs `npm clean-install` before the
deploy command, because there is a `package.json` here. That creates `node_modules` *inside
the assets directory* — including Wrangler's own 122 MiB `workerd` binary, which is well
over the 25 MiB per-asset limit. **`.assetsignore` is what keeps that out of the upload.**
Don't delete it, and add to it if the repository ever grows something else that shouldn't
be public.

To deploy by hand:

```bash
npx wrangler deploy
```

### Pages

If you'd rather use Pages: Workers & Pages → Create → Pages → Connect to Git, with

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Build command | *(leave empty)* |
| Build output directory | `/` |

Either way, add `macieira.cc` under **Custom domains** — Cloudflare handles the DNS record
and the certificate.

---

## Rebuilding the vendored libraries

`vendor/` is committed, so this is only needed to bump a version.

```bash
npm install          # pulls the pinned versions
npm run vendor       # re-bundles them into vendor/
```

`tools/vendor.mjs` bundles each library with esbuild: GSAP because it only ships
un-minified ES modules (110 kB gzip → 44 kB), Three.js and anime.js because tree-shaking
them against the exact APIs used here cuts about a third off both.

⚠️ Because Three.js and anime.js are tree-shaken against explicit export lists, **using a new
API from either means adding it to the list in `tools/vendor.mjs` and re-running
`npm run vendor`.** The browser makes this obvious — `does not provide an export named …`.

The social card is regenerated separately, and rarely:

```bash
npx playwright@latest install chromium
node tools/og.mjs
```

---

## What happens when things go wrong

| Situation | What the visitor gets |
| --- | --- |
| JavaScript disabled | The whole page, fully readable — including the SVG tree, fully drawn, and all six apple facts as a plain list. Nothing is hidden without JS. |
| No WebGL, or the 3D chunk never arrives | The SVG tree is revealed instead, with working buttons. It is plainer, and it is the only case anybody sees it. |
| Only one WebGL context available | The tree gets it; the field falls back to CSS gradients. See the priority note above. |
| anime.js never arrives | The tree, the logo and the seam stay exactly as drawn; only the pen-stroke animations are lost. |
| JS fails to boot | A failsafe in `<head>` releases the hidden state after 1.5 s. |
| `prefers-reduced-motion` | Nothing. The setting is deliberately not honoured — see the note above. |
| No WebGL at all | Three.js is never downloaded; the CSS backdrop carries the look and the console says so. |
| No GPU — acceleration off, VM, remote desktop, blocklisted driver | Still runs, on the software renderer, at 6k particles and 1× pixel ratio. |
| GPU drops the context mid-session | The field hands back to the CSS backdrop; the tree hands back to the SVG, buttons and all. |
| GitHub API down or rate-limited | The panel says `offline` and explains; the profile link still works. |
| Frame times over ~26 ms | The field drops to 1× pixel ratio, then to 55% of the points. The tree drops to 1×, then to half the leaves. |

---

## Rough budget

| | gzip | blocks first paint? |
| --- | --- | --- |
| HTML + CSS | 22 kB | yes |
| Critical JS — GSAP + ScrollTrigger + Lenis + app | 69 kB | no (`type="module"` is deferred) |
| Display font (preloaded; the mono face swaps in) | 127 kB for both | no |
| GitHub panel (idle) | 4 kB | no |
| anime.js + details (idle) | 23 kB | no |
| Three.js (idle, capability-gated, shared by both scenes) | 133 kB | no |
| Both scenes' own code (idle) | 16 kB | no |

Re-measure any time with:

```bash
python3 -c "import gzip,glob;print(sum(len(gzip.compress(open(p,'rb').read())) for p in glob.glob('js/**/*.js',recursive=True)+glob.glob('vendor/*.mjs'))//1024,'kB')"
```

---

## Credits

Brand icon paths from [simple-icons](https://simple-icons.org) (CC0); each mark identifies
the service its link points to. Type is [Archivo](https://fonts.google.com/specimen/Archivo)
and [JetBrains Mono](https://www.jetbrains.com/lp/mono/), both OFL, self-hosted as latin
subsets.
