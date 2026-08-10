/**
 * particles.js — builds the point cloud and its three position sets.
 *
 * Everything expensive happens exactly once, here, at mount:
 *   - drift  : a soft Gaussian haze with no silhouette of its own
 *   - wave   : a wide, shallow field with a rolling surface
 *   - shape  : the apple, sampled from vector paths via a 2D canvas
 *
 * After this the CPU's only job per frame is to write a handful of uniforms.
 */

import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
  Vector2,
} from 'three';

import { APPLE_VIEWBOX } from '../data/apple.js';
import { fragmentShader, vertexShader } from './shaders.js';

/** World-space size the sampled shape is scaled to fill. */
const SHAPE_SPAN = 9.5;

/**
 * Samples SVG path data into 2D points by rasterising it to an offscreen
 * canvas and keeping the opaque pixels.
 *
 * Paths rather than a character, which is what the field used to resolve
 * into: the mark is an apple now, and an apple is not in any font. It is also
 * strictly better here — a Path2D fill is deterministic, so this no longer
 * depends on a webfont having loaded before the scene mounts.
 *
 * The result is normalised against the *ink's* bounding box rather than the
 * viewBox, so the apple ends up centred and filling the span no matter how
 * much empty margin the artwork happens to carry.
 *
 * @param {string[]} paths  SVG path data, all drawn in the same box
 * @param {number} viewBox  side of that box, in the paths' own units
 * @returns {Array<[number, number]>} coordinates in -0.5..0.5
 */
function samplePaths(paths, viewBox) {
  if (typeof Path2D !== 'function') return [];

  const size = 400;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  const scale = size / viewBox;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = '#fff';
  for (const data of paths) ctx.fill(new Path2D(data));

  const { data } = ctx.getImageData(0, 0, size, size);
  const hits = [];
  let minX = size;
  let maxX = 0;
  let minY = size;
  let maxY = 0;

  // Step 2px: sampling every pixel costs 4× the work for points that are
  // going to be randomly re-sampled anyway.
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      if (data[(y * size + x) * 4 + 3] > 128) {
        hits.push([x, y]);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hits.length) return [];

  // One scale for both axes, so the apple keeps its proportions.
  const extent = Math.max(maxX - minX, maxY - minY) || 1;
  const centreX = (minX + maxX) / 2;
  const centreY = (minY + maxY) / 2;

  // Y is flipped on the way out: canvas counts downwards, the world doesn't.
  return hits.map(([x, y]) => [(x - centreX) / extent, (centreY - y) / extent]);
}

/**
 * One sample from an approximately normal distribution.
 *
 * Three uniforms summed is the cheap standard trick, and *why* it is used here
 * matters: phase 0 used to be a Fibonacci sphere, which is a beautiful even
 * distribution and therefore has a hard edge — behind a tree it read as a
 * green circle drawn on the page. A Gaussian has no edge at all. Density just
 * thins until it stops, so the field sits behind the hero as haze rather than
 * as a shape competing with the one that is meant to be there.
 */
function gaussian() {
  return (Math.random() + Math.random() + Math.random() - 1.5) * 2;
}

/**
 * @param {object} options
 * @param {number} options.count      how many points to build
 * @param {string[]} options.shape    SVG paths the field resolves into
 * @param {string} options.colorA     CSS colour for the "play" end of the gradient
 * @param {string} options.colorB     CSS colour for the "build" end
 * @param {number} options.pixelRatio capped device pixel ratio
 */
export function createParticleField({ count, shape, colorA, colorB, pixelRatio }) {
  const shapePoints = samplePaths(shape, APPLE_VIEWBOX);

  const orb = new Float32Array(count * 3);
  const wave = new Float32Array(count * 3);
  const mark = new Float32Array(count * 3);
  const random = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;

    // --- drift: a wide, edgeless haze ----------------------------------
    const ox = gaussian() * 2.5;
    const oy = gaussian() * 2;
    const oz = gaussian() * 1.8;
    orb[i3] = ox;
    orb[i3 + 1] = oy;
    orb[i3 + 2] = oz;

    // --- wave: a wide shallow field, rolling along X --------------------
    const wx = (Math.random() - 0.5) * 15;
    const wz = (Math.random() - 0.5) * 7;
    wave[i3] = wx;
    wave[i3 + 1] = Math.sin(wx * 0.45) * 0.9 + Math.cos(wz * 0.6) * 0.6 + (Math.random() - 0.5) * 0.7;
    wave[i3 + 2] = wz;

    // --- shape: a sampled pixel, jittered so edges don't look aliased ----
    if (shapePoints.length) {
      const [gx, gy] = shapePoints[(Math.random() * shapePoints.length) | 0];
      mark[i3] = gx * SHAPE_SPAN + (Math.random() - 0.5) * 0.07;
      mark[i3 + 1] = gy * SHAPE_SPAN + (Math.random() - 0.5) * 0.07;
      mark[i3 + 2] = (Math.random() - 0.5) * 0.6;
    } else {
      // No Path2D, or no 2D context: fall back to the orb so the morph is a
      // no-op instead of collapsing every point into the origin.
      mark[i3] = ox;
      mark[i3 + 1] = oy;
      mark[i3 + 2] = oz;
    }

    random[i] = Math.random();
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(orb, 3));
  geometry.setAttribute('aWave', new Float32BufferAttribute(wave, 3));
  geometry.setAttribute('aShape', new Float32BufferAttribute(mark, 3));
  geometry.setAttribute('aRand', new Float32BufferAttribute(random, 1));
  // The field never leaves this volume, so a hand-set sphere saves three.js
  // from computing one over every attribute.
  geometry.boundingSphere = null;
  geometry.computeBoundingSphere();

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uPhase: { value: 0 },
      uSize: { value: 2.6 },
      uPixelRatio: { value: pixelRatio },
      uBurst: { value: 0 },
      uOpacity: { value: 1 },
      uMouse: { value: new Vector2(999, 999) }, // offscreen until the pointer moves
      uColorA: { value: new Color(colorA) },
      uColorB: { value: new Color(colorB) },
    },
    transparent: true,
    depthWrite: false,        // additive points must not occlude each other
    blending: AdditiveBlending,
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false; // it fills the view and the shader moves it anyway

  return { points, geometry, material, shapeSampled: shapePoints.length > 0 };
}
