<div align="center">

<img src="assets/favicon.svg" width="96" alt="">

# macieira.cc

**A personal site that is also an apple tree.**

*Macieira* is Portuguese for **apple tree**, and it's my surname.
So the front page isn't a photo and a paragraph. It's a tree,
whose seven apples are the only introduction there is.

[**↗ Visit the site**](https://macieira.cc) · [@MacieiraPT](https://github.com/MacieiraPT)

<br>

![macieira.cc](assets/og.png)

<br>

![No build step](https://img.shields.io/badge/build_step-none-3ddc84?style=for-the-badge&labelColor=08080a)
![Static](https://img.shields.io/badge/static-HTML_·_CSS_·_ES_modules-e8e8ea?style=for-the-badge&labelColor=08080a)
![WebGL](https://img.shields.io/badge/WebGL-two_scenes-ff3b30?style=for-the-badge&labelColor=08080a)
![Made in Portugal](https://img.shields.io/badge/made_in-Portugal-006600?style=for-the-badge&labelColor=08080a)

</div>

<br>

---

## Contents

- [What this is](#what-this-is)
- [The tree](#the-tree)
- [What's on the page](#whats-on-the-page)
- [Under the hood](#under-the-hood)
- [When things break](#when-things-break)
- [Whose site this is](#whose-site-this-is)
- [Credits](#credits)

---

## What this is

The personal site of **rudi** — a developer in Portugal, 18, early in the work and
building where it can be seen. It lives at **[macieira.cc](https://macieira.cc)**.

The brief was small and stubborn: put **one big idea on the first screen** instead of five
small ones, and let everything else earn its place underneath. The one big idea is the
tree. Everything else on the page is short enough to read standing up.

There are exactly **three links** — Steam, Discord, GitHub. That's the whole list, and the
page says so out loud.

---

## The tree

The hero is a tree that isn't drawn — it's **grown**. One recursive generator starts from a
single seed and branches outward, and the geometry follows the rules a real tree follows:

- Every limb starts *inside* its parent, so the wood is continuous rather than assembled.
- Radii follow the **pipe model** — a fork's children share out the parent's cross-section —
  so branches thin the way branches actually thin.
- The trunk widens into its roots along one unbroken curve.
- A couple of thousand leaves scatter through the volume *around* each outer branch, not
  laid on its surface — it's the spread that makes a canopy instead of a garland.

The seed is fixed, so **the same tree grows for everybody**, on every load, in every browser.

### The apples are hidden, and that's the point

Seven apples hang where the tree grew them. That means some are behind the trunk, most are
half under leaves, and finding them is the interaction. **Drag anywhere to turn the tree** —
free in yaw, with inertia on release and a slow idle drift, so it reads as turnable before
you touch it. Each apple you click opens one card: the name, the person, the training, the
stack, and the three places to find him.

Two details worth knowing, because they're what makes it feel fair rather than fiddly:

- **An apple you can't see is never a hit target you can't see.** Fruit facing away fades
  out *and* stops taking clicks, so you never hit something invisible or miss something you
  can plainly see.
- **Keyboard works in reverse.** Tab still reaches all seven — and focusing one that has
  turned away **spins the tree around to face you**. It's the accessible answer and the
  nicest thing in the scene.

The idle spin also pauses the moment you hover an apple, because a target that drifts under
your cursor as you reach for it is a target you miss.

---

## What's on the page

| | |
| --- | --- |
| **Hero** | The tree, the name, and the local time in Portugal. |
| **01 — now** | Shipped, working on, next. Three sentences, no roadmap theatre. |
| **02 — elsewhere** | Steam, Discord, GitHub. Handles that aren't links copy to your clipboard. |
| **03 — github** | A live panel read straight from the public GitHub API: profile counters, recent repositories, and a 14-day activity strip. Nothing is typed in by hand. |
| **Selected work** | Projects, as they arrive. The placeholder slots remove themselves the moment there's something real to show. |
| **04 — contact** | Two buttons, and a corner of draggable stickers you can throw around. |

Behind all of it, a second WebGL scene: **26,000 points** drifting as a haze, morphing into
a wave, and settling into the shape of the apple mark.

---

## Under the hood

No framework. No bundler. No CMS. What's in the repository is exactly what the browser gets.

| Library | Job on this page |
| --- | --- |
| [Lenis](https://github.com/darkroomengineering/lenis) | The inertia in the scroll — the base *feel* of the page. Nothing else animates on its own clock. |
| [GSAP](https://gsap.com) + ScrollTrigger | The hero intro, every scroll reveal, the pinned rail, the progress bar. |
| [Three.js](https://threejs.org) | Both scenes: the tree, and the particle field behind everything. |
| [anime.js](https://animejs.com) | The fine detail — SVG line-drawing, the apple → GitHub morph, and the spring-physics stickers. |

The clearest place to see them working as **one system** rather than four is the marquee
between sections 01 and 02: GSAP runs the loop, its speed and skew come from Lenis' scroll
velocity, and ScrollTrigger decides when to reset it.

**The buttons are always HTML.** All seven apples are real `<button>` elements and all seven
facts are real `<article>` elements, sitting in the document from the start. The 3D tree is
a *renderer*, not a rewrite — each frame it projects the fruit's position and moves the
buttons to sit on the mesh. Tab order, Enter, Space, focus rings and screen-reader output
are identical whether WebGL runs or not, because they're the same elements either way.

**Nothing loads that isn't needed.** The critical path is about 70 kB gzipped; the GitHub
panel, the animation detail and all of Three.js wait for the browser to be idle. The one
exception asked for immediately is the tree — it's the front page.

The approach owes its shape to [OFF+BRAND](https://www.itsoffbrand.com) — bold type, one
heavy motion layer, cinematic scroll, and a hard performance budget — minus the CMS, because
this page has to survive with JavaScript switched off.

---

## When things break

Every degradation is a designed state, not an accident:

| Situation | What you get |
| --- | --- |
| **JavaScript disabled** | The entire page, fully readable — including a hand-drawn SVG tree with working buttons and all the facts as plain text. Nothing is hidden without JS. |
| **No WebGL** | The SVG tree takes over, buttons and all. Three.js is never even downloaded. |
| **Only one WebGL context** | The tree wins it — it's content. The particle field falls back to CSS gradients without a word. |
| **No GPU at all** | Still runs, on the software renderer, at a lower particle count. |
| **GitHub API down or rate-limited** | The panel says `offline` and explains itself. The link to the profile never depended on the fetch. |
| **Slow frames** | A watchdog quietly drops the pixel ratio, then the foliage, until it's smooth again. |

One deliberate exception: **`prefers-reduced-motion` is not honoured here.** The smooth
scroll *is* the feel of the page, and half of it animating while the other half sat still
read as broken rather than as considerate. The honest mitigation is that nothing here is
large-amplitude or unexpected — no parallax on body text, no autoplaying transitions, no
motion that starts without a scroll or a click.

---

## Whose site this is

**rudi** — *Programador de Informática* (Level 4, Quadro Nacional de Qualificações),
Portugal. Currently on real-time graphics for the web, and the performance work that keeps
them running on a phone as well as a desktop.

<div align="center">

[![Website](https://img.shields.io/badge/macieira.cc-ff3b30?style=for-the-badge&logo=safari&logoColor=white&labelColor=08080a)](https://macieira.cc)
[![GitHub](https://img.shields.io/badge/@MacieiraPT-e8e8ea?style=for-the-badge&logo=github&logoColor=white&labelColor=08080a)](https://github.com/MacieiraPT)
[![Steam](https://img.shields.io/badge/r__di-66c0f4?style=for-the-badge&logo=steam&logoColor=white&labelColor=08080a)](https://steamcommunity.com/id/r_di/)

Discord: **rvdi**

</div>

---

## Credits

Brand icon paths from [simple-icons](https://simple-icons.org) (CC0); each mark identifies
the service its link points to. Type is [Archivo](https://fonts.google.com/specimen/Archivo)
and [JetBrains Mono](https://www.jetbrains.com/lp/mono/), both OFL, self-hosted as latin
subsets.

<div align="center">
<br>
<img src="assets/favicon.svg" width="28" alt="">
<br><br>
<sub>Grown, not drawn.</sub>
</div>
