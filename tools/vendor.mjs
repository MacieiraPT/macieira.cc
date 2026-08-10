#!/usr/bin/env node
/**
 * vendor.mjs — regenerates the files in /vendor.
 *
 * The site itself has NO build step: `index.html` + `/js` + `/vendor` are
 * deployed exactly as they are committed. This script exists only so the
 * pinned library versions can be refreshed reproducibly:
 *
 *     npm install        # pulls the pinned versions into node_modules
 *     npm run vendor     # re-bundles them into /vendor
 *
 * Each bundle is an ES module with a bare-specifier entry in the import map
 * inside index.html, so application code reads exactly like it would in a
 * bundled project (`import gsap from 'gsap'`).
 *
 * This script also **rewrites that import map**, stamping each entry with the
 * bundle's content hash. /vendor is served `immutable` for a year, so the URL
 * has to change when the bytes do — see the note above the rewrite below.
 *
 * Why bundle at all instead of copying the published dist files?
 *   - gsap only ships un-minified ESM (~110 kB gzip across its files);
 *     bundling + minifying gets the same modules down to ~44 kB gzip.
 *   - anime.js and three.js are tree-shaken down to the parts this site
 *     actually uses, which cuts roughly a third off both.
 *
 * Trade-off worth knowing: because three.js and anime.js are tree-shaken
 * against the export lists below, using a *new* API from either library
 * means adding it to `exports` here and re-running `npm run vendor`.
 * The browser makes that failure obvious ("does not provide an export
 * named ..."), and the committed /vendor keeps working until then.
 */

import { build } from 'esbuild';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outdir = join(root, 'vendor');

/** Reads the resolved version of a dependency, for the bundle banner. */
async function versionOf(pkg) {
  const path = join(root, 'node_modules', pkg, 'package.json');
  return JSON.parse(await readFile(path, 'utf8')).version;
}

/**
 * Bundle definitions. `entry` is a tiny synthetic module: esbuild starts from
 * it, follows the imports into node_modules, and drops everything unreachable.
 */
const bundles = [
  {
    file: 'gsap.min.mjs',
    packages: ['gsap'],
    // Both `gsap` and `gsap/ScrollTrigger` are mapped to this one file in the
    // import map, so the plugin and the core share a single module instance —
    // which is what `gsap.registerPlugin()` needs.
    entry: `
      export { default, gsap } from 'gsap';
      export { ScrollTrigger } from 'gsap/ScrollTrigger.js';
    `,
  },
  {
    file: 'lenis.min.mjs',
    packages: ['lenis'],
    entry: `export { default } from 'lenis';`,
  },
  {
    file: 'anime.min.mjs',
    packages: ['animejs'],
    // The exact anime.js v4 surface used by js/modules/details.js.
    entry: `
      export { animate, createDraggable, spring, stagger, svg } from 'animejs';
    `,
  },
  {
    file: 'three.min.mjs',
    packages: ['three'],
    // The exact three.js surface used by js/scene/*. Tree-shaking three is
    // what keeps the lazy-loaded WebGL chunk near ~128 kB gzip instead of ~183.
    //
    // Two scenes share this bundle: the particle field (shader material, no
    // lighting) and the orchard (lit meshes). MeshPhongMaterial is the *only*
    // lit material exported, and both the bark and the fruit use it — adding
    // Lambert or Standard alongside it would pull a second lighting shader
    // library in for no visible gain at this scale.
    entry: `
      export {
        Scene, PerspectiveCamera, WebGLRenderer, Group, Timer,
        BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial,
        AdditiveBlending, Vector2, Vector3, Color, MathUtils,
        Mesh, MeshPhongMaterial, SphereGeometry, TubeGeometry, PlaneGeometry,
        CatmullRomCurve3, AmbientLight, DirectionalLight,
        InstancedMesh, Object3D, DoubleSide,
      } from 'three';
    `,
  },
];

await mkdir(outdir, { recursive: true });

/** file name → short content hash, used to version the import map below. */
const stamps = {};
let total = 0;
for (const bundle of bundles) {
  const versions = await Promise.all(
    bundle.packages.map(async (p) => `${p}@${await versionOf(p)}`)
  );

  await build({
    stdin: { contents: bundle.entry, resolveDir: root, loader: 'js' },
    outfile: join(outdir, bundle.file),
    bundle: true,
    format: 'esm',
    minify: true,
    // Baseline of browsers that support import maps + WebGL2 comfortably.
    target: ['chrome100', 'firefox108', 'safari16', 'edge100'],
    legalComments: 'none',
    banner: {
      js:
        `/* ${versions.join(', ')} — bundled for macieira.cc by tools/vendor.mjs.\n` +
        `   Upstream licenses: see each package on npm. Do not edit by hand. */`,
    },
    logLevel: 'warning',
  });

  const path = join(outdir, bundle.file);
  const bytes = await readFile(path);
  const raw = (await stat(path)).size;
  const gz = gzipSync(bytes).length;
  total += gz;
  stamps[bundle.file] = createHash('sha256').update(bytes).digest('hex').slice(0, 8);
  console.log(
    `  ${bundle.file.padEnd(16)} ${String(Math.round(raw / 1024)).padStart(5)} kB` +
      ` → ${String(Math.round(gz / 1024)).padStart(4)} kB gzip   (${versions.join(', ')})`
  );
}

console.log(`  ${'—'.repeat(16)} ${String(Math.round(total / 1024)).padStart(24)} kB gzip total`);

/* -------------------------------------------------------------------------- */
/* Cache busting                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Stamp the import map in index.html with each bundle's content hash.
 *
 * This is not a nicety. `_headers` serves /vendor/* as `immutable` for a year,
 * which is only safe if the URL changes when the bytes do — and the file names
 * here never change. Without this, rebuilding a bundle strands every returning
 * visitor on the copy they already have, for a year. That is not a theoretical
 * failure: adding three.js exports for the 3D tree shipped an orchard module
 * that imported symbols the cached bundle didn't export, and every browser
 * that had visited before silently fell back to the flat SVG tree.
 *
 * A query string is enough — caches key on the full URL — and it keeps the
 * file names in /vendor readable, which hashed file names would not.
 */
const indexPath = join(root, 'index.html');
const html = await readFile(indexPath, 'utf8');

let stamped = 0;
const updated = html.replace(
  /"\/vendor\/([\w.-]+\.mjs)(?:\?v=[0-9a-f]+)?"/g,
  (match, file) => {
    if (!stamps[file]) return match; // not something this script builds
    stamped += 1;
    return `"/vendor/${file}?v=${stamps[file]}"`;
  }
);

if (updated !== html) {
  await writeFile(indexPath, updated);
  console.log(`\n  import map restamped — ${stamped} entries in index.html`);
} else {
  console.log(`\n  import map already current (${stamped} entries)`);
}
