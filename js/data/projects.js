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
 * Keeping it empty is deliberate. A page that says "nothing yet" is worth
 * more than a page with three invented projects on it.
 */

/** @type {Array<{title: string, summary: string, url?: string, year?: string|number, tags?: string[], pt?: {title?: string, summary?: string}}>} */
export const projects = [];
