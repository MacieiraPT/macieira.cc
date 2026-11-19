export type PixelMode = '16bit' | '8bit';

interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint16Array;
  doubleSided?: boolean;
}

interface GpuMesh {
  posBuf: WebGLBuffer;
  normBuf: WebGLBuffer;
  idxBuf: WebGLBuffer;
  indexCount: number;
  doubleSided: boolean;
}

export interface RetroAppleRenderer {
  readonly triangleCount: number;
  setMode(mode: PixelMode): void;
  setPalette(paletteId: number): void;
  setSnapEnabled(enabled: boolean): void;
  resize(side: number): void;
  render(rotX: number, rotY: number, rotZ: number, bobY: number): void;
  dispose(): void;
}

export const RETRO_VERTEX_SHADER = /* glsl */ `
  attribute vec3 position;
  attribute vec3 normal;

  uniform mat4 uModel;
  uniform mat4 uViewProj;
  uniform mat3 uNormalMatrix;
  uniform float uSnapGrid;
  uniform float uSnapEnabled;

  varying vec3 vNormalWorld;
  varying vec3 vWorldPos;

  void main() {
    vec4 worldPosition = uModel * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    vNormalWorld = normalize(uNormalMatrix * normal);

    vec4 clipPos = uViewProj * worldPosition;
    if (uSnapEnabled > 0.5 && uSnapGrid > 0.0) {
      vec4 snapped = clipPos;
      snapped.xyz = clipPos.xyz / clipPos.w;
      snapped.x = floor(uSnapGrid * snapped.x + 0.5) / uSnapGrid;
      snapped.y = floor(uSnapGrid * snapped.y + 0.5) / uSnapGrid;
      snapped.xyz *= clipPos.w;
      gl_Position = snapped;
    } else {
      gl_Position = clipPos;
    }
  }
`;

export const RETRO_FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;

  uniform vec3 uCameraPos;
  uniform float uMatId;
  uniform float uSteps;
  uniform float uPaletteId;

  varying vec3 vNormalWorld;
  varying vec3 vWorldPos;

  float bayer4x4(vec2 coord) {
    int x = int(mod(coord.x, 4.0));
    int y = int(mod(coord.y, 4.0));
    int idx = y * 4 + x;

    if (idx == 0)  return 0.0 / 16.0;
    if (idx == 1)  return 8.0 / 16.0;
    if (idx == 2)  return 2.0 / 16.0;
    if (idx == 3)  return 10.0 / 16.0;
    if (idx == 4)  return 12.0 / 16.0;
    if (idx == 5)  return 4.0 / 16.0;
    if (idx == 6)  return 14.0 / 16.0;
    if (idx == 7)  return 6.0 / 16.0;
    if (idx == 8)  return 3.0 / 16.0;
    if (idx == 9)  return 11.0 / 16.0;
    if (idx == 10) return 1.0 / 16.0;
    if (idx == 11) return 9.0 / 16.0;
    if (idx == 12) return 15.0 / 16.0;
    if (idx == 13) return 7.0 / 16.0;
    if (idx == 14) return 13.0 / 16.0;
    return 5.0 / 16.0;
  }

  vec3 fruitPalette(float t, float pid) {
    if (pid < 0.5) {
      // 0: Acid Orchard (crimson fruit + warm coral highlight)
      if (t < 0.25) return vec3(0.165, 0.039, 0.047);
      if (t < 0.50) return vec3(0.451, 0.086, 0.075);
      if (t < 0.75) return vec3(0.588, 0.125, 0.102);
      if (t < 0.94) return vec3(0.894, 0.224, 0.184);
      return vec3(1.000, 0.541, 0.431);
    }
    if (pid < 1.5) {
      // 1: Game Boy DMG 4-shade olive LCD
      if (t < 0.28) return vec3(0.059, 0.220, 0.059);
      if (t < 0.55) return vec3(0.188, 0.384, 0.188);
      if (t < 0.84) return vec3(0.545, 0.675, 0.059);
      return vec3(0.792, 0.863, 0.624);
    }
    if (pid < 2.5) {
      // 2: Amber CRT phosphor glow
      if (t < 0.25) return vec3(0.180, 0.067, 0.012);
      if (t < 0.50) return vec3(0.478, 0.176, 0.024);
      if (t < 0.78) return vec3(0.831, 0.420, 0.035);
      if (t < 0.94) return vec3(1.000, 0.690, 0.000);
      return vec3(1.000, 0.878, 0.580);
    }
    // 3: Classic 1-Bit Mac monochrome bitmap ink & paper
    if (t < 0.26) return vec3(0.063, 0.063, 0.078);
    if (t < 0.56) return vec3(0.240, 0.240, 0.275);
    if (t < 0.84) return vec3(0.740, 0.729, 0.698);
    return vec3(0.950, 0.945, 0.925);
  }

  vec3 barkPalette(float t, float pid) {
    if (pid < 0.5) {
      if (t < 0.33) return vec3(0.145, 0.114, 0.090);
      if (t < 0.66) return vec3(0.329, 0.275, 0.227);
      if (t < 0.90) return vec3(0.545, 0.482, 0.412);
      return vec3(0.761, 0.698, 0.616);
    }
    if (pid < 1.5) {
      if (t < 0.40) return vec3(0.059, 0.220, 0.059);
      if (t < 0.80) return vec3(0.188, 0.384, 0.188);
      return vec3(0.545, 0.675, 0.059);
    }
    if (pid < 2.5) {
      if (t < 0.35) return vec3(0.180, 0.067, 0.012);
      if (t < 0.75) return vec3(0.549, 0.310, 0.110);
      return vec3(0.831, 0.490, 0.120);
    }
    if (t < 0.45) return vec3(0.063, 0.063, 0.078);
    if (t < 0.80) return vec3(0.360, 0.318, 0.270);
    return vec3(0.650, 0.620, 0.580);
  }

  vec3 leafPalette(float t, float pid) {
    if (pid < 0.5) {
      // Deep olive shadow -> grass green -> brand acid lime #cdfb45
      if (t < 0.30) return vec3(0.125, 0.204, 0.039);
      if (t < 0.62) return vec3(0.341, 0.529, 0.075);
      if (t < 0.88) return vec3(0.608, 0.855, 0.157);
      return vec3(0.804, 0.984, 0.271);
    }
    if (pid < 1.5) {
      if (t < 0.35) return vec3(0.188, 0.384, 0.188);
      if (t < 0.72) return vec3(0.608, 0.737, 0.059);
      return vec3(0.792, 0.863, 0.624);
    }
    if (pid < 2.5) {
      if (t < 0.35) return vec3(0.478, 0.220, 0.024);
      if (t < 0.72) return vec3(1.000, 0.690, 0.000);
      return vec3(1.000, 0.878, 0.580);
    }
    if (t < 0.45) return vec3(0.063, 0.063, 0.078);
    if (t < 0.80) return vec3(0.240, 0.240, 0.275);
    return vec3(0.788, 0.141, 0.118);
  }

  void main() {
    vec3 N = normalize(vNormalWorld);
    if (uMatId > 1.5 && !gl_FrontFacing) {
      N = -N;
    }

    vec3 V = normalize(uCameraPos - vWorldPos);
    vec3 keyDir = normalize(vec3(0.62, 0.84, 0.72));
    vec3 fillDir = normalize(vec3(-0.65, -0.45, 0.25));

    float diff = max(dot(N, keyDir), 0.0);
    float fill = max(dot(N, fillDir), 0.0) * 0.25;

    vec3 halfVec = normalize(keyDir + V);
    float specPower = uMatId < 0.5 ? 28.0 : 14.0;
    float specStrength = uMatId < 0.5 ? 0.55 : (uMatId > 1.5 ? 0.22 : 0.06);
    float spec = pow(max(dot(N, halfVec), 0.0), specPower) * specStrength;

    float rim = pow(1.0 - max(dot(N, V), 0.0), 2.5) * 0.28;

    float lum = clamp(0.14 + diff * 0.72 + fill + spec + rim, 0.0, 1.0);

    float bayer = bayer4x4(floor(gl_FragCoord.xy));
    float spread = 0.92 / max(uSteps, 2.0);
    float dithered = clamp(lum + (bayer - 0.46875) * spread, 0.0, 1.0);
    float quantized = clamp(floor(dithered * uSteps + 0.5) / uSteps, 0.0, 1.0);

    vec3 color;
    if (uMatId < 0.5) {
      color = fruitPalette(quantized, uPaletteId);
    } else if (uMatId < 1.5) {
      color = barkPalette(quantized, uPaletteId);
    } else {
      color = leafPalette(quantized, uPaletteId);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

export const BLIT_VERTEX_SHADER = /* glsl */ `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const BLIT_FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;

  uniform sampler2D tDiffuse;
  uniform vec2 uTexelSize;
  uniform vec3 uOutline;

  varying vec2 vUv;

  void main() {
    vec4 center = texture2D(tDiffuse, vUv);
    if (center.a > 0.5) {
      gl_FragColor = vec4(center.rgb, 1.0);
      return;
    }

    // Crisp 1px pixel-art border around silhouette in low-res pixel space
    float aUp = texture2D(tDiffuse, vUv + vec2(0.0, uTexelSize.y)).a;
    float aDown = texture2D(tDiffuse, vUv - vec2(0.0, uTexelSize.y)).a;
    float aLeft = texture2D(tDiffuse, vUv - vec2(uTexelSize.x, 0.0)).a;
    float aRight = texture2D(tDiffuse, vUv + vec2(uTexelSize.x, 0.0)).a;

    float border = max(max(aUp, aDown), max(aLeft, aRight));
    if (border > 0.5) {
      gl_FragColor = vec4(uOutline * 0.96, 0.96);
      return;
    }

    discard;
  }
`;

/* -------------------------------------------------------------------------- */
/*  Compact column-major 3D math (zero external dependencies)                 */
/* -------------------------------------------------------------------------- */

type Vec3 = [number, number, number];

function normalize3(x: number, y: number, z: number): Vec3 {
  const len = Math.hypot(x, y, z);
  return len > 1e-6 ? [x / len, y / len, z / len] : [0, 1, 0];
}

function cross3(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function dot3(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function mat4Perspective(fovDeg: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan((fovDeg * Math.PI) / 360);
  const nf = 1 / (near - far);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

function mat4LookAt(eye: Vec3, target: Vec3, up: Vec3): Float32Array {
  const z = normalize3(eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]);
  const x = normalize3(...cross3(up, z));
  const y = cross3(z, x);

  const out = new Float32Array(16);
  out[0] = x[0];
  out[1] = y[0];
  out[2] = z[0];
  out[4] = x[1];
  out[5] = y[1];
  out[6] = z[1];
  out[8] = x[2];
  out[9] = y[2];
  out[10] = z[2];
  out[12] = -dot3(x, eye);
  out[13] = -dot3(y, eye);
  out[14] = -dot3(z, eye);
  out[15] = 1;
  return out;
}

function mat4Multiply(a: Float32Array, b: Float32Array, out = new Float32Array(16)): Float32Array {
  for (let col = 0; col < 4; col++) {
    const b0 = b[col * 4];
    const b1 = b[col * 4 + 1];
    const b2 = b[col * 4 + 2];
    const b3 = b[col * 4 + 3];
    out[col * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
    out[col * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
    out[col * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
    out[col * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
  }
  return out;
}

/** Composes T * Rx * Ry * Rz * S matching standard XYZ Euler order. */
function mat4ComposeXYZ(
  tx: number,
  ty: number,
  tz: number,
  rx: number,
  ry: number,
  rz: number,
  scale = 1,
  out = new Float32Array(16)
): Float32Array {
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  const cz = Math.cos(rz);
  const sz = Math.sin(rz);

  // R = Rx * Ry * Rz (column-major)
  out[0] = cy * cz * scale;
  out[1] = (cx * sz + sx * sy * cz) * scale;
  out[2] = (sx * sz - cx * sy * cz) * scale;
  out[3] = 0;

  out[4] = -cy * sz * scale;
  out[5] = (cx * cz - sx * sy * sz) * scale;
  out[6] = (sx * cz + cx * sy * sz) * scale;
  out[7] = 0;

  out[8] = sy * scale;
  out[9] = -sx * cy * scale;
  out[10] = cx * cy * scale;
  out[11] = 0;

  out[12] = tx;
  out[13] = ty;
  out[14] = tz;
  out[15] = 1;
  return out;
}

function mat3UpperLeft(m: Float32Array, out = new Float32Array(9)): Float32Array {
  out[0] = m[0];
  out[1] = m[1];
  out[2] = m[2];
  out[3] = m[4];
  out[4] = m[5];
  out[5] = m[6];
  out[6] = m[8];
  out[7] = m[9];
  out[8] = m[10];
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Procedural low-poly apple, curved stem, and folded leaf meshes            */
/* -------------------------------------------------------------------------- */

function computeSmoothNormals(positions: Float32Array, indices: Uint16Array): Float32Array {
  const normals = new Float32Array(positions.length);

  for (let i = 0; i < indices.length; i += 3) {
    const ia = indices[i] * 3;
    const ib = indices[i + 1] * 3;
    const ic = indices[i + 2] * 3;

    const abx = positions[ib] - positions[ia];
    const aby = positions[ib + 1] - positions[ia + 1];
    const abz = positions[ib + 2] - positions[ia + 2];

    const acx = positions[ic] - positions[ia];
    const acy = positions[ic + 1] - positions[ia + 1];
    const acz = positions[ic + 2] - positions[ia + 2];

    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;

    normals[ia] += nx;
    normals[ia + 1] += ny;
    normals[ia + 2] += nz;
    normals[ib] += nx;
    normals[ib + 1] += ny;
    normals[ib + 2] += nz;
    normals[ic] += nx;
    normals[ic + 1] += ny;
    normals[ic + 2] += nz;
  }

  for (let i = 0; i < normals.length; i += 3) {
    const [nx, ny, nz] = normalize3(normals[i], normals[i + 1], normals[i + 2]);
    normals[i] = nx;
    normals[i + 1] = ny;
    normals[i + 2] = nz;
  }

  return normals;
}

/**
 * Generates an organic low-poly faceted apple fruit geometry with top stem
 * cavity, broad upper shoulders, slight five-lobe symmetry, and bottom dimple.
 */
export function buildAppleFruitGeometry(radialSegments = 18, heightSegments = 16): MeshData {
  const positions: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= heightSegments; iy++) {
    const t = iy / heightSegments;
    const v = t * Math.PI;
    const sinV = Math.sin(v);
    const cosV = Math.cos(v);

    const widthBias = 0.8 + 0.34 * Math.sin(t * Math.PI * 0.82);
    const baseRadius = sinV * widthBias * 0.96;

    const topDimple = -0.46 * Math.exp(-Math.pow((Math.PI - v) / 0.5, 2));
    const bottomDimple = 0.2 * Math.exp(-Math.pow(v / 0.42, 2));
    const y = -cosV * 0.95 + topDimple + bottomDimple;

    for (let ix = 0; ix <= radialSegments; ix++) {
      const u = ix / radialSegments;
      const phi = u * Math.PI * 2;
      const lobe = 1.0 + 0.048 * Math.cos(5.0 * phi) * Math.pow(sinV, 1.3);
      const r = baseRadius * lobe;

      positions.push(Math.cos(phi) * r, y, Math.sin(phi) * r);
    }
  }

  const stride = radialSegments + 1;
  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < radialSegments; ix++) {
      const a = iy * stride + ix;
      const b = a + 1;
      const c = (iy + 1) * stride + ix;
      const d = c + 1;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const posArr = new Float32Array(positions);
  const idxArr = new Uint16Array(indices);
  const normals = computeSmoothNormals(posArr, idxArr);

  // Weld normal seam along phi = 0 / 2pi
  for (let iy = 0; iy <= heightSegments; iy++) {
    const i0 = iy * stride * 3;
    const i1 = (iy * stride + radialSegments) * 3;
    const [nx, ny, nz] = normalize3(
      normals[i0] + normals[i1],
      normals[i0 + 1] + normals[i1 + 1],
      normals[i0 + 2] + normals[i1 + 2]
    );
    normals[i0] = normals[i1] = nx;
    normals[i0 + 1] = normals[i1 + 1] = ny;
    normals[i0 + 2] = normals[i1 + 2] = nz;
  }

  return { positions: posArr, normals, indices: idxArr };
}

function catmullRom(pts: Vec3[], t: number): Vec3 {
  const segCount = pts.length - 1;
  const scaled = Math.max(0, Math.min(1, t)) * segCount;
  const seg = Math.min(Math.floor(scaled), segCount - 1);
  const u = scaled - seg;
  const u2 = u * u;
  const u3 = u2 * u;

  const p0 = pts[Math.max(0, seg - 1)];
  const p1 = pts[seg];
  const p2 = pts[seg + 1];
  const p3 = pts[Math.min(pts.length - 1, seg + 2)];

  const interp = (k: 0 | 1 | 2) =>
    0.5 *
    (2 * p1[k] +
      (-p0[k] + p2[k]) * u +
      (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 +
      (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3);

  return [interp(0), interp(1), interp(2)];
}

/**
 * Generates a curved low-poly woody stem rising cleanly from inside the fruit dimple.
 */
export function buildAppleStemGeometry(
  tubularSegments = 8,
  radius = 0.062,
  radialSegments = 6
): MeshData {
  const controlPts: Vec3[] = [
    [0, 0.45, 0],
    [0.03, 0.78, 0.02],
    [0.11, 1.05, -0.02],
    [0.24, 1.24, -0.05],
  ];

  const centers: Vec3[] = [];
  for (let i = 0; i <= tubularSegments; i++) {
    centers.push(catmullRom(controlPts, i / tubularSegments));
  }

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  let prevNormal: Vec3 = [1, 0, 0];

  for (let i = 0; i <= tubularSegments; i++) {
    const prev = centers[Math.max(0, i - 1)];
    const next = centers[Math.min(tubularSegments, i + 1)];
    const tangent = normalize3(next[0] - prev[0], next[1] - prev[1], next[2] - prev[2]);

    // Parallel-transport normal frame along the stem curve
    const proj = dot3(prevNormal, tangent);
    const nVec = normalize3(
      prevNormal[0] - tangent[0] * proj,
      prevNormal[1] - tangent[1] * proj,
      prevNormal[2] - tangent[2] * proj
    );
    prevNormal = nVec;
    const bVec = cross3(tangent, nVec);
    const c = centers[i];

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const nx = cosT * nVec[0] + sinT * bVec[0];
      const ny = cosT * nVec[1] + sinT * bVec[1];
      const nz = cosT * nVec[2] + sinT * bVec[2];

      positions.push(c[0] + nx * radius, c[1] + ny * radius, c[2] + nz * radius);
      normals.push(nx, ny, nz);
    }
  }

  const stride = radialSegments + 1;
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * stride + j;
      const b = a + 1;
      const c = (i + 1) * stride + j;
      const d = c + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
  };
}

/**
 * Generates an angular 16-bit faceted double-sided folded leaf off the stem.
 */
export function buildAppleLeafGeometry(): MeshData {
  const positions = new Float32Array([
    // Top face left
    0.0, 0.0, 0.0,
    0.26, 0.24, 0.16,
    0.58, 0.16, 0.0,
    // Top face right
    0.0, 0.0, 0.0,
    0.58, 0.16, 0.0,
    0.26, 0.22, -0.16,
    // Mid-spine ridge elevation (upper facets)
    0.0, 0.0, 0.0,
    0.26, 0.28, 0.01,
    0.26, 0.24, 0.16,

    0.26, 0.28, 0.01,
    0.58, 0.16, 0.0,
    0.26, 0.24, 0.16,

    0.0, 0.0, 0.0,
    0.26, 0.22, -0.16,
    0.26, 0.28, 0.01,

    0.26, 0.28, 0.01,
    0.26, 0.22, -0.16,
    0.58, 0.16, 0.0,
  ]);

  const vertexCount = positions.length / 3;
  const indices = new Uint16Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) indices[i] = i;

  const normals = computeSmoothNormals(positions, indices);
  return { positions, normals, indices, doubleSided: true };
}

/* -------------------------------------------------------------------------- */
/*  Two-pass raw WebGL renderer (offscreen NEAREST FBO + outline blit pass)   */
/* -------------------------------------------------------------------------- */

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('WebGL createShader failed');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || 'Unknown shader compile error';
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function linkProgram(gl: WebGLRenderingContext, vertSrc: string, fragSrc: string): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    throw new Error('WebGL createProgram failed');
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || 'Unknown program link error';
    gl.deleteProgram(program);
    throw new Error(log);
  }
  return program;
}

function uploadMesh(gl: WebGLRenderingContext, data: MeshData): GpuMesh {
  const posBuf = gl.createBuffer();
  const normBuf = gl.createBuffer();
  const idxBuf = gl.createBuffer();
  if (!posBuf || !normBuf || !idxBuf) {
    throw new Error('WebGL buffer allocation failed');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
  gl.bufferData(gl.ARRAY_BUFFER, data.normals, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW);

  return {
    posBuf,
    normBuf,
    idxBuf,
    indexCount: data.indices.length,
    doubleSided: Boolean(data.doubleSided),
  };
}

function getRes(mode: PixelMode): number {
  return mode === '16bit' ? 148 : 82;
}

function getOutlineRgb(paletteId: number): [number, number, number] {
  return paletteId > 2.5 ? [0.06, 0.06, 0.08] : [0.04, 0.02, 0.03];
}

export function createRetroAppleRenderer(
  gl: WebGLRenderingContext,
  options: {
    mode: PixelMode;
    paletteId: number;
    snapEnabled: boolean;
  }
): RetroAppleRenderer {
  const sceneProg = linkProgram(gl, RETRO_VERTEX_SHADER, RETRO_FRAGMENT_SHADER);
  const blitProg = linkProgram(gl, BLIT_VERTEX_SHADER, BLIT_FRAGMENT_SHADER);

  const aScenePos = gl.getAttribLocation(sceneProg, 'position');
  const aSceneNorm = gl.getAttribLocation(sceneProg, 'normal');
  const uModel = gl.getUniformLocation(sceneProg, 'uModel');
  const uViewProj = gl.getUniformLocation(sceneProg, 'uViewProj');
  const uNormalMatrix = gl.getUniformLocation(sceneProg, 'uNormalMatrix');
  const uCameraPos = gl.getUniformLocation(sceneProg, 'uCameraPos');
  const uMatId = gl.getUniformLocation(sceneProg, 'uMatId');
  const uSteps = gl.getUniformLocation(sceneProg, 'uSteps');
  const uPaletteId = gl.getUniformLocation(sceneProg, 'uPaletteId');
  const uSnapGrid = gl.getUniformLocation(sceneProg, 'uSnapGrid');
  const uSnapEnabled = gl.getUniformLocation(sceneProg, 'uSnapEnabled');

  const aBlitPos = gl.getAttribLocation(blitProg, 'position');
  const uDiffuse = gl.getUniformLocation(blitProg, 'tDiffuse');
  const uTexelSize = gl.getUniformLocation(blitProg, 'uTexelSize');
  const uOutline = gl.getUniformLocation(blitProg, 'uOutline');

  const fruitData = buildAppleFruitGeometry(18, 16);
  const stemData = buildAppleStemGeometry();
  const leafData = buildAppleLeafGeometry();

  const fruitMesh = uploadMesh(gl, fruitData);
  const stemMesh = uploadMesh(gl, stemData);
  const leafMesh = uploadMesh(gl, leafData);

  const triangleCount =
    (fruitData.indices.length + stemData.indices.length + leafData.indices.length) / 3;

  const quadBuf = gl.createBuffer();
  if (!quadBuf) throw new Error('WebGL quad buffer allocation failed');
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  // Offscreen NEAREST-filtered render target
  const fbo = gl.createFramebuffer();
  const colorTex = gl.createTexture();
  const depthBuf = gl.createRenderbuffer();
  if (!fbo || !colorTex || !depthBuf) {
    throw new Error('WebGL render target allocation failed');
  }

  let rtSize = getRes(options.mode);
  let steps = options.mode === '16bit' ? 4.0 : 2.0;
  let snapGrid = options.mode === '16bit' ? 112.0 : 60.0;
  let paletteId = options.paletteId;
  let snapEnabled = options.snapEnabled ? 1.0 : 0.0;
  let canvasSide = gl.canvas.width || 360;

  const allocateRenderTarget = (size: number) => {
    rtSize = size;

    gl.bindTexture(gl.TEXTURE_2D, colorTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuf);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, size, size);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuf);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  allocateRenderTarget(rtSize);

  const cameraPos: Vec3 = [0, 0.2, 4.35];
  const projMat = mat4Perspective(34, 1, 0.1, 20);
  const viewMat = mat4LookAt(cameraPos, [0, 0.12, 0], [0, 1, 0]);
  const viewProjMat = mat4Multiply(projMat, viewMat);

  const leafLocalMat = mat4ComposeXYZ(0.08, 0.88, 0.02, 0.16, 0.35, 0.14, 1.06);
  const groupMat = new Float32Array(16);
  const leafWorldMat = new Float32Array(16);
  const groupNormalMat = new Float32Array(9);
  const leafNormalMat = new Float32Array(9);

  const drawMesh = (mesh: GpuMesh, matId: number, model: Float32Array, normMat: Float32Array) => {
    if (mesh.doubleSided) {
      gl.disable(gl.CULL_FACE);
    } else {
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
    }

    gl.uniform1f(uMatId, matId);
    gl.uniformMatrix4fv(uModel, false, model);
    gl.uniformMatrix3fv(uNormalMatrix, false, normMat);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.posBuf);
    gl.enableVertexAttribArray(aScenePos);
    gl.vertexAttribPointer(aScenePos, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normBuf);
    gl.enableVertexAttribArray(aSceneNorm);
    gl.vertexAttribPointer(aSceneNorm, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.idxBuf);
    gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
  };

  return {
    triangleCount,
    setMode(nextMode: PixelMode) {
      const nextRes = getRes(nextMode);
      steps = nextMode === '16bit' ? 4.0 : 2.0;
      snapGrid = nextMode === '16bit' ? 112.0 : 60.0;
      if (nextRes !== rtSize) {
        allocateRenderTarget(nextRes);
      }
    },
    setPalette(nextPid: number) {
      paletteId = nextPid;
    },
    setSnapEnabled(enabled: boolean) {
      snapEnabled = enabled ? 1.0 : 0.0;
    },
    resize(side: number) {
      canvasSide = Math.max(200, Math.round(side));
      if (gl.canvas instanceof HTMLCanvasElement) {
        if (gl.canvas.width !== canvasSide || gl.canvas.height !== canvasSide) {
          gl.canvas.width = canvasSide;
          gl.canvas.height = canvasSide;
        }
      }
    },
    render(rotX: number, rotY: number, rotZ: number, bobY: number) {
      mat4ComposeXYZ(0, bobY, 0, rotX, rotY, rotZ, 1, groupMat);
      mat4Multiply(groupMat, leafLocalMat, leafWorldMat);
      mat3UpperLeft(groupMat, groupNormalMat);
      mat3UpperLeft(leafWorldMat, leafNormalMat);

      // Pass 1: Render faceted apple into low-res NEAREST render target
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, rtSize, rtSize);
      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(sceneProg);
      gl.uniformMatrix4fv(uViewProj, false, viewProjMat);
      gl.uniform3f(uCameraPos, cameraPos[0], cameraPos[1], cameraPos[2]);
      gl.uniform1f(uSteps, steps);
      gl.uniform1f(uPaletteId, paletteId);
      gl.uniform1f(uSnapGrid, snapGrid);
      gl.uniform1f(uSnapEnabled, snapEnabled);

      drawMesh(fruitMesh, 0.0, groupMat, groupNormalMat);
      drawMesh(stemMesh, 1.0, groupMat, groupNormalMat);
      drawMesh(leafMesh, 2.0, leafWorldMat, leafNormalMat);

      // Pass 2: Blit low-res texture to canvas with crisp 1px silhouette outline
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvasSide, canvasSide);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(blitProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, colorTex);
      gl.uniform1i(uDiffuse, 0);
      gl.uniform2f(uTexelSize, 1 / rtSize, 1 / rtSize);
      const [or, og, ob] = getOutlineRgb(paletteId);
      gl.uniform3f(uOutline, or, og, ob);

      if (aSceneNorm >= 0) gl.disableVertexAttribArray(aSceneNorm);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(aBlitPos);
      gl.vertexAttribPointer(aBlitPos, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      for (const mesh of [fruitMesh, stemMesh, leafMesh]) {
        gl.deleteBuffer(mesh.posBuf);
        gl.deleteBuffer(mesh.normBuf);
        gl.deleteBuffer(mesh.idxBuf);
      }
      gl.deleteBuffer(quadBuf);
      gl.deleteFramebuffer(fbo);
      gl.deleteTexture(colorTex);
      gl.deleteRenderbuffer(depthBuf);
      gl.deleteProgram(sceneProg);
      gl.deleteProgram(blitProg);
    },
  };
}
