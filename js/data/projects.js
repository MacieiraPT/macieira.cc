/**
 * projects.js — the dev side's growth slot.
 *
 * This is the one file to touch when there's something worth showing. Add an
 * object, reload: a card appears in the "Selected work" grid and the
 * placeholder slots disappear on their own. Nothing else needs editing.
 *
 * Shape:
 *   {
 *     title: string        // required — what it's called
 *     summary: string      // required — one honest sentence, no adjectives needed
 *     url?: string         // repo, demo, or write-up. Makes the card clickable.
 *     year?: string|number // shown in the corner
 *     tags?: string[]      // language / stack / course, kept short
 *     pt?: { title?: string, summary?: string }   // the Portuguese, if it differs
 *   }
 *
 * `pt` is optional per field: leave it out and the card reads the same in both
 * languages, which is usually right for a project's name. Everything else on
 * the page keeps its Portuguese in index.html — this is the one place where
 * copy is data, so it is the one place where the translation is data too.
 *
 * Example (delete the comment markers and edit):
 *
 *   {
 *     title: 'Semester 1 — algorithms sheet',
 *     summary: 'Sorting and search exercises worked through in C, with notes.',
 *     url: 'https://github.com/MacieiraPT/…',
 *     year: 2026,
 *     tags: ['C', 'coursework'],
 *     pt: { summary: 'Exercícios de ordenação e pesquisa feitos em C, com notas.' },
 *   },
 *
 * Nothing invented ever goes in here. A page that says "nothing yet" is worth
 * more than a page with three imaginary projects on it — but a portfolio whose
 * work section is *empty* is a different problem, and it had one: three dashed
 * "slot 01 / Reserved" placeholders where the work should be.
 *
 * The first entry is the site itself, which is the one project that was
 * already finished and already public when the grid was empty. It is also
 * written out as real markup in index.html, so the grid is not blank for a
 * crawler or for a visitor with JavaScript off; keep the two in step.
 */

/** @type {Array<{title: string, summary: string, url?: string, year?: string|number, tags?: string[], pt?: {title?: string, summary?: string}}>} */
export const projects = [
  {
    title: 'macieira.cc',
    summary:
      'This page: a WebGL apple tree, two scenes, no framework and no build step. Works with JavaScript switched off.',
    url: 'https://github.com/MacieiraPT/macieira.cc',
    year: 2026,
    tags: ['Three.js', 'GSAP', 'WebGL', 'Cloudflare'],
    pt: {
      summary:
        'Esta página: uma macieira em WebGL, duas cenas, sem framework e sem build. Funciona com o JavaScript desligado.',
    },
  },
];
