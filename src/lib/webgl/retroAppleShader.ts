import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Float32BufferAttribute,
  FrontSide,
  Group,
  MathUtils,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';

export {
  DoubleSide,
  FrontSide,
  Group,
  MathUtils,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  WebGLRenderer,
};

export const RETRO_VERTEX_SHADER = /* glsl */ `
  uniform float uSnapGrid;
  uniform float uSnapEnabled;

  varying vec3 vNormalWorld;
  varying vec3 vWorldPos;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);

    vec4 clipPos = projectionMatrix * viewMatrix * worldPosition;
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

  uniform float uMatId;
  uniform float uSteps;

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

  vec3 fruitPalette(float t) {
    // Deep plum shadow -> deep orchard crimson -> apple red -> warm coral specular
    vec3 c0 = vec3(0.165, 0.039, 0.047);
    vec3 c1 = vec3(0.451, 0.086, 0.075);
    vec3 c2 = vec3(0.588, 0.125, 0.102);
    vec3 c3 = vec3(0.894, 0.224, 0.184);
    vec3 c4 = vec3(1.000, 0.541, 0.431);

    if (t < 0.25) return c0;
    if (t < 0.50) return c1;
    if (t < 0.75) return c2;
    if (t < 0.94) return c3;
    return c4;
  }

  vec3 barkPalette(float t) {
    vec3 c0 = vec3(0.145, 0.114, 0.090);
    vec3 c1 = vec3(0.329, 0.275, 0.227);
    vec3 c2 = vec3(0.545, 0.482, 0.412);
    vec3 c3 = vec3(0.761, 0.698, 0.616);

    if (t < 0.33) return c0;
    if (t < 0.66) return c1;
    if (t < 0.90) return c2;
    return c3;
  }

  vec3 leafPalette(float t) {
    // Deep olive shadow -> grass green -> brand acid lime #cdfb45
    vec3 c0 = vec3(0.125, 0.204, 0.039);
    vec3 c1 = vec3(0.341, 0.529, 0.075);
    vec3 c2 = vec3(0.608, 0.855, 0.157);
    vec3 c3 = vec3(0.804, 0.984, 0.271);

    if (t < 0.30) return c0;
    if (t < 0.62) return c1;
    if (t < 0.88) return c2;
    return c3;
  }

  void main() {
    vec3 N = normalize(vNormalWorld);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 keyDir = normalize(vec3(0.62, 0.84, 0.72));
    vec3 fillDir = normalize(vec3(-0.65, -0.45, 0.25));

    float diff = max(dot(N, keyDir), 0.0);
    float fill = max(dot(N, fillDir), 0.0) * 0.25;

    vec3 halfVec = normalize(keyDir + V);
    float specPower = uMatId < 0.5 ? 28.0 : 14.0;
    float specStrength = uMatId < 0.5 ? 0.55 : (uMatId > 1.5 ? 0.22 : 0.06);
    float spec = pow(max(dot(N, halfVec), 0.0), specPower) * specStrength;

    // Subtle cool-warm rim keeps the silhouette crisp on dark background
    float rim = pow(1.0 - max(dot(N, V), 0.0), 2.5) * 0.28;

    float lum = clamp(0.14 + diff * 0.72 + fill + spec + rim, 0.0, 1.0);

    float bayer = bayer4x4(floor(gl_FragCoord.xy));
    float spread = 0.92 / max(uSteps, 2.0);
    float dithered = clamp(lum + (bayer - 0.46875) * spread, 0.0, 1.0);
    float quantized = clamp(floor(dithered * uSteps + 0.5) / uSteps, 0.0, 1.0);

    vec3 color;
    if (uMatId < 0.5) {
      color = fruitPalette(quantized);
    } else if (uMatId < 1.5) {
      color = barkPalette(quantized);
    } else {
      color = leafPalette(quantized);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

export const BLIT_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const BLIT_FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;

  uniform sampler2D tDiffuse;
  uniform vec2 uTexelSize;

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
      gl_FragColor = vec4(0.04, 0.02, 0.03, 0.95);
      return;
    }

    discard;
  }
`;

/**
 * Generates an organic low-poly faceted apple fruit geometry with top stem
 * cavity, broad upper shoulders, slight five-lobe symmetry, and bottom dimple.
 */
export function buildAppleFruitGeometry(radialSegments = 18, heightSegments = 16): BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= heightSegments; iy++) {
    const t = iy / heightSegments;
    const v = t * Math.PI; // 0 = bottom pole, PI = top stem center
    const sinV = Math.sin(v);
    const cosV = Math.cos(v);

    // Classic apple profile: narrower rounded base, broad upper shoulder, inward rim
    const widthBias = 0.8 + 0.34 * Math.sin(t * Math.PI * 0.82);
    const baseRadius = sinV * widthBias * 0.96;

    // Deep stem socket at top, subtle calyx hollow at bottom
    const topDimple = -0.46 * Math.exp(-Math.pow((Math.PI - v) / 0.5, 2));
    const bottomDimple = 0.2 * Math.exp(-Math.pow(v / 0.42, 2));
    const y = -cosV * 0.95 + topDimple + bottomDimple;

    for (let ix = 0; ix <= radialSegments; ix++) {
      const u = ix / radialSegments;
      const phi = u * Math.PI * 2;
      const lobe = 1.0 + 0.048 * Math.cos(5.0 * phi) * Math.pow(sinV, 1.3);
      const r = baseRadius * lobe;

      positions.push(Math.cos(phi) * r, y, Math.sin(phi) * r);
      uvs.push(u, t);
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

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Generates a curved low-poly woody stem rising cleanly from inside the fruit dimple.
 */
export function buildAppleStemGeometry(): BufferGeometry {
  const curve = new CatmullRomCurve3([
    new Vector3(0, 0.45, 0),
    new Vector3(0.03, 0.78, 0.02),
    new Vector3(0.11, 1.05, -0.02),
    new Vector3(0.24, 1.24, -0.05),
  ]);
  const geo = new TubeGeometry(curve, 8, 0.062, 6, false);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates an angular 16-bit faceted double-sided folded leaf off the stem.
 */
export function buildAppleLeafGeometry(): BufferGeometry {
  // 6 vertices forming a crisp folded leaf blade with thickness / 3D ridge
  const verts = new Float32Array([
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

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  return geo;
}
