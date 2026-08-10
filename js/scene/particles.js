/**
 * particles.js — builds the point cloud and its three position sets.
 *
 * Everything expensive happens exactly once, here, at mount:
 *   - orb    : a Fibonacci sphere (even distribution, no polar clumping)
 *   - wave   : a wide, shallow field with a rolling surface
 *   - glyph  : the letterform, sampled from a 2D canvas
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

import { fragmentShader, vertexShader } from './shaders.js';

/** World-space width the glyph is scaled to fill. */
const GLYPH_SPAN = 9.5;

/**
 * Samples a character into 2D points by rasterising it to an offscreen canvas
 * and keeping the opaque pixels.
 *
 * This is why the scene waits for `document.fonts.ready`: rasterising before
 * Archivo has loaded would sample the fallback face and the field would spell
 * the letter in the wrong shape.
 *
 * @returns {Array<[number, number]>} normalised coordinates in -0.5..0.5
 */
function sampleGlyph(character, { fontFamily = 'Archivo', weight = 800 } = {}) {
  const size = 400;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${weight} ${Math.round(size * 0.8)}px "${fontFamily}", sans-serif`;
  ctx.fillText(character, size / 2, size / 2 + size * 0.02);

  const { data } = ctx.getImageData(0, 0, size, size);
  const hits = [];

  // Step 2px: sampling every pixel costs 4× the work for points that are
  // going to be randomly re-sampled anyway.
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      if (data[(y * size + x) * 4 + 3] > 128) {
        hits.push([x / size - 0.5, 0.5 - y / size]); // flip Y into world orientation
      }
    }
  }

  return hits;
}

/** Deterministic-ish even distribution over a sphere. */
function orbPosition(index, count, radius) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (index / (count - 1)) * 2;
  const ring = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = golden * index;
  return [Math.cos(theta) * ring * radius, y * radius, Math.sin(theta) * ring * radius];
}

/**
 * @param {object} options
 * @param {number} options.count      how many points to build
 * @param {string} options.glyph      character the field resolves into
 * @param {string} options.colorA     CSS colour for the "play" end of the gradient
 * @param {string} options.colorB     CSS colour for the "build" end
 * @param {number} options.pixelRatio capped device pixel ratio
 */
export function createParticleField({ count, glyph, colorA, colorB, pixelRatio }) {
  const glyphPoints = sampleGlyph(glyph);

  const orb = new Float32Array(count * 3);
  const wave = new Float32Array(count * 3);
  const letter = new Float32Array(count * 3);
  const random = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;

    // --- orb: a sphere with a slightly soft shell -----------------------
    const [ox, oy, oz] = orbPosition(i, count, 3.15 + Math.random() * 0.35);
    orb[i3] = ox;
    orb[i3 + 1] = oy;
    orb[i3 + 2] = oz;

    // --- wave: a wide shallow field, rolling along X --------------------
    const wx = (Math.random() - 0.5) * 15;
    const wz = (Math.random() - 0.5) * 7;
    wave[i3] = wx;
    wave[i3 + 1] = Math.sin(wx * 0.45) * 0.9 + Math.cos(wz * 0.6) * 0.6 + (Math.random() - 0.5) * 0.7;
    wave[i3 + 2] = wz;

    // --- glyph: a sampled pixel, jittered so edges don't look aliased ----
    if (glyphPoints.length) {
      const [gx, gy] = glyphPoints[(Math.random() * glyphPoints.length) | 0];
      letter[i3] = gx * GLYPH_SPAN + (Math.random() - 0.5) * 0.07;
      letter[i3 + 1] = gy * GLYPH_SPAN + (Math.random() - 0.5) * 0.07;
      letter[i3 + 2] = (Math.random() - 0.5) * 0.6;
    } else {
      // Font never arrived: fall back to the orb so the morph is a no-op
      // instead of collapsing every point into the origin.
      letter[i3] = ox;
      letter[i3 + 1] = oy;
      letter[i3 + 2] = oz;
    }

    random[i] = Math.random();
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(orb, 3));
  geometry.setAttribute('aWave', new Float32BufferAttribute(wave, 3));
  geometry.setAttribute('aGlyph', new Float32BufferAttribute(letter, 3));
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

  return { points, geometry, material, glyphSampled: glyphPoints.length > 0 };
}
