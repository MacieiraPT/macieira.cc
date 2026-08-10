/**
 * scene/orchard.js — the tree, in three dimensions.
 *
 * Mounted at idle by js/main.js, only where the browser will give us a second
 * WebGL context. Until then — and forever, if it won't — the inline SVG tree
 * in index.html is what's on screen. This module replaces it; it is never
 * required to produce it.
 *
 * ── Why a second context ──────────────────────────────────────────────────
 * The particle field already owns one, on a fixed full-viewport canvas behind
 * the whole page. The tree can't live there: it has to sit inside a column of
 * the hero and scroll away with it, and mapping a fixed backdrop onto a
 * scrolling element's box means re-deriving that box every frame and fighting
 * the field for the same camera. A second, small (~600 × 680 CSS px), in-flow
 * canvas costs one context and a handful of draw calls, and it stops rendering
 * entirely once it leaves the viewport. That is the cheaper trade.
 *
 * ── Why the fruit is still HTML ───────────────────────────────────────────
 * The apples you *click* are the same <button>s as in the 2D version. This
 * module projects each apple's world position to screen coordinates every
 * frame and hands them to js/modules/tree.js, which moves the buttons to
 * match. Nothing about tab order, Enter, focus rings or screen-reader output
 * changes when the renderer takes over — there is no raycaster here, and no
 * canvas that has to reimplement being a button.
 */

import {
  AmbientLight,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  Group,
  MathUtils,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
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
const FRAME_W = 1.66;
const FRAME_H = 1.4;
const CENTRE_Y = 1.42;

const APPLE_R = 0.135;
/** How far an apple hangs below the branch tip it grows from. */
const HANG = 0.1;

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
 * points, so sharing one is what guarantees the join is seamless — the same
 * rule the SVG fallback follows, for the same reason.
 */
const TRUNK = {
  points: [[0, 0, 0], [0.03, 0.45, 0.02], [-0.02, 0.9, 0.01], [0, 1.3, 0]],
  from: 0.135,
  to: 0.07,
};

/** Limbs that end in fruit. `key` matches the button's data-apple. */
const LIMBS = [
  { key: 'name',    from: 0.065, to: 0.024, points: [[0, 1.2, 0], [0.03, 1.6, 0.06], [0.05, 2, 0.12], [0.05, 2.34, 0.14]] },
  { key: 'work',    from: 0.062, to: 0.023, points: [[0.02, 1.18, 0], [0.34, 1.5, -0.08], [0.68, 1.76, -0.18], [0.93, 1.96, -0.24]] },
  { key: 'stack',   from: 0.062, to: 0.023, points: [[-0.02, 1.18, 0.02], [-0.34, 1.5, 0.09], [-0.68, 1.76, 0.16], [-0.93, 1.96, 0.2]] },
  { key: 'steam',   from: 0.066, to: 0.025, points: [[-0.03, 1, 0], [-0.5, 1.16, -0.1], [-1, 1.28, -0.26], [-1.33, 1.34, -0.36]] },
  { key: 'github',  from: 0.066, to: 0.025, points: [[0.03, 0.98, 0], [0.52, 1.12, 0.1], [1.02, 1.26, 0.22], [1.36, 1.34, 0.3]] },
  { key: 'discord', from: 0.032, to: 0.017, points: [[0.34, 1.5, -0.08], [0.44, 1.36, 0.06], [0.5, 1.22, 0.22], [0.52, 1.12, 0.34]] },
];

/** Bare twigs. No fruit, no job beyond making the crown look grown. */
const TWIGS = [
  { from: 0.026, to: 0.012, points: [[0.05, 2, 0.12], [-0.2, 2.12, 0.04], [-0.48, 2.1, -0.06]] },
  { from: 0.028, to: 0.012, points: [[-1, 1.28, -0.26], [-1.12, 1.5, -0.22], [-1.18, 1.72, -0.16]] },
  { from: 0.028, to: 0.012, points: [[1.02, 1.26, 0.22], [1.16, 1.48, 0.16], [1.22, 1.7, 0.1]] },
  { from: 0.026, to: 0.012, points: [[-0.68, 1.76, 0.16], [-0.74, 1.92, 0.02], [-0.72, 2.08, -0.12]] },
  { from: 0.026, to: 0.012, points: [[0.68, 1.76, -0.18], [0.78, 1.94, -0.04], [0.8, 2.1, 0.08]] },
  { from: 0.024, to: 0.011, points: [[-0.5, 1.16, -0.1], [-0.56, 1, -0.02], [-0.58, 0.86, 0.08]] },
  { from: 0.024, to: 0.011, points: [[0.52, 1.12, 0.1], [0.6, 0.98, -0.04], [0.64, 0.84, -0.14]] },
  { from: 0.022, to: 0.01,  points: [[0.03, 1.6, 0.06], [0.26, 1.72, 0.2], [0.44, 1.78, 0.3]] },
  { from: 0.022, to: 0.01,  points: [[0.03, 1.6, 0.06], [-0.2, 1.74, -0.1], [-0.38, 1.82, -0.2]] },
  { from: 0.02,  to: 0.009, points: [[-0.34, 1.5, 0.09], [-0.42, 1.66, 0.24], [-0.46, 1.8, 0.36]] },
  { from: 0.02,  to: 0.009, points: [[0.68, 1.76, -0.18], [0.9, 1.8, -0.3], [1.06, 1.8, -0.4]] },
  { from: 0.02,  to: 0.009, points: [[-0.68, 1.76, 0.16], [-0.9, 1.8, 0.28], [-1.06, 1.8, 0.38]] },
];

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
function branchGeometry({ points, from, to }, quality) {
  const curve = curveOf(points);
  const tubular = Math.max(8, Math.round(points.length * quality.tubular));
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

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A unit sphere pushed into an apple: squashed a little, and dimpled at both
 * poles. The dimples are what stop it reading as "a red ball" — the top one
 * seats the stem, the bottom one is the calyx.
 */
function appleGeometry(quality) {
  const geometry = new SphereGeometry(1, quality.appleSeg, Math.round(quality.appleSeg * 0.7));
  const position = geometry.attributes.position;
  const vertex = new Vector3();

  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i);
    const lat = vertex.y; // -1..1 on the unit sphere
    vertex.y *= 0.95;
    // Ramps from 0 at |lat| = 0.55 to 1 at the poles, squared so the dip is
    // smooth where it meets the shoulder rather than creased.
    const pole = Math.max(0, Math.abs(lat) - 0.55) / 0.45;
    vertex.y -= Math.sign(lat) * pole * pole * 0.19;
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
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
    return null; // the SVG tree stays; nothing to clean up
  }

  // Small canvas, hard edges, no fill-rate problem — so unlike the particle
  // field this one can afford MSAA and a real pixel ratio.
  const quality = env.smallScreen
    ? { tubular: 10, radial: 6, appleSeg: 14 }
    : { tubular: 14, radial: 9, appleSeg: 22 };

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

  // Knocked well below the token: --bark is picked to read on a dark page as
  // a flat SVG stroke, and a lit mesh of the same value comes out looking like
  // pale plastic. The light puts the value back.
  const barkMaterial = new MeshPhongMaterial({
    color: new Color(token('--bark', '#8b7b69')).multiplyScalar(0.62),
    shininess: 2,
  });
  const leafMaterial = new MeshPhongMaterial({
    // The leaf on the fruit, not foliage: the crown is deliberately bare, so
    // the only green in the mesh is the one that echoes the logo.
    color: new Color(token('--leaf', '#cdfb45')).multiplyScalar(0.62),
    shininess: 26,
  });
  const fruitColor = new Color(token('--apple', '#e4392f'));

  // Low ambient, hard key: the tree is a silhouette problem before it is a
  // colour one, and a bright fill flattens the branches into cardboard.
  scene.add(new AmbientLight(0xffffff, 0.85));

  const key = new DirectionalLight(0xffffff, 3.4);
  key.position.set(2.4, 4.2, 3.2);
  scene.add(key);

  // Cool rim from the opposite side, tinted with the page's other accent, so
  // the silhouette separates from a near-black background.
  const rim = new DirectionalLight(new Color(token('--plasma', '#7d5cff')), 1.9);
  rim.position.set(-3.4, 1.6, -2.4);
  scene.add(rim);

  /* ---------------------------------------------------------------------- */
  /* Build                                                                   */
  /* ---------------------------------------------------------------------- */

  const disposables = [];

  const addBranch = (spec) => {
    const geometry = branchGeometry(spec, quality);
    disposables.push(geometry);
    grove.add(new Mesh(geometry, barkMaterial));
  };

  addBranch(TRUNK);
  LIMBS.forEach(addBranch);
  TWIGS.forEach(addBranch);

  const bodyGeometry = appleGeometry(quality);
  const stemGeometry = branchGeometry(
    { points: [[0, 0.82, 0], [0.06, 1.15, 0.02], [0.16, 1.42, 0.04]], from: 0.07, to: 0.045 },
    { tubular: 8, radial: 5 }
  );
  const leafGeometry = new SphereGeometry(1, 9, 6);
  disposables.push(bodyGeometry, stemGeometry, leafGeometry);

  /**
   * One apple. The pivot sits at the branch tip and the fruit hangs below it,
   * so a swing rotates around the stem — which is where a real one pivots,
   * and the reason this is two nested groups rather than one.
   */
  function plant({ key: name, points }) {
    const tip = new Vector3(...points.at(-1));

    const pivot = new Group();
    pivot.position.copy(tip);
    grove.add(pivot);

    const fruit = new Group();
    fruit.position.y = -HANG;
    // Each apple owns its material so hover and selection can light one up
    // without the other five glowing in sympathy. Six materials is nothing.
    const material = new MeshPhongMaterial({
      color: fruitColor,
      shininess: 82,
      specular: new Color(0x87554f),
      emissive: new Color(fruitColor),
      emissiveIntensity: 0,
    });
    disposables.push(material);

    const body = new Mesh(bodyGeometry, material);
    body.scale.setScalar(APPLE_R);
    fruit.add(body);

    const stem = new Mesh(stemGeometry, barkMaterial);
    stem.scale.setScalar(APPLE_R);
    fruit.add(stem);

    const leaf = new Mesh(leafGeometry, leafMaterial);
    leaf.scale.set(APPLE_R * 0.34, APPLE_R * 0.07, APPLE_R * 0.62);
    leaf.position.set(APPLE_R * 0.55, APPLE_R * 1.35, APPLE_R * 0.06);
    leaf.rotation.set(0, -0.35, 0.42);
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

  // One apple is already open by the time this mounts — js/modules/tree.js
  // picks the first (or whichever the URL asked for) on the critical path.
  // Applied straight to the material rather than tweened: there is nothing to
  // animate away from, and the intro below reads the flag for its end scale.
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
    invalidate();
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
    // that would mean writing a width to six elements every frame — layout
    // work, sixty times a second, for something nobody can see.
    const perspective = height / (2 * Math.tan(MathUtils.degToRad(FOV) / 2) * camera.position.z);
    tree.setAppleSize(APPLE_R * 2.1 * perspective);
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
   * `scale` is how you get an apple stuck at 1.16 forever.
   */
  function render(apple) {
    const lift = apple.hovered ? 1.17 : apple.chosen ? 1.09 : 1;
    const glow = apple.hovered ? 0.34 : apple.chosen ? 0.24 : 0;
    gsap.to(apple.fruit.scale, { x: lift, y: lift, z: lift, duration: 0.5, ease: 'power3.out' });
    gsap.to(apple.material, { emissiveIntensity: glow, duration: 0.5 });
    invalidate(900);
  }

  /** Hover and keyboard focus are the same thing here: attention on one apple. */
  const unHover = tree.onHover((name, active) => {
    const apple = byName.get(name);
    if (!apple) return;
    apple.hovered = active;
    render(apple);
  });

  const unPick = tree.onPick((name) => {
    apples.forEach((apple) => {
      apple.chosen = apple.name === name;
      render(apple);
    });

    const apple = byName.get(name);
    if (!apple || env.reducedMotion) return;

    // The pluck. Rotating the pivot swings the fruit on its stem; elastic.out
    // is it settling back onto the branch.
    gsap.fromTo(
      apple.pivot.rotation,
      { z: 0.34, x: -0.12 },
      { z: 0, x: 0, duration: 1.5, ease: 'elastic.out(1, 0.32)', overwrite: true }
    );
    invalidate(1800);
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
   * With reduced motion nothing moves on its own, so drawing sixty identical
   * frames a second is pure heat. Interactions still animate, so instead of
   * stopping the loop this keeps a deadline: anything that starts a tween
   * pushes it forward, and frames outside it skip the draw.
   */
  let renderUntil = 0;
  const invalidate = (ms = 1800) => {
    renderUntil = Math.max(renderUntil, performance.now() + ms);
  };

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

    if (env.reducedMotion) {
      // Parallax is motion too. The tree simply sits still and faces forward.
      if (performance.now() > renderUntil && !firstFrame) return;
    } else {
      pointerEased.lerp(pointer, Math.min(1, delta * 3));
      grove.rotation.y = pointerEased.x * 0.26;
      grove.rotation.x = -pointerEased.y * 0.06;

      // Two slow sines an octave apart: enough to read as wind, never enough
      // to make the labels underneath the fruit hard to hit.
      grove.rotation.z = Math.sin(elapsed * 0.42) * 0.014 + Math.sin(elapsed * 0.19) * 0.01;

      for (const apple of apples) {
        apple.pivot.rotation.y = Math.sin(elapsed * 0.5 + apple.phase) * 0.22;
        apple.fruit.position.y = -HANG + Math.sin(elapsed * 0.75 + apple.phase) * 0.012;
      }
    }

    grove.updateMatrixWorld();
    for (const apple of apples) project(apple);

    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      canvas.classList.add('is-live');
      tree.beginProjection();
      intro();
    }
  }

  /** Fruit ripens onto a tree that is already standing. */
  function intro() {
    apples.forEach((apple, index) => {
      // Ends where render() would have put it, so the apple that starts picked
      // doesn't grow to full size and then quietly step up again.
      const lift = apple.chosen ? 1.09 : 1;
      if (env.reducedMotion) {
        apple.fruit.scale.setScalar(lift);
        return;
      }
      gsap.fromTo(
        apple.fruit.scale,
        { x: 0.01, y: 0.01, z: 0.01 },
        { x: lift, y: lift, z: lift, duration: 0.9, delay: 0.08 * index, ease: 'back.out(2)' }
      );
    });
    invalidate(2200);
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
