/**
 * apple.js — the mark, as data.
 *
 * "Macieira" is Portuguese for *apple tree*, so the apple is the site's
 * identity rather than a decoration. It shows up in four places, and this
 * file is the source for the one place that can't just write SVG:
 * js/scene/particles.js, which rasterises these paths to work out where
 * 26 000 points have to be to spell an apple.
 *
 * These are **silhouette** paths: every part is a closed, fillable shape,
 * including the stem, because filling a stroke-only path produces nothing.
 * The display artwork in index.html (`#i-apple`) is drawn differently — a
 * stroked stem reads better at 26 px than a filled one — so the two are
 * deliberately separate pieces of art for the same mark, not a copy that
 * has to be kept in sync.
 *
 * All coordinates are in a 48 × 48 box.
 */

/** Body: two shoulders, a dip at the top, a soft base. One closed path. */
export const APPLE_BODY =
  'M24 15.6c-2.8-4.2-8.6-5.4-12.3-2-4.5 4.1-4.1 12.8-.4 19.6 2.4 4.4 5.6 7.2 8.3 6.2 ' +
  '1.7-.6 2.7-1.2 4.4-1.2s2.7.6 4.4 1.2c2.7 1 5.9-1.8 8.3-6.2 3.7-6.8 4.1-15.5-.4-19.6-3.7-3.4-9.5-2.2-12.3 2Z';

/** Leaf: a lens sitting to the upper right of the stem. */
export const APPLE_LEAF = 'M26.2 10.6C29.5 5.9 34.9 4.7 38.4 6.9 37.7 11.8 33.1 14.7 27.9 12.7Z';

/** Stem, as a fillable sliver rather than a stroke. */
export const APPLE_STEM = 'M22.9 16.2C23.2 11 24.9 6.8 28 3.5l2 1.9c-2.7 2.9-4.2 6.5-4.5 11.1z';

/** Everything, in paint order — what the particle field samples. */
export const APPLE_SILHOUETTE = [APPLE_BODY, APPLE_STEM, APPLE_LEAF];

/** The box the paths above are drawn in. */
export const APPLE_VIEWBOX = 48;
