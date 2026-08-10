/**
 * scene/orchard.js — the tree.
 *
 * This is the front page. It is fetched as early as the browser will let us
 * and it is what everyone sees: the inline SVG tree in index.html exists only
 * so that a browser with no WebGL at all, or no JavaScript, still gets a page
 * that works. In every other case this replaces it before it is ever shown.
 *
 * ── Why a second WebGL context ────────────────────────────────────────────
 * The particle field owns one already, on a fixed full-viewport canvas behind
 * the whole page. The tree can't live there: it sits inside a column of the
 * hero and scrolls away with it, and mapping a fixed backdrop onto a scrolling
 * element's box means re-deriving that box every frame and fighting the field
 * for the same camera. A second, in-flow canvas costs one context and a
 * handful of draw calls, and stops rendering once it leaves the viewport.
 *
 * Browsers cap how many live contexts a page may hold, and when the cap is one
 * whoever asks first wins. This asks first, deliberately — see js/main.js.
 *
 * ── Why the fruit is still HTML ───────────────────────────────────────────
 * The apples you *click* are ordinary <button>s. This module projects each
 * apple's world position to screen coordinates every frame and hands them to
 * js/modules/tree.js, which moves the buttons to match. Tab order, Enter,
 * focus rings and screen-reader output are the same as they'd be without any
 * of this. There is no raycaster, and no canvas reimplementing a button.
 *
 * ── Motion ────────────────────────────────────────────────────────────────
 * The tree always moves. `prefers-reduced-motion` still governs the rest of
 * the page — no smooth scrolling, no intro, no reveals, no sticker physics —
 * but the tree, like the particle field, is the identity of the site rather
 * than decoration on top of it, and it is exempt.
 */

import {
  AmbientLight,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshPhongMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Timer,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import gsap from 'gsap';

import { env } from '../modules/env.js';

const FOV = 32;
/**
 * Half-extents the camera has to keep in shot, in world units, and the height
 * it centres on. CENTRE_Y is not the middle of the tree: it is set so the
 * trunk's base lands at ~88% down the canvas, where the ground glow in
 * site.css is painted. Get it wrong and the tree floats above its own shadow.
 */
const FRAME_W = 1.94;
const FRAME_H = 1.6;
const CENTRE_Y = 1.66;

/** Above this average frame time the watchdog starts giving things up. */
const SLOW_FRAME_MS = 26;

const APPLE_R = 0.125;
/** How far an apple hangs below the branch tip it grows from. */
const HANG = 0.11;

/* -------------------------------------------------------------------------- */
/* The skeleton                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Hand-authored rather than generated, for one reason: six of these limbs end
 * at a place a button has to be, and a recursive generator that produces a
 * prettier tree produces different tips every time you touch it.
 *
 * Every limb and twig *starts* on a coordinate that appears verbatim in its
 * parent's point list. A Catmull-Rom curve passes through all of its control
 * points, so sharing one is what guarantees the join is seamless.
 *
 * `leaves` is how many go on that branch and `spread` is how far out from it
 * they scatter. Both matter: leaves laid *on* a branch read as a garland wound
 * round a stick, and it is the spread that turns them into a canopy. Thin
 * outer growth carries most of them, which is true of apple trees and is also
 * what keeps the trunk readable.
 */
const TRUNK = {
  // Short and slim. Apple trees are mostly crown; an earlier pass had a trunk
  // half the height of the tree and it read as a lollipop.
  points: [[0, 0, 0], [0.03, 0.36, 0.02], [-0.02, 0.7, 0.01], [0, 1.02, 0]],
  from: 0.115,
  to: 0.058,
  leaves: 0,
  spread: 0,
};

/**
 * Limbs that end in fruit. `key` matches the button's data-apple.
 *
 * Every one of these curves *forward* — every tip has a positive z. That is a
 * UI decision, not a botanical one: an apple is a button, and an apple hanging
 * at the back of the crown is a button behind a hedge. Pushing the fruit onto
 * the near face of the tree, and then carving a sight line through the canopy
 * in front of each one (see growLeaves), is what keeps all six clickable from
 * the only angle anyone looks at this from.
 */
const LIMBS = [
  { key: 'name',     from: 0.056, to: 0.021, leaves: 62, spread: 0.34, points: [[0, 0.98, 0], [0.03, 1.5, 0.08], [0.05, 2, 0.2], [0.05, 2.4, 0.3]] },
  { key: 'stack',    from: 0.054, to: 0.02,  leaves: 62, spread: 0.34, points: [[0.02, 0.95, 0], [0.3, 1.35, -0.02], [0.66, 1.72, 0.1], [0.98, 1.98, 0.28]] },
  { key: 'training', from: 0.054, to: 0.02,  leaves: 62, spread: 0.34, points: [[-0.02, 0.95, 0.02], [-0.3, 1.35, 0.04], [-0.66, 1.72, 0.16], [-0.98, 1.98, 0.3]] },
  { key: 'steam',    from: 0.058, to: 0.022, leaves: 66, spread: 0.35, points: [[-0.03, 0.84, 0], [-0.48, 1.05, -0.02], [-1.02, 1.24, 0.12], [-1.42, 1.34, 0.32]] },
  { key: 'github',   from: 0.058, to: 0.022, leaves: 66, spread: 0.35, points: [[0.03, 0.82, 0], [0.5, 1.02, 0.02], [1.04, 1.22, 0.16], [1.45, 1.32, 0.34]] },
  // A matched pair hanging off the two inner limbs, low and to the front.
  { key: 'discord',  from: 0.03,  to: 0.015, leaves: 40, spread: 0.3,  points: [[0.3, 1.35, -0.02], [0.42, 1.22, 0.1], [0.5, 1.08, 0.24], [0.54, 0.98, 0.36]] },
  { key: 'who',      from: 0.03,  to: 0.015, leaves: 40, spread: 0.3,  points: [[-0.3, 1.35, 0.04], [-0.42, 1.22, 0.14], [-0.5, 1.08, 0.28], [-0.54, 0.98, 0.4]] },
];

/** Bare twigs. They carry the crown, and most of the foliage. */
const TWIGS = [
  { from: 0.022, to: 0.01,  leaves: 78, spread: 0.44, points: [[0.05, 2, 0.2], [-0.22, 2.16, 0.04], [-0.5, 2.16, -0.12]] },
  { from: 0.024, to: 0.01,  leaves: 78, spread: 0.44, points: [[-1.02, 1.24, 0.12], [-1.16, 1.5, -0.02], [-1.24, 1.76, -0.16]] },
  { from: 0.024, to: 0.01,  leaves: 78, spread: 0.44, points: [[1.04, 1.22, 0.16], [1.18, 1.48, 0], [1.26, 1.74, -0.14]] },
  { from: 0.022, to: 0.01,  leaves: 72, spread: 0.44, points: [[-0.66, 1.72, 0.16], [-0.72, 1.9, 0.02], [-0.7, 2.08, -0.14]] },
  { from: 0.022, to: 0.01,  leaves: 72, spread: 0.44, points: [[0.66, 1.72, 0.1], [0.76, 1.92, -0.04], [0.78, 2.1, -0.18]] },
  { from: 0.02,  to: 0.009, leaves: 60, spread: 0.4,  points: [[-0.48, 1.05, -0.02], [-0.56, 0.92, -0.14], [-0.6, 0.8, -0.26]] },
  { from: 0.02,  to: 0.009, leaves: 60, spread: 0.4,  points: [[0.5, 1.02, 0.02], [0.58, 0.9, -0.12], [0.62, 0.78, -0.24]] },
  { from: 0.019, to: 0.009, leaves: 66, spread: 0.42, points: [[0.03, 1.5, 0.08], [0.26, 1.64, -0.06], [0.44, 1.72, -0.2]] },
  { from: 0.019, to: 0.009, leaves: 66, spread: 0.42, points: [[0.03, 1.5, 0.08], [-0.2, 1.66, -0.08], [-0.38, 1.76, -0.22]] },
  { from: 0.018, to: 0.008, leaves: 62, spread: 0.42, points: [[-0.3, 1.35, 0.04], [-0.4, 1.54, -0.1], [-0.46, 1.7, -0.24]] },
  { from: 0.018, to: 0.008, leaves: 66, spread: 0.42, points: [[0.66, 1.72, 0.1], [0.9, 1.78, -0.06], [1.08, 1.8, -0.2]] },
  { from: 0.018, to: 0.008, leaves: 66, spread: 0.42, points: [[-0.66, 1.72, 0.16], [-0.9, 1.78, 0.02], [-1.08, 1.8, -0.14]] },
  { from: 0.018, to: 0.008, leaves: 62, spread: 0.42, points: [[-0.98, 1.98, 0.3], [-1.06, 2.12, 0.12], [-1.1, 2.24, -0.04]] },
  { from: 0.018, to: 0.008, leaves: 62, spread: 0.42, points: [[0.98, 1.98, 0.28], [1.06, 2.12, 0.1], [1.12, 2.24, -0.06]] },
  { from: 0.016, to: 0.007, leaves: 58, spread: 0.4,  points: [[0.05, 2.4, 0.3], [0.26, 2.5, 0.12], [0.42, 2.54, -0.04]] },
  { from: 0.016, to: 0.007, leaves: 58, spread: 0.4,  points: [[0.05, 2, 0.2], [0.3, 2.16, 0.08], [0.5, 2.24, -0.06]] },
];

/**
 * The base: a buttress that widens *downward* (radii run from `from` at the
 * top of the curve to `to` at the bottom, so inverting them flares the trunk
 * where it meets the ground) and seven surface roots spreading off it.
 *
 * These are generated rather than written out, unlike everything above. The
 * rule there was that a button depends on where each limb ends; nothing at all
 * depends on where a root ends, so a loop is fine — and it makes the count
 * trivial to change.
 */
const ROOTS = [
  { from: 0.118, to: 0.2, leaves: 0, spread: 0, points: [[0, 0.34, 0], [0.012, 0.18, 0.008], [0, 0.015, 0]] },
  ...[0.35, 1.25, 2.15, 3.05, 3.85, 4.65, 5.55].map((angle, i) => {
    const reach = 0.3 + ((i * 7) % 5) * 0.04;
    const sx = Math.sin(angle);
    const sz = Math.cos(angle);
    return {
      from: 0.052,
      to: 0.014,
      leaves: 0,
      spread: 0,
      points: [
        [sx * 0.06, 0.21, sz * 0.06],
        [sx * 0.17, 0.08, sz * 0.17],
        [sx * reach * 0.72, 0.018, sz * reach * 0.72],
        [sx * reach, -0.012, sz * reach],
      ],
    };
  }),
];

const ALL_BRANCHES = [TRUNK, ...ROOTS, ...LIMBS, ...TWIGS];

/* -------------------------------------------------------------------------- */
/* Geometry                                                                    */
/* -------------------------------------------------------------------------- */

const curveOf = (points) => new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z)));

/**
 * A branch: a tube along the curve, then tapered from `from` to `to`.
 *
 * TubeGeometry has one radius for its whole length, which on a tree is the
 * difference between a branch and a length of pipe. Rather than stitch
 * segments of decreasing radius together — visible seams, more draw calls —
 * this rebuilds the vertices: TubeGeometry lays them out as (tubular + 1)
 * rings of (radial + 1) vertices, generated at `curve.getPointAt(i / tubular)`,
 * so the ring centres can be recovered exactly and each ring pulled in toward
 * its own centre by the taper ratio for that point along the curve.
 */
function branchGeometry(curve, { from, to }, quality) {
  const tubular = quality.tubular;
  const radial = quality.radial;

  const geometry = new TubeGeometry(curve, tubular, from, radial, false);
  const position = geometry.attributes.position;
  const vertex = new Vector3();
  const centre = new Vector3();

  for (let i = 0; i <= tubular; i += 1) {
    curve.getPointAt(i / tubular, centre);
    // Radii are absolute, but the tube was built at `from`, so the shrink
    // factor is relative to it.
    const shrink = MathUtils.lerp(from, to, i / tubular) / from;

    for (let j = 0; j <= radial; j += 1) {
      const index = i * (radial + 1) + j;
      vertex.fromBufferAttribute(position, index);
      vertex.sub(centre).multiplyScalar(shrink).add(centre);
      position.setXYZ(index, vertex.x, vertex.y, vertex.z);
    }
  }

  // Bark tone, baked per vertex. Young wood at the tips is paler than the
  // trunk, and the ring-angle term fakes the facets that stop a tube from
  // reading as extruded plastic. Cheaper than a texture and it needs no
  // second material — three multiplies these into the shared bark colour.
  const tint = new Float32Array(position.count * 3);
  for (let i = 0; i <= tubular; i += 1) {
    const along = 0.78 + 0.42 * (i / tubular);
    for (let j = 0; j <= radial; j += 1) {
      const index = i * (radial + 1) + j;
      const facet = 0.9 + 0.16 * Math.abs(Math.sin(j * 2.7));
      const shade = along * facet;
      tint[index * 3] = shade;
      tint[index * 3 + 1] = shade * 0.985;
      tint[index * 3 + 2] = shade * 0.96;
    }
  }

  position.needsUpdate = true;
  geometry.setAttribute('color', new Float32BufferAttribute(tint, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A unit sphere pushed into an apple.
 *
 * The difference between an apple and a tomato is almost entirely profile, and
 * a plain sphere lands on tomato. Three things fix it, in order of how much
 * they matter: it is fractionally *taller* than it is wide (a tomato is
 * squatter), the base narrows while the shoulders stay full, and the stem well
 * is a deep, narrow pit rather than the broad saucer you get from denting a
 * sphere. The calyx at the bottom is a smaller version of the same dent.
 */
function appleGeometry(quality) {
  const geometry = new SphereGeometry(1, quality.appleSeg, Math.round(quality.appleSeg * 0.8));
  const position = geometry.attributes.position;
  const tint = new Float32Array(position.count * 3);
  const vertex = new Vector3();

  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i);
    const lat = vertex.y; // -1..1 on the unit sphere
    const theta = Math.atan2(vertex.z, vertex.x);

    // Full at the shoulders, tucked in underneath, with the five faint lobes
    // an apple has and a ball does not.
    const waist = (1 + 0.05 * lat - 0.3 * Math.pow(Math.max(0, -lat), 1.7))
      * (1 + 0.016 * Math.cos(theta * 5));
    vertex.x *= waist;
    vertex.z *= waist;
    vertex.y *= 1.07;

    // The high exponent is the point: it keeps the stem well narrow instead of
    // spreading the dent across the whole top.
    const top = Math.max(0, lat - 0.5) / 0.5;
    vertex.y -= Math.pow(top, 2.4) * 0.46;

    const base = Math.max(0, -lat - 0.68) / 0.32;
    vertex.y += Math.pow(base, 2) * 0.15;

    position.setXYZ(i, vertex.x, vertex.y, vertex.z);

    // Vertex colours, multiplied into whichever red the material carries. This
    // is most of what separates an apple from a tomato once the profile is
    // right: a tomato is one flat saturated red all over, an apple is deep at
    // the shoulders, warm and yellowish underneath, and faintly striped.
    const down = Math.pow((1 - lat) / 2, 1.7);
    const stripe = 0.95 + 0.05 * Math.sin(theta * 9 + Math.sin(theta * 3) * 2);
    tint[i * 3] = (0.86 + 0.34 * down) * stripe;
    tint[i * 3 + 1] = (0.55 + 1.5 * down) * stripe;
    tint[i * 3 + 2] = (0.62 + 0.5 * down) * stripe;
  }

  position.needsUpdate = true;
  geometry.setAttribute('color', new Float32BufferAttribute(tint, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * One leaf, grown along +Z from its stalk at the origin so a single `lookAt`
 * can aim it. A plane bent twice: tapered to a point, and cupped along its
 * length so it catches the key light instead of going flat grey side-on.
 */
function leafGeometry() {
  const geometry = new PlaneGeometry(1, 1, 3, 4);
  const position = geometry.attributes.position;
  const vertex = new Vector3();

  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i);
    const along = vertex.y + 0.5; // 0 at the stalk, 1 at the tip
    // sin() to zero the width at both ends; the exponent pushes the widest
    // point past the middle, which is what makes it a leaf and not a lens.
    const taper = Math.sin(Math.PI * Math.pow(along, 0.72));
    const x = vertex.x * taper;
    position.setXYZ(i, x, Math.sin(along * Math.PI) * 0.1 + x * x * 0.55, along);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/* -------------------------------------------------------------------------- */
/* Mount                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {ReturnType<import('../modules/tree.js').initTree>} tree
 * @returns {{ destroy(): void } | null} null when there is no context to draw in
 */
export function mountOrchard(canvas, tree) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: !env.smallScreen });
  } catch {
    return null; // caller reveals the SVG tree
  }

  // Small canvas, hard edges, no fill-rate problem — so unlike the particle
  // field this one can afford MSAA and a real pixel ratio.
  const quality = env.smallScreen
    ? { tubular: 26, radial: 6, appleSeg: 18, leaves: 1.1 }
    : { tubular: 40, radial: 10, appleSeg: 28, leaves: 2.4 };

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearAlpha(0);

  const styles = getComputedStyle(document.documentElement);
  const token = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 40);
  const grove = new Group();
  scene.add(grove);

  /* ---------------------------------------------------------------------- */
  /* Materials and lights                                                    */
  /* ---------------------------------------------------------------------- */

  // Knocked well below the token: --bark is picked to read on a dark page as a
  // flat SVG stroke, and a lit mesh of the same value comes out looking like
  // pale plastic. The light puts the value back.
  const barkMaterial = new MeshPhongMaterial({
    color: new Color(token('--bark', '#8b7b69')).multiplyScalar(0.34),
    shininess: 2,
    vertexColors: true,
  });

  // White, because every leaf's actual colour is a per-instance value that
  // three multiplies in — see the instance colours below.
  const leafMaterial = new MeshPhongMaterial({
    color: 0xffffff,
    shininess: 18,
    side: DoubleSide,
  });

  const fruitColor = new Color(token('--apple', '#e4392f'));
  const leafBase = new Color(token('--leaf', '#cdfb45'));

  // Low ambient, hard key: the tree is a silhouette problem before it is a
  // colour one, and a bright fill flattens the branches into cardboard.
  scene.add(new AmbientLight(0xffffff, 0.95));

  const key = new DirectionalLight(0xfff4e8, 3);
  key.position.set(2.4, 4.2, 3.2);
  scene.add(key);

  // Cool rim from the opposite side, tinted with the page's other accent, so
  // the silhouette separates from a near-black background.
  const rim = new DirectionalLight(new Color(token('--plasma', '#7d5cff')), 1.45);
  rim.position.set(-3.4, 1.6, -2.4);
  scene.add(rim);

  /* ---------------------------------------------------------------------- */
  /* Build                                                                   */
  /* ---------------------------------------------------------------------- */

  const disposables = [];
  // Curves are needed twice — once for the tube, once to hang leaves along —
  // and building a Catmull-Rom's arc-length table is the expensive half.
  const curves = new Map(ALL_BRANCHES.map((spec) => [spec, curveOf(spec.points)]));

  for (const spec of ALL_BRANCHES) {
    const geometry = branchGeometry(curves.get(spec), spec, quality);
    disposables.push(geometry);
    grove.add(new Mesh(geometry, barkMaterial));
  }

  /* --- Foliage ---------------------------------------------------------- */

  /**
   * Every leaf on the tree is one InstancedMesh: ~400 of them in a single draw
   * call, which is the only reason this can be per-leaf placed at all. They
   * never animate individually — the whole grove sways, and they go with it.
   */
  function growLeaves() {
    const total = ALL_BRANCHES.reduce(
      (sum, spec) => sum + Math.round(spec.leaves * quality.leaves),
      0
    );
    if (!total) return null;

    const geometry = leafGeometry();
    disposables.push(geometry);

    const mesh = new InstancedMesh(geometry, leafMaterial, total);
    const dummy = new Object3D();
    const point = new Vector3();
    const aim = new Vector3();
    const tipAt = new Vector3();
    const colour = new Color();
    let index = 0;

    // Where the fruit will hang. Leaves that land inside these get thrown
    // away: with the spread wide enough to make a canopy, foliage otherwise
    // grows straight through the apples, and the apples are the buttons.
    //
    // Where the fruit will hang, and the two ways a leaf can be in its way.
    //
    // A sphere around the apple is not enough: a leaf a third of a unit in
    // *front* of one is nowhere near it in 3D and completely on top of it on
    // screen. So the real test is a corridor — anything level with or nearer
    // than the fruit, within an apple's width of it in x/y, is cut. The camera
    // only swings ±15° with the pointer, so a corridor straight along z is a
    // good enough stand-in for the view direction, and much cheaper than
    // re-deriving one per frame.
    const clearance = (APPLE_R * 1.45) ** 2;
    const corridor = (APPLE_R * 1.75) ** 2;
    const fruitAt = LIMBS.map((limb) => {
      const tip = limb.points.at(-1);
      return new Vector3(tip[0], tip[1] - HANG, tip[2]);
    });
    const buried = (p) =>
      fruitAt.some(
        (f) =>
          p.distanceToSquared(f) < clearance ||
          (p.z > f.z - APPLE_R && (p.x - f.x) ** 2 + (p.y - f.y) ** 2 < corridor)
      );

    for (const spec of ALL_BRANCHES) {
      const count = Math.round(spec.leaves * quality.leaves);
      if (!count) continue;
      const curve = curves.get(spec);
      // Limbs are structure near the trunk and growth near the tip; twigs are
      // growth all the way along.
      const start = spec.key ? 0.34 : 0.05;

      for (let i = 0; i < count; i += 1) {
        const t = start + (1 - start) * ((i + Math.random()) / count);
        curve.getPointAt(Math.min(1, t), point);

        // Scatter into the volume around the branch, not onto its surface.
        // A cube root keeps the distribution even through that volume instead
        // of piling up at the rim, and the spread widens toward the tip
        // because that is where the new growth is.
        aim.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        if (aim.lengthSq() < 1e-6) aim.set(0, 1, 0);
        aim.normalize();
        aim.y -= 0.35; // the crown hangs rather than bristling
        aim.normalize();
        point.addScaledVector(aim, spec.spread * (0.35 + 0.65 * t) * Math.cbrt(Math.random()));

        const size = 0.05 + Math.pow(Math.random(), 0.8) * 0.08;
        // lookAt below puts +Z along `aim`, and the blade grows along +Z, so
        // this is where its tip lands. Both ends have to clear the fruit.
        tipAt.copy(point).addScaledVector(aim, size);
        if (buried(point) || buried(tipAt)) continue;

        dummy.position.copy(point);
        // Leaves face outward from the branch they grew on. Object3D.lookAt
        // aims +Z *away* from its target, so the target is the point behind
        // the leaf rather than in front of it.
        dummy.lookAt(point.x - aim.x, point.y - aim.y, point.z - aim.z);
        dummy.rotateZ(Math.random() * Math.PI * 2);

        dummy.scale.set(size * 0.66, size, size);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);

        // Deep, desaturated green with a wide spread of brightness. The acid
        // token is a UI accent — used literally for a thousand leaves it turns
        // the hero into a highlighter.
        colour.copy(leafBase).multiplyScalar(0.06 + Math.pow(Math.random(), 1.7) * 0.3);
        colour.offsetHSL(0.05 + Math.random() * 0.055, -0.3, 0);
        mesh.setColorAt(index, colour);
        index += 1;
      }
    }

    // `total` was an upper bound; rejected leaves leave unused slots at the
    // end, and drawing them would render a pile of leaves at the origin.
    mesh.count = index;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    grove.add(mesh);
    return mesh;
  }

  const foliage = growLeaves();

  /* --- Fruit ------------------------------------------------------------ */

  const bodyGeometry = appleGeometry(quality);
  const stemGeometry = branchGeometry(
    curveOf([[0, 0.56, 0], [0.06, 1.05, 0.02], [0.16, 1.52, 0.06]]),
    { from: 0.048, to: 0.026 },
    { tubular: 12, radial: 5 }
  );
  const appleLeafGeometry = leafGeometry();
  disposables.push(bodyGeometry, stemGeometry, appleLeafGeometry);

  /**
   * One apple. The pivot sits at the branch tip and the fruit hangs below it,
   * so a swing rotates around the stem — which is where a real one pivots,
   * and the reason this is two nested groups rather than one.
   */
  function plant({ key: name, points }, index) {
    const tip = new Vector3(...points.at(-1));

    const pivot = new Group();
    pivot.position.copy(tip);
    grove.add(pivot);

    const fruit = new Group();
    fruit.position.y = -HANG;

    // Each apple owns its material so hover and selection can light one up
    // without the other five glowing in sympathy — and so no two are exactly
    // the same red, which is most of what stops six of them reading as props.
    const material = new MeshPhongMaterial({
      color: new Color(fruitColor).offsetHSL(((index % 3) - 1) * 0.008, 0, ((index % 2) - 0.5) * 0.03),
      // A tight, small highlight. A broad soft one is the other half of why a
      // red sphere reads as a tomato — or as a snooker ball.
      shininess: 190,
      specular: new Color(0x4a2b28),
      vertexColors: true,
      emissive: new Color(fruitColor),
      emissiveIntensity: 0,
    });
    disposables.push(material);

    const scale = APPLE_R * (0.93 + ((index * 7) % 5) * 0.035);

    const body = new Mesh(bodyGeometry, material);
    body.scale.setScalar(scale);
    body.rotation.y = index * 1.1;
    fruit.add(body);

    const stem = new Mesh(stemGeometry, barkMaterial);
    stem.scale.setScalar(scale);
    fruit.add(stem);

    const leaf = new Mesh(appleLeafGeometry, leafMaterial);
    leaf.scale.set(scale * 0.46, scale * 0.8, scale * 0.8);
    leaf.position.set(scale * 0.2, scale * 1.34, scale * 0.06);
    leaf.lookAt(scale * 1.4, scale * 0.5, scale * 0.6);
    fruit.add(leaf);

    pivot.add(fruit);

    return {
      name,
      pivot,
      fruit,
      material,
      hovered: false,
      chosen: false,
      // Staggers the idle bob so six apples don't breathe in unison.
      phase: Math.random() * Math.PI * 2,
      screen: new Vector3(),
      placedX: NaN,
      placedY: NaN,
    };
  }

  const apples = LIMBS.map(plant);
  const byName = new Map(apples.map((apple) => [apple.name, apple]));

  // The apple leaves share the instanced foliage's white material, so they
  // need their own colour. One shared green is fine for six of them.
  const appleLeafColour = new Color(leafBase).multiplyScalar(0.34).offsetHSL(0.05, -0.1, 0);
  const appleLeafMaterial = new MeshPhongMaterial({
    color: appleLeafColour,
    shininess: 22,
    side: DoubleSide,
  });
  disposables.push(appleLeafMaterial);
  apples.forEach((apple) => {
    apple.fruit.children.forEach((child) => {
      if (child.geometry === appleLeafGeometry) child.material = appleLeafMaterial;
    });
  });

  // One apple is already open by the time this mounts — js/modules/tree.js
  // picks the first (or whichever the URL asked for) on the critical path.
  apples.forEach((apple) => {
    apple.chosen = apple.name === tree.picked;
    apple.material.emissiveIntensity = apple.chosen ? 0.24 : 0;
  });

  /* ---------------------------------------------------------------------- */
  /* Sizing                                                                  */
  /* ---------------------------------------------------------------------- */

  let width = 0;
  let height = 0;

  function resize() {
    width = canvas.clientWidth || 1;
    height = canvas.clientHeight || 1;

    camera.aspect = width / height;
    // Pull back until both extents are inside the frustum. The element's
    // aspect ratio is pinned in CSS, so in practice this settles once — but
    // it costs nothing and it means the tree can never be cropped.
    const half = Math.max(FRAME_H, FRAME_W / camera.aspect);
    camera.position.set(0, CENTRE_Y + 0.15, half / Math.tan(MathUtils.degToRad(FOV) / 2));
    camera.lookAt(0, CENTRE_Y, 0);
    camera.updateProjectionMatrix();

    renderer.setSize(width, height, false); // false: CSS owns the canvas box

    // The buttons' hit area is sized once here rather than per frame: depth
    // varies the on-screen size of an apple by a few percent, and tracking
    // that would mean writing a width to six elements sixty times a second.
    const perspective = height / (2 * Math.tan(MathUtils.degToRad(FOV) / 2) * camera.position.z);
    tree.setAppleSize(APPLE_R * 2.2 * perspective);
  }

  /* ---------------------------------------------------------------------- */
  /* Interaction                                                             */
  /* ---------------------------------------------------------------------- */

  const pointer = new Vector2(0, 0);
  const pointerEased = new Vector2(0, 0);

  const onPointerMove = (event) => {
    pointer.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -((event.clientY / window.innerHeight) * 2 - 1)
    );
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  /**
   * One place decides how an apple looks, because hover and selection both
   * want the same two properties and two independent handlers racing over
   * `scale` is how you get an apple stuck at 1.17 forever.
   */
  function paint(apple) {
    const lift = apple.hovered ? 1.18 : apple.chosen ? 1.09 : 1;
    const glow = apple.hovered ? 0.34 : apple.chosen ? 0.24 : 0;
    gsap.to(apple.fruit.scale, { x: lift, y: lift, z: lift, duration: 0.5, ease: 'power3.out' });
    gsap.to(apple.material, { emissiveIntensity: glow, duration: 0.5 });
  }

  /** Hover and keyboard focus are the same thing here: attention on one apple. */
  const unHover = tree.onHover((name, active) => {
    const apple = byName.get(name);
    if (!apple) return;
    apple.hovered = active;
    paint(apple);
  });

  const unPick = tree.onPick((name) => {
    apples.forEach((apple) => {
      apple.chosen = apple.name === name;
      paint(apple);
    });

    const apple = byName.get(name);
    if (!apple) return;

    // The pluck. Rotating the pivot swings the fruit on its stem; elastic.out
    // is it settling back onto the branch.
    gsap.fromTo(
      apple.pivot.rotation,
      { z: 0.34, x: -0.12 },
      { z: 0, x: 0, duration: 1.5, ease: 'elastic.out(1, 0.32)', overwrite: true }
    );
  });

  /* ---------------------------------------------------------------------- */
  /* Frame loop                                                              */
  /* ---------------------------------------------------------------------- */

  const timer = new Timer();
  timer.connect(document);

  let frameHandle = 0;
  let onScreen = true;
  let firstFrame = true;

  /**
   * Frame-time watchdog, same two-strikes shape as the particle field's.
   *
   * The tree is ~30k triangles in four draw calls, which is nothing for a GPU
   * and a great deal for a software rasteriser or a weak phone. Strike one
   * drops the pixel ratio, because fill rate goes first; strike two halves the
   * foliage, which is where nearly all of those triangles are and the only
   * part that can be cut without the tree stopping being a tree.
   */
  let pixelRatio = renderer.getPixelRatio();
  let sampled = 0;
  let accumulated = 0;
  let mitigations = 0;

  function watchPerformance(frameMs) {
    if (mitigations > 1) return;
    accumulated += frameMs;
    sampled += 1;
    if (sampled < 90) return;

    const average = accumulated / sampled;
    accumulated = 0;
    sampled = 0;
    if (average <= SLOW_FRAME_MS) return;

    mitigations += 1;
    if (mitigations === 1 && pixelRatio > 1) {
      pixelRatio = 1;
      renderer.setPixelRatio(1);
      resize();
    } else {
      if (foliage) foliage.count = Math.floor(foliage.count * 0.5);
      mitigations = 2;
    }
  }

  function project(apple) {
    apple.fruit.getWorldPosition(apple.screen);
    apple.screen.project(camera);

    const x = (apple.screen.x * 0.5 + 0.5) * width;
    const y = (-apple.screen.y * 0.5 + 0.5) * height;

    // Sub-pixel churn isn't visible but does cost a style write per apple per
    // frame, so only move a button when it has actually moved.
    if (Math.abs(x - apple.placedX) < 0.25 && Math.abs(y - apple.placedY) < 0.25) return;
    apple.placedX = x;
    apple.placedY = y;
    tree.place(apple.name, x, y, apple.screen.z);
  }

  function frame(timestamp) {
    frameHandle = requestAnimationFrame(frame);

    timer.update(timestamp);
    const elapsed = timer.getElapsed();
    const delta = Math.min(timer.getDelta(), 0.05);

    pointerEased.lerp(pointer, Math.min(1, delta * 3));
    grove.rotation.y = pointerEased.x * 0.26;
    grove.rotation.x = -pointerEased.y * 0.06;

    // Two slow sines an octave apart: enough to read as wind, never enough to
    // make the labels underneath the fruit hard to hit.
    grove.rotation.z = Math.sin(elapsed * 0.42) * 0.015 + Math.sin(elapsed * 0.19) * 0.011;

    for (const apple of apples) {
      apple.pivot.rotation.y = Math.sin(elapsed * 0.5 + apple.phase) * 0.22;
      apple.fruit.position.y = -HANG + Math.sin(elapsed * 0.75 + apple.phase) * 0.012;
    }

    grove.updateMatrixWorld();
    for (const apple of apples) project(apple);

    const started = performance.now();
    renderer.render(scene, camera);
    watchPerformance(performance.now() - started);

    if (firstFrame) {
      firstFrame = false;
      canvas.classList.add('is-live');
      tree.beginProjection();
      intro();
    }
  }

  /** The crown fills in, then the fruit ripens onto it. */
  function intro() {
    if (foliage) {
      gsap.fromTo(
        foliage.scale,
        { x: 0.55, y: 0.55, z: 0.55 },
        { x: 1, y: 1, z: 1, duration: 1.5, ease: 'power3.out' }
      );
    }

    apples.forEach((apple, index) => {
      // Ends where paint() would have put it, so the apple that starts picked
      // doesn't grow to full size and then quietly step up again.
      const lift = apple.chosen ? 1.09 : 1;
      gsap.fromTo(
        apple.fruit.scale,
        { x: 0.01, y: 0.01, z: 0.01 },
        { x: lift, y: lift, z: lift, duration: 0.9, delay: 0.4 + 0.08 * index, ease: 'back.out(2)' }
      );
    });
  }

  function start() {
    if (frameHandle) return;
    timer.reset();
    frameHandle = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(frameHandle);
    frameHandle = 0;
  }

  /** Scrolled past is the common case for a hero, and the cheapest to fix. */
  const observer = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen && !document.hidden) start();
      else stop();
    },
    { rootMargin: '120px' }
  );
  observer.observe(canvas);

  const onVisibility = () => {
    if (document.hidden || !onScreen) stop();
    else start();
  };
  document.addEventListener('visibilitychange', onVisibility);

  /** GPU taken away mid-session: hand the picture back to the SVG. */
  const onContextLost = (event) => {
    event.preventDefault();
    stop();
    canvas.classList.remove('is-live');
    tree.endProjection();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  window.addEventListener('resize', resize);

  resize();
  start();

  return {
    destroy() {
      stop();
      observer.disconnect();
      unHover();
      unPick();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      timer.disconnect();
      disposables.forEach((item) => item.dispose());
      barkMaterial.dispose();
      leafMaterial.dispose();
      renderer.dispose();
      tree.endProjection();
    },
  };
}
