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
 *   }
 *
 * Example (delete the comment markers and edit):
 *
 *   {
 *     title: 'Semester 1 — algorithms sheet',
 *     summary: 'Sorting and search exercises worked through in C, with notes.',
 *     url: 'https://github.com/MacieiraPT/…',
 *     year: 2026,
 *     tags: ['C', 'coursework'],
 *   },
 *
 * Keeping it empty is deliberate. A page that says "nothing yet" is worth
 * more than a page with three invented projects on it.
 */

/** @type {Array<{title: string, summary: string, url?: string, year?: string|number, tags?: string[]}>} */
export const projects = [];
