/**
 * scene/orchard.js — the tree.
 *
 * This is the front page. It is fetched as early as the browser will let us
 * and it is what everyone sees: the inline SVG tree in index.html exists only
 * so that a browser with no WebGL at all, or no JavaScript, still gets a page
 * that works. In every other case this replaces it before it is ever shown.
 *
 * ── The tree is grown, not drawn ──────────────────────────────────────────
 * An earlier version listed every branch by hand. It worked, but joins were a
 * manual promise — each child had to *start* on a coordinate copied out of its
 * parent — and the root flare was a separate, wider cylinder butted onto the
 * bottom of the trunk, which is exactly as seamless as that sounds.
 *
 * Now one recursive generator grows the whole thing from a seed, and continuity
 * is structural rather than clerical:
 *
 *   - every child begins at its parent's end point, backed a little way *into*
 *     it, so the tubes overlap instead of meeting;
 *   - a sphere sits at every fork, sized to the parent's end radius, so no
 *     angle of split can open a gap;
 *   - radii follow the pipe model — a fork's children share out the parent's
 *     cross-section — so limbs thin out the way a real one does;
 *   - the trunk widens into its roots along one continuous radius curve.
 *
 * The seed is fixed, so the tree is the same on every load and in every
 * browser. Change SEED and you get a different tree, immediately.
 *
 * ── The fruit is HTML, and hidden ─────────────────────────────────────────
 * The apples you click are ordinary <button>s. This module projects each one's
 * world position to screen coordinates every frame and hands them to
 * js/modules/tree.js, which moves the buttons to match. No raycaster, and no
 * canvas reimplementing what a button already does.
 *
 * They are also genuinely hidden in the canopy — there is no clearing cut for
 * them any more. Finding them is the point. What that costs, and how it is
 * paid for, is in the "Orbit" section below.
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

/** Change this and the tree changes. It is 28 June 2008 — see ui.js. */
const SEED = 20080628;

const FOV = 34;
/** Half the vertical field of view, in radians. The framing is all done in it. */
const HALF_FOV = MathUtils.degToRad(FOV) / 2;
/** Above this average frame time the watchdog starts giving things up. */
const SLOW_FRAME_MS = 26;

const APPLE_R = 0.115;
/** How far an apple hangs below the branch tip it grows from. */
const HANG = 0.1;
/** How much bigger a hovered apple gets — see paint(). */
const HOVER = 1.18;
/** How far a picked one swings off its branch — see onPick. */
const PLUCK = 0.34;
/**
 * Amplitude of the wind, in radians of tilt about the tree's base — see
 * frame(). Named because resize() has to frame for the lean as well as for the
 * tree: at the top of the crown it is worth rather more than it looks.
 */
const SWAY = 0.022;

/* -------------------------------------------------------------------------- */
/* Growth parameters                                                           */
/* -------------------------------------------------------------------------- */

const CROWN = {
  /** How many times a limb forks before it stops. */
  maxDepth: 5,
  /** Chance of a three-way fork rather than two. */
  trident: 0.34,
  /** Each segment is this fraction of its parent's length. */
  decay: 0.82,
  /** A branch narrows to this much of its start radius along its own length. */
  taper: 0.8,
  /**
   * Pipe-model exponent. Children of a fork satisfy Σ rᶜ = r_parent^c, so a
   * two-way fork gives each child 74% of the parent and a three-way 62%. Lower
   * values make a broom, higher ones make a candelabra.
   */
  pipe: 2.3,
  /** How far each child leans off its parent's direction, per depth. */
  spread: [0.86, 0.68, 0.56, 0.5, 0.46],
  /** How much a segment wanders along its own length, per depth. */
  bend: [0.14, 0.24, 0.3, 0.36, 0.42],
  /**
   * Pull back toward vertical. Kept low on purpose: an apple tree is as wide
   * as it is tall, and a strong upward bias turns the first fork's spread back
   * into a column — which is how an earlier pass ended up a lollipop.
   */
  phototropism: 0.13,
};

const ROOTS = {
  count: 6,
  maxDepth: 2,
  decay: 0.66,
  taper: 0.62,
  pipe: 2.1,
  spread: [0.5, 0.44],
  bend: [0.22, 0.3],
  /** Negative phototropism — roots dive, then flatten out along the ground. */
  phototropism: -0.34,
};

/** Order matters only in that each key must exist as a [data-apple] button. */
const FRUIT_KEYS = ['name', 'who', 'training', 'stack', 'steam', 'discord', 'github'];

/* -------------------------------------------------------------------------- */
/* Growing                                                                     */
/* -------------------------------------------------------------------------- */

/** mulberry32 — small, fast, and identical everywhere, which is the point. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Grows the whole skeleton.
 *
 * Returns flat lists rather than a tree, because nothing downstream cares
 * about the hierarchy — the geometry pass wants branches, the foliage pass
 * wants outer branches, and the fruit pass wants tips.
 */
function growSkeleton(rng) {
  const branches = [];
  const joints = [];
  const tips = [];
  // Only the height, and only so the camera can be pointed at the middle of the
  // tree. How far back it then has to stand is sweepRadius()'s problem, and it
  // needs the points themselves rather than a summary of them.
  const bounds = { maxY: 0, minY: 0 };

  const track = (p) => {
    if (p.y > bounds.maxY) bounds.maxY = p.y;
    if (p.y < bounds.minY) bounds.minY = p.y;
  };

  /** A slightly wandering run of points, for one branch. */
  function segment(start, direction, length, bend, upBias) {
    const points = [start.clone()];
    const dir = direction.clone().normalize();
    const cursor = start.clone();
    const steps = 3;

    for (let i = 0; i < steps; i += 1) {
      dir.x += (rng() - 0.5) * bend;
      dir.y += (rng() - 0.5) * bend * 0.5 + upBias / steps;
      dir.z += (rng() - 0.5) * bend;
      dir.normalize();
      cursor.addScaledVector(dir, length / steps);
      points.push(cursor.clone());
      track(cursor);
    }

    return { points, end: cursor.clone(), dir };
  }

  const side = new Vector3();
  const other = new Vector3();
  const axis = new Vector3();
  const guide = new Vector3();

  /**
   * Leans one child off its parent by `angle`.
   *
   * The children of a fork are spaced *evenly* around the parent's direction
   * rather than each picking a random perpendicular. That one change is the
   * difference between a tree and a shrub: independent random axes let two of
   * three children set off the same way, the error compounds at every depth,
   * and the crown ends up hanging off one side. Spacing them means a fork
   * opens like a fork, and the tree grows balanced without being symmetrical.
   */
  function deviate(dir, angle, upBias, index = 0, count = 1, roll = 0) {
    guide.set(0, 1, 0);
    if (Math.abs(dir.y) > 0.92) guide.set(1, 0, 0);
    side.crossVectors(dir, guide).normalize();
    other.crossVectors(dir, side).normalize();

    const azimuth = roll + (index / count) * Math.PI * 2;
    axis
      .copy(side)
      .multiplyScalar(Math.cos(azimuth))
      .addScaledVector(other, Math.sin(azimuth))
      .normalize();

    const out = dir.clone().applyAxisAngle(axis, angle * (0.82 + rng() * 0.36));
    out.y += upBias;
    return out.normalize();
  }

  function grow(spec, start, direction, radius, length, depth, tag) {
    const bend = spec.bend[Math.min(depth, spec.bend.length - 1)];
    const seg = segment(start, direction, length, bend, spec.phototropism * 0.5);

    const terminal = depth >= spec.maxDepth;
    const forks = terminal ? 0 : rng() < spec.trident ? 3 : 2;
    // The branch narrows along its own length; the fork then divides what's
    // left. Keeping those two steps separate is what stops a fork from either
    // pinching or bulging.
    const ending = radius * spec.taper;

    branches.push({ points: seg.points, r0: radius, r1: ending, depth, tag });

    if (terminal) {
      tips.push({ at: seg.end, dir: seg.dir });
      return;
    }

    // Covers the parent's end cap and every child's start, whatever the angle.
    joints.push({ at: seg.end, r: ending * 1.06 });

    const childRadius = ending * Math.pow(forks, -1 / spec.pipe);
    const spread = spec.spread[Math.min(depth, spec.spread.length - 1)];

    const roll = rng() * Math.PI * 2;
    for (let i = 0; i < forks; i += 1) {
      const dir = deviate(seg.dir, spread, spec.phototropism, i, forks, roll);
      // Back the child up *into* the parent. Two round tubes meeting end to
      // end leave a crescent gap at any real fork angle; overlapping them by
      // most of a radius means there is nothing to leave a gap.
      const from = seg.end.clone().addScaledVector(dir, -ending * 0.9);
      grow(spec, from, dir, childRadius, length * spec.decay, depth + 1, tag);
    }
  }

  /* -- trunk ------------------------------------------------------------- */

  // Short. Apple trees are mostly crown, and every centimetre of bare trunk
  // is a centimetre the canopy doesn't get.
  const trunkRadius = 0.115;
  const trunk = segment(new Vector3(0, 0, 0), new Vector3(0.02, 1, 0.01), 0.52, 0.05, 0);
  branches.push({
    points: trunk.points,
    r0: trunkRadius,
    r1: trunkRadius * 0.62,
    depth: 0,
    tag: 'trunk',
    // The flare. One radius curve over the trunk's own length rather than a
    // separate, wider stump underneath it — which is what used to sit there,
    // and what used to show a seam and a step in diameter at the join.
    profile: (t) => 0.62 + 0.38 * Math.pow(1 - t, 2.4),
  });
  joints.push({ at: trunk.end, r: trunkRadius * 0.66 });

  // Four main limbs, thrown wide. This first split does more for the
  // silhouette than every parameter below it.
  const mains = 4;
  const crownRadius = trunkRadius * 0.62 * Math.pow(mains, -1 / CROWN.pipe);
  for (let i = 0; i < mains; i += 1) {
    // Evenly around the compass, then jittered — left to chance alone, four
    // branches clump and the tree grows lopsided.
    const around = (i / mains) * Math.PI * 2 + 0.5 + rng() * 0.3;
    const dir = new Vector3(Math.sin(around) * 0.78, 0.72 + rng() * 0.3, Math.cos(around) * 0.78)
      .normalize();
    const from = trunk.end.clone().addScaledVector(dir, -trunkRadius * 0.5);
    grow(CROWN, from, dir, crownRadius, 0.72, 1, 'crown');
  }

  /* -- roots -------------------------------------------------------------- */

  // Grown from a point *inside* the trunk's base, so the first stretch of every
  // root is buried in it and only emerges once it is clear of the flare.
  for (let i = 0; i < ROOTS.count; i += 1) {
    const angle = (i / ROOTS.count) * Math.PI * 2 + rng() * 0.5;
    const dir = new Vector3(Math.sin(angle), -0.42 - rng() * 0.3, Math.cos(angle)).normalize();
    const from = new Vector3(Math.sin(angle) * 0.02, 0.075, Math.cos(angle) * 0.02);
    grow(ROOTS, from, dir, trunkRadius * 0.34, 0.3, 0, 'root');
  }

  return { branches, joints, tips, bounds };
}

/**
 * Picks the seven tips that get fruit, one per sector of the compass.
 *
 * Spread matters more than height here: the apples are hidden in the canopy
 * and the only way to find one is to turn the tree, so they need to be spaced
 * around it rather than clustered on whichever side grew best.
 */
function chooseFruit(tips, keys, rng) {
  /**
   * No two apples closer than this. Without it the sector pass happily puts
   * two on neighbouring twigs of the same limb, which on screen is one apple
   * with a second poking out of it — and two buttons stacked on top of each
   * other, which is worse.
   */
  const MIN_SEPARATION = 0.46;

  const sectorOf = (at) =>
    Math.floor(((Math.atan2(at.x, at.z) + Math.PI) / (Math.PI * 2)) * keys.length) % keys.length;

  const candidates = tips
    .filter((tip) => tip.at.y > 0.8 && Math.hypot(tip.at.x, tip.at.z) > 0.35)
    .map((tip) => ({
      at: tip.at,
      // Outermost first — fruit on the rim of the crown is findable; fruit
      // deep inside it is just lost.
      score: Math.hypot(tip.at.x, tip.at.z) * 1.4 + tip.at.y * 0.3 + rng() * 0.3,
    }))
    .sort((a, b) => b.score - a.score);

  if (!candidates.length) return keys.map((key) => ({ key, at: new Vector3(0, 1.4, 0) }));

  const chosen = [];
  const apart = (at) => chosen.every((other) => other.distanceTo(at) >= MIN_SEPARATION);

  // Best of each sector, spaced out. Then relax the sector rule, then — only
  // if a very lopsided tree leaves us short — the spacing rule too.
  const sectors = new Set();
  for (const c of candidates) {
    if (chosen.length === keys.length) break;
    const sector = sectorOf(c.at);
    if (sectors.has(sector) || !apart(c.at)) continue;
    sectors.add(sector);
    chosen.push(c.at);
  }
  for (const c of candidates) {
    if (chosen.length === keys.length) break;
    if (!chosen.includes(c.at) && apart(c.at)) chosen.push(c.at);
  }
  for (const c of candidates) {
    if (chosen.length === keys.length) break;
    if (!chosen.includes(c.at)) chosen.push(c.at);
  }

  // Round the compass, so tabbing through the keys walks around the tree
  // rather than jumping back and forth across it.
  chosen.sort((a, b) => Math.atan2(a.x, a.z) - Math.atan2(b.x, b.z));
  return keys.map((key, index) => ({ key, at: chosen[index % chosen.length] }));
}

/**
 * The radius of the sphere the tree sweeps as it turns, about the point the
 * camera orbits. resize() frames on it.
 *
 * A sphere rather than the crown's width because the tree turns: what has to
 * stay on the canvas is not the picture at one angle but the solid every angle
 * is a slice of. It is measured over the points the geometry pass will actually
 * draw, each padded by how much it draws there — the tube's own radius along a
 * branch, and a whole apple at each fruiting tip.
 *
 * Leaves are deliberately left out. They scatter a long way past the tips they
 * hang from, and framing for the furthest one would stand the camera back far
 * enough to lose a fifth of the tree. A leaf trimmed at the rim of a canopy
 * that is already a soft edge is not something anyone can see; half an apple
 * is, which is the whole reason this function exists.
 *
 * @param {number} fruitReach radius of one apple, at its most swollen
 */
function sweepRadius(skeleton, fruit, fruitReach, centreY) {
  let radius = 0;
  // The wind tilts the whole grove about its base, so every point is measured
  // at both ends of the lean rather than where it stands.
  const tilt = Math.cos(SWAY);
  const lean = Math.sin(SWAY);

  const reach = (p, pad) => {
    for (const way of [-1, 1]) {
      const x = p.x * tilt - p.y * lean * way;
      const y = p.x * lean * way + p.y * tilt;
      const out = Math.hypot(Math.hypot(x, p.z), y - centreY) + pad;
      if (out > radius) radius = out;
    }
  };

  for (const branch of skeleton.branches) {
    // Whichever end is thicker. branchGeometry() interpolates between the two
    // and never overshoots either, flare profile included.
    const pad = Math.max(branch.r0, branch.r1);
    for (const point of branch.points) reach(point, pad);
  }
  // The joints are spheres at branch ends, and never wider than the branch they
  // cap, so the pass above has already covered them.
  for (const at of fruit) reach(at, fruitReach);

  return radius;
}

/* -------------------------------------------------------------------------- */
/* Geometry                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A branch: a tube along the curve, then tapered.
 *
 * TubeGeometry has one radius for its whole length, which on a tree is the
 * difference between a branch and a length of pipe. Rather than stitch
 * segments of decreasing radius together, this rebuilds the vertices:
 * TubeGeometry lays them out as (tubular + 1) rings of (radial + 1) vertices,
 * generated at `curve.getPointAt(i / tubular)`, so each ring's centre can be
 * recovered exactly and the ring pulled in toward it.
 *
 * `profile` is the shape of that taper in 0..1 of the radius range — linear by
 * default, and a power curve for the trunk, which is where the root flare
 * comes from.
 */
function branchGeometry(branch, quality) {
  const curve = new CatmullRomCurve3(branch.points);
  const tubular = Math.max(6, Math.round(quality.tubular * (branch.depth === 0 ? 1.4 : 1)));
  const radial = Math.max(4, quality.radial - Math.min(3, branch.depth));
  const { r0, r1 } = branch;
  const profile = branch.profile ?? ((t) => 1 - t);

  const geometry = new TubeGeometry(curve, tubular, r0, radial, false);
  const position = geometry.attributes.position;
  const tint = new Float32Array(position.count * 3);
  const vertex = new Vector3();
  const centre = new Vector3();

  for (let i = 0; i <= tubular; i += 1) {
    const t = i / tubular;
    curve.getPointAt(t, centre);
    // Radii are absolute, but the tube was built at r0, so the factor is
    // relative to it.
    const shrink = (r1 + (r0 - r1) * profile(t)) / r0;
    // Paler young wood toward the tips.
    const along = 0.72 + 0.5 * t * (branch.depth > 0 ? 1 : 0.2);

    for (let j = 0; j <= radial; j += 1) {
      const index = i * (radial + 1) + j;
      vertex.fromBufferAttribute(position, index);
      vertex.sub(centre).multiplyScalar(shrink).add(centre);
      position.setXYZ(index, vertex.x, vertex.y, vertex.z);

      // Faceting round the ring, so a tube stops reading as extruded plastic.
      const shade = along * (0.9 + 0.16 * Math.abs(Math.sin(j * 2.7)));
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
 * a plain sphere lands on tomato. In order of how much each matters: it is
 * fractionally *taller* than it is wide (a tomato is squatter), the base
 * narrows while the shoulders stay full, and the stem well is a deep, narrow
 * pit rather than the broad saucer you get from denting a sphere.
 *
 * The vertex colours are the other half of it. A tomato is one flat saturated
 * red; an apple is deep at the shoulders, warm and yellowish underneath, and
 * faintly striped.
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

    const waist =
      (1 + 0.05 * lat - 0.3 * Math.pow(Math.max(0, -lat), 1.7)) * (1 + 0.016 * Math.cos(theta * 5));
    vertex.x *= waist;
    vertex.z *= waist;
    vertex.y *= 1.07;

    // The high exponent keeps the stem well narrow instead of spreading the
    // dent across the whole top.
    const top = Math.max(0, lat - 0.5) / 0.5;
    vertex.y -= Math.pow(top, 2.4) * 0.46;
    const base = Math.max(0, -lat - 0.68) / 0.32;
    vertex.y += Math.pow(base, 2) * 0.15;

    position.setXYZ(i, vertex.x, vertex.y, vertex.z);

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
    // sin() zeroes the width at both ends; the exponent pushes the widest
    // point past the middle, which is what makes it a leaf and not a lens.
    const taper = Math.sin(Math.PI * Math.pow(along, 0.72));
    const x = vertex.x * taper;
    position.setXYZ(i, x, Math.sin(along * Math.PI) * 0.1 + x * x * 0.55, along);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/** A sphere for the forks, with a flat colour attribute so it can share the
 *  bark material — which needs one, because the branches are vertex-coloured. */
function jointGeometry(quality) {
  const geometry = new SphereGeometry(1, Math.max(6, quality.radial), Math.max(5, quality.radial - 2));
  const count = geometry.attributes.position.count;
  const tint = new Float32Array(count * 3).fill(0.9);
  geometry.setAttribute('color', new Float32BufferAttribute(tint, 3));
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

  const quality = env.smallScreen
    ? { tubular: 8, radial: 6, appleSeg: 18, leaves: 0.5 }
    : { tubular: 12, radial: 9, appleSeg: 28, leaves: 1 };

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearAlpha(0);

  const styles = getComputedStyle(document.documentElement);
  const token = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
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

  // White, because every leaf's real colour is a per-instance value that three
  // multiplies in — see the instance colours below.
  const leafMaterial = new MeshPhongMaterial({ color: 0xffffff, shininess: 18, side: DoubleSide });

  const fruitColor = new Color(token('--apple', '#e4392f'));
  const leafBase = new Color(token('--leaf', '#cdfb45'));

  // Low ambient, hard key: the tree is a silhouette problem before it is a
  // colour one, and a bright fill flattens the branches into cardboard.
  scene.add(new AmbientLight(0xffffff, 0.95));

  const key = new DirectionalLight(0xfff4e8, 3);
  key.position.set(2.4, 4.2, 3.2);
  scene.add(key);

  // Cool rim from the opposite side, tinted with the page's other accent, so
  // the silhouette separates from a near-black background. It orbits with the
  // camera, or turning the tree would walk it into the key light.
  const rim = new DirectionalLight(new Color(token('--plasma', '#7d5cff')), 1.45);
  scene.add(rim);

  /* ---------------------------------------------------------------------- */
  /* Build                                                                   */
  /* ---------------------------------------------------------------------- */

  const rng = mulberry32(SEED);
  const skeleton = growSkeleton(rng);
  const fruitTips = chooseFruit(skeleton.tips, FRUIT_KEYS, rng);

  const disposables = [];

  for (const branch of skeleton.branches) {
    const geometry = branchGeometry(branch, quality);
    disposables.push(geometry);
    grove.add(new Mesh(geometry, barkMaterial));
  }

  // Forks, as one instanced sphere. Nothing about them varies but position and
  // scale, which is exactly what instancing is for.
  const jointGeo = jointGeometry(quality);
  disposables.push(jointGeo);
  const jointMesh = new InstancedMesh(jointGeo, barkMaterial, skeleton.joints.length);
  {
    const dummy = new Object3D();
    skeleton.joints.forEach((joint, index) => {
      dummy.position.copy(joint.at);
      dummy.scale.setScalar(joint.r);
      dummy.updateMatrix();
      jointMesh.setMatrixAt(index, dummy.matrix);
    });
    jointMesh.instanceMatrix.needsUpdate = true;
  }
  grove.add(jointMesh);

  /* --- Foliage ---------------------------------------------------------- */

  const fruitAt = fruitTips.map(({ at }) => new Vector3(at.x, at.y - HANG, at.z));

  /**
   * Every leaf on the tree in one draw call, scattered through the volume
   * around each outer branch rather than onto its surface — on the surface
   * they read as a garland wound round a stick, and it is the spread that
   * makes a canopy.
   *
   * The only thing culled is foliage that would grow *through* an apple. There
   * used to be a corridor cut in front of each one so it could never be
   * covered; that has gone, because being tucked in the leaves is now the
   * point.
   */
  function growLeaves() {
    const outer = skeleton.branches.filter((b) => b.depth >= 2 && b.tag === 'crown');
    if (!outer.length) return null;

    const perBranch = Math.round(46 * quality.leaves);
    const geometry = leafGeometry();
    disposables.push(geometry);

    const mesh = new InstancedMesh(geometry, leafMaterial, outer.length * perBranch);
    const dummy = new Object3D();
    const point = new Vector3();
    const aim = new Vector3();
    const tip = new Vector3();
    const colour = new Color();
    // Big enough to hold the apple, the 18% it grows to on hover, and a whole
    // leaf's length. Testing both ends of a leaf isn't sufficient — a blade can
    // pass clean through a sphere with both ends outside it — so the radius
    // does the work instead, and the bubble it clears doubles as the thing
    // that makes an apple recognisable once you have turned it into view.
    const clearance = (APPLE_R * 1.2 + 0.13) ** 2;
    const blocked = (p) => fruitAt.some((f) => p.distanceToSquared(f) < clearance);
    let index = 0;

    for (const branch of outer) {
      const curve = new CatmullRomCurve3(branch.points);
      // Outermost growth carries the most leaf, so the crown is dense at its
      // edge and open enough near the trunk to see the structure.
      const spread = 0.2 + branch.depth * 0.075;

      for (let i = 0; i < perBranch; i += 1) {
        curve.getPointAt(Math.min(1, (i + rng()) / perBranch), point);

        // Into the volume around the branch, not onto its surface. The cube
        // root keeps the distribution even through that volume rather than
        // piling up at the rim.
        aim.set(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1);
        if (aim.lengthSq() < 1e-6) aim.set(0, 1, 0);
        aim.normalize();
        aim.y -= 0.35; // the crown hangs rather than bristling
        aim.normalize();
        point.addScaledVector(aim, spread * Math.cbrt(rng()));

        const size = 0.042 + Math.pow(rng(), 0.9) * 0.062;
        // lookAt below puts +Z along `aim`, and the blade grows along +Z, so
        // this is where its tip lands.
        tip.copy(point).addScaledVector(aim, size);
        if (blocked(point) || blocked(tip)) continue;

        dummy.position.copy(point);
        // Object3D.lookAt aims +Z *away* from its target, so the target is the
        // point behind the leaf rather than in front of it.
        dummy.lookAt(point.x - aim.x, point.y - aim.y, point.z - aim.z);
        dummy.rotateZ(rng() * Math.PI * 2);
        dummy.scale.set(size * 0.66, size, size);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);

        // Deep, desaturated green with a wide spread of brightness. The acid
        // token is a UI accent — used literally for thousands of leaves it
        // turns the hero into a highlighter.
        colour.copy(leafBase).multiplyScalar(0.06 + Math.pow(rng(), 1.7) * 0.3);
        colour.offsetHSL(0.05 + rng() * 0.055, -0.3, 0);
        mesh.setColorAt(index, colour);
        index += 1;
      }
    }

    // The allocation was an upper bound; rejected leaves leave unused slots at
    // the end, and drawing those renders a pile of leaves at the origin.
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
    {
      points: [new Vector3(0, 0.56, 0), new Vector3(0.06, 1.05, 0.02), new Vector3(0.16, 1.52, 0.06)],
      r0: 0.048,
      r1: 0.026,
      depth: 1,
    },
    { tubular: 10, radial: 5 }
  );
  const appleLeafGeometry = leafGeometry();
  disposables.push(bodyGeometry, stemGeometry, appleLeafGeometry);

  const appleLeafMaterial = new MeshPhongMaterial({
    color: new Color(leafBase).multiplyScalar(0.34).offsetHSL(0.05, -0.1, 0),
    shininess: 22,
    side: DoubleSide,
  });
  disposables.push(appleLeafMaterial);

  /**
   * One apple. The pivot sits at the branch tip and the fruit hangs below it,
   * so a swing rotates around the stem — which is where a real one pivots, and
   * the reason this is two nested groups rather than one.
   */
  function plant({ key: name, at }, index) {
    const pivot = new Group();
    pivot.position.copy(at);
    grove.add(pivot);

    const fruit = new Group();
    fruit.position.y = -HANG;

    // Each apple owns its material so hover and selection can light one up
    // without the other six glowing in sympathy — and so no two are exactly
    // the same red, which is most of what stops seven reading as props.
    const material = new MeshPhongMaterial({
      color: new Color(fruitColor).offsetHSL(((index % 3) - 1) * 0.008, 0, ((index % 2) - 0.5) * 0.03),
      shininess: 190,
      specular: new Color(0x4a2b28),
      emissive: new Color(fruitColor),
      emissiveIntensity: 0,
      vertexColors: true,
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

    const leaf = new Mesh(appleLeafGeometry, appleLeafMaterial);
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
      /** Its own radius, which is what resize() has to keep on the canvas. */
      scale,
      /** Which way this apple faces, for the "is it on the far side" test. */
      bearing: Math.atan2(at.x, at.z),
      hovered: false,
      chosen: false,
      phase: rng() * Math.PI * 2,
      world: new Vector3(),
      screen: new Vector3(),
      placedX: NaN,
      placedY: NaN,
      placedReveal: NaN,
      reveal: 1,
    };
  }

  const apples = fruitTips.map(plant);
  const byName = new Map(apples.map((apple) => [apple.name, apple]));

  // One apple is already open by the time this mounts — js/modules/tree.js
  // picks the first (or whichever the URL asked for) on the critical path.
  apples.forEach((apple) => {
    apple.chosen = apple.name === tree.picked;
    apple.material.emissiveIntensity = apple.chosen ? 0.24 : 0;
  });

  /* ---------------------------------------------------------------------- */
  /* Orbit                                                                   */
  /* ---------------------------------------------------------------------- */
  /*
   * The camera orbits; the tree never turns. Rotating the tree itself would be
   * one line shorter and would tilt the trunk off vertical the moment you
   * looked down at it.
   *
   * Yaw is unbounded — a full turn, and then another. Pitch is clamped: the
   * ground glow behind the canvas is painted at a fixed place in CSS, and past
   * about 40° the tree visibly floats off it.
   *
   * Hidden fruit is the cost of taking the clearing away, and this is how it
   * gets paid for. Every frame each apple gets a `reveal` from how far its
   * bearing is from the camera's, and js/modules/tree.js fades and disables
   * the buttons that are round the back — so nothing invisible is clickable,
   * and no button lies about where it is. Keyboard is the case that would
   * otherwise break, and it is handled the other way round: focusing an apple
   * that has turned away spins the tree until it faces you.
   */
  const PITCH_MIN = -0.34;
  const PITCH_MAX = 0.62;
  /** A slow drift so the tree reads as turnable without anyone touching it. */
  const IDLE_SPIN = 0.055;

  const orbit = { yaw: 0.35, pitch: 0.14 };
  let yawVelocity = 0;
  let pitchVelocity = 0;
  let dragging = false;
  let pointerId = null;
  let lastX = 0;
  let lastY = 0;
  let lastInput = 0;
  let dragDistance = 0;
  /**
   * How many apples are currently hovered or focused. The idle spin stops
   * while any of them is, because a target that drifts under the cursor while
   * you are reaching for it is a target you miss — and a slow drift is worse
   * than a fast one, because it looks stationary right up until you click.
   */
  let holding = 0;
  let distance = 6;

  function applyCamera() {
    const cp = Math.cos(orbit.pitch);
    camera.position.set(
      Math.sin(orbit.yaw) * cp * distance,
      centreY + Math.sin(orbit.pitch) * distance,
      Math.cos(orbit.yaw) * cp * distance
    );
    camera.lookAt(0, centreY, 0);
    // Keep the rim opposite the camera rather than fixed in the world.
    rim.position.set(-camera.position.x, camera.position.y * 0.4 + 1, -camera.position.z);
  }

  const onPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    dragging = true;
    pointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    lastInput = performance.now();
    dragDistance = 0;
    root.classList.add('is-turning');
  };

  const onPointerMove = (event) => {
    if (!dragging || event.pointerId !== pointerId) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    lastInput = performance.now();
    dragDistance += Math.abs(dx) + Math.abs(dy);

    // Scaled by canvas width so a drag across the tree turns it about the same
    // amount whatever size the canvas happens to be.
    const k = 5 / Math.max(240, width);
    orbit.yaw -= dx * k;
    orbit.pitch = MathUtils.clamp(orbit.pitch + dy * k * 0.6, PITCH_MIN, PITCH_MAX);
    yawVelocity = -dx * k * 14;
    pitchVelocity = 0;
  };

  const onPointerUp = (event) => {
    if (event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    lastInput = performance.now();
    root.classList.remove('is-turning');
  };

  /**
   * A drag that starts on an apple would otherwise end in a click on it, so
   * every turn of the tree that happened to begin over fruit would also pick
   * it. Capture phase, so this runs before the button's own listener.
   */
  const swallowClick = (event) => {
    if (dragDistance <= 6) return;
    event.stopPropagation();
    event.preventDefault();
  };

  const root = tree.element;
  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('click', swallowClick, true);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  /** Turns the tree until `apple` faces the camera. */
  function bringForward(apple) {
    const target = apple.bearing;
    // Nearest equivalent angle, so it never takes the long way round.
    const turns = Math.round((orbit.yaw - target) / (Math.PI * 2));
    gsap.to(orbit, {
      yaw: target + turns * Math.PI * 2,
      duration: 0.8,
      ease: 'power3.inOut',
      overwrite: true,
    });
    yawVelocity = 0;
    lastInput = performance.now();
  }

  /* ---------------------------------------------------------------------- */
  /* Sizing                                                                  */
  /* ---------------------------------------------------------------------- */

  let width = 0;
  let height = 0;
  const centreY = (skeleton.bounds.maxY + skeleton.bounds.minY) / 2;
  // Measured off the grown tree rather than off constants, so tuning the growth
  // parameters — or moving the fruit onto different tips — can never crop it.
  const sweep = sweepRadius(
    skeleton,
    fruitAt,
    // The largest of the seven, swollen by a hover and swung out by a pluck.
    // One figure for all of them: they differ by a few per cent, and telling
    // them apart would buy back a fraction of one.
    Math.max(...apples.map((apple) => apple.scale)) * HOVER + HANG * Math.sin(PLUCK),
    centreY
  );

  function resize() {
    width = canvas.clientWidth || 1;
    height = canvas.clientHeight || 1;
    camera.aspect = width / height;

    /*
     * Stand back far enough that the sphere the tree sweeps fits inside the
     * narrower of the two half-angles — which on this box, being taller than it
     * is wide, is always the horizontal one.
     *
     * asin, not atan. Dividing by the tangent stands the camera where the tree
     * would exactly fill the frame if it were flat and standing at the trunk;
     * but it is a solid, and it turns, so its outline touches the edge of the
     * view *nearer* the camera than the trunk, where the frame is narrower. The
     * shortfall is only a factor of cos(halfFov) — and it was enough to hang
     * the outermost apple over the side of the canvas, which cuts it in half.
     * Fruit grows on the tips that reach furthest out (see chooseFruit), so it
     * is always the first thing over the edge and the only thing whose being
     * clipped is obvious.
     */
    const halfFov = Math.min(Math.atan(Math.tan(HALF_FOV) * camera.aspect), HALF_FOV);
    distance = sweep / Math.sin(halfFov);

    camera.updateProjectionMatrix();
    applyCamera();
    renderer.setSize(width, height, false); // false: CSS owns the canvas box

    // The buttons' hit area is sized once here rather than per frame: depth
    // varies an apple's on-screen size by a few percent, and chasing that
    // would mean writing a width to seven elements sixty times a second.
    const perspective = height / (2 * Math.tan(HALF_FOV) * distance);
    tree.setAppleSize(APPLE_R * 2.2 * perspective);
  }

  /* ---------------------------------------------------------------------- */
  /* Interaction                                                             */
  /* ---------------------------------------------------------------------- */

  /**
   * One place decides how an apple looks, because hover and selection both
   * want the same two properties and two independent handlers racing over
   * `scale` is how you get an apple stuck at 1.18 forever.
   */
  function paint(apple) {
    const lift = apple.hovered ? HOVER : apple.chosen ? 1.09 : 1;
    const glow = apple.hovered ? 0.34 : apple.chosen ? 0.24 : 0;
    gsap.to(apple.fruit.scale, { x: lift, y: lift, z: lift, duration: 0.5, ease: 'power3.out' });
    gsap.to(apple.material, { emissiveIntensity: glow, duration: 0.5 });
  }

  const unHover = tree.onHover((name, active) => {
    const apple = byName.get(name);
    if (!apple) return;
    apple.hovered = active;
    holding = Math.max(0, holding + (active ? 1 : -1));
    paint(apple);
    // A hidden apple can't be hovered — its button has no pointer events — so
    // this only ever fires from keyboard focus, which is exactly when the tree
    // needs to turn round and show what is focused.
    if (active && apple.reveal < 0.9) bringForward(apple);
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
      { z: PLUCK, x: -0.12 },
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
   * Set once the GPU has been taken away, and never cleared: there is no
   * context to draw in again without rebuilding everything. Without it the
   * IntersectionObserver and the visibility handler below both call `start()`
   * on the way back, and the loop resumes on a dead context — which is not
   * merely wasteful. `project()` keeps writing to the buttons, and the inline
   * `pointer-events: none` it sets for fruit that has turned away survives
   * `endProjection()`, so the SVG tree we just handed back would come with
   * several of its apples silently unclickable.
   */
  let contextLost = false;

  let pixelRatio = renderer.getPixelRatio();
  let sampled = 0;
  let accumulated = 0;
  let mitigations = 0;

  /**
   * Frame-time watchdog, the same two-strikes shape as the particle field's.
   * Strike one drops the pixel ratio, because fill rate goes first; strike two
   * halves the foliage, which is where nearly all the triangles are and the
   * only part that can be cut without the tree stopping being a tree.
   */
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
    apple.fruit.getWorldPosition(apple.world);

    // How far this apple's bearing is from the camera's, as -1..1. Positive is
    // the near side of the trunk; negative is round the back.
    // The visible arc is a little over a hemisphere, which works out at three
    // or four of the seven at any moment — enough that the tree never looks
    // bare, few enough that turning it keeps finding you another one.
    const facing = Math.cos(apple.bearing - orbit.yaw);
    apple.reveal = MathUtils.clamp((facing + 0.1) / 0.4, 0, 1);

    apple.screen.copy(apple.world).project(camera);
    const x = (apple.screen.x * 0.5 + 0.5) * width;
    const y = (-apple.screen.y * 0.5 + 0.5) * height;

    // The canvas doesn't clip its buttons — it can't, or the labels would be
    // cut off — so fruit that has swung out past the edge of the tree's box
    // has to fade rather than drift over the column of text beside it.
    const edge = Math.min(x, width - x, y, height - y);
    apple.reveal = Math.min(apple.reveal, MathUtils.clamp((edge - 6) / 34, 0, 1));

    // Sub-pixel churn isn't visible but does cost a style write per apple per
    // frame, so only move a button when it has actually moved.
    if (
      Math.abs(x - apple.placedX) < 0.25 &&
      Math.abs(y - apple.placedY) < 0.25 &&
      Math.abs(apple.reveal - apple.placedReveal) < 0.01
    ) {
      return;
    }
    apple.placedX = x;
    apple.placedY = y;
    apple.placedReveal = apple.reveal;
    tree.place(apple.name, x, y, apple.screen.z, apple.reveal);
  }

  function frame(timestamp) {
    frameHandle = requestAnimationFrame(frame);

    timer.update(timestamp);
    const elapsed = timer.getElapsed();
    const delta = Math.min(timer.getDelta(), 0.05);

    if (!dragging) {
      // Throw, then settle. Idle spin fades back in once the throw has died
      // down, so the two never fight over the same frame.
      orbit.yaw += yawVelocity * delta;
      yawVelocity *= Math.exp(-delta * 2.4);
      if (!holding && performance.now() - lastInput > 2200) orbit.yaw += IDLE_SPIN * delta;
    }

    // Two slow sines an octave apart: enough to read as wind, never enough to
    // make an apple hard to hit. They share out SWAY rather than carrying their
    // own amplitudes, because resize() frames for the lean and the two must not
    // drift apart.
    grove.rotation.z = (Math.sin(elapsed * 0.42) * 0.6 + Math.sin(elapsed * 0.19) * 0.4) * SWAY;

    for (const apple of apples) {
      apple.pivot.rotation.y = Math.sin(elapsed * 0.5 + apple.phase) * 0.22;
      apple.fruit.position.y = -HANG + Math.sin(elapsed * 0.75 + apple.phase) * 0.012;
    }

    applyCamera();
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
    if (frameHandle || contextLost) return;
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
    contextLost = true;
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
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('click', swallowClick, true);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
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
