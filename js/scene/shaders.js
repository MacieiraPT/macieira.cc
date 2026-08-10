/**
 * shaders.js — GLSL for the particle field.
 *
 * The field holds three sets of positions for every point (an orb, a drifting
 * wave field, and the sampled "M" of Macieira) and blends between them on the
 * GPU. Scroll position is a single uniform, `uPhase`:
 *
 *   0 → orb          (hero)
 *   1 → wave field   (the playing half)
 *   2 → glyph        (the seam, where the page turns into the building half)
 *
 * Doing the morph in the vertex shader means the CPU never touches 26k
 * positions per frame — it only writes one float.
 */

export const vertexShader = /* glsl */ `
  // Position sets: the built-in "position" attribute is the orb, and the
  // other two shapes ride along beside it.
  attribute vec3 aWave;
  attribute vec3 aGlyph;
  attribute float aRand;      // stable per-point randomness, 0..1

  uniform float uTime;
  uniform float uPhase;       // 0..2, written by ScrollTrigger
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uBurst;       // 0..1 impulse on click
  uniform vec2  uMouse;       // cursor, in this object's local space

  varying float vRand;
  varying float vDepth;
  varying float vPush;

  void main() {
    // ---- morph -------------------------------------------------------------
    // Points are staggered by aRand so the shape re-forms in a sweep rather
    // than every particle arriving at once.
    float lead = aRand * 0.35;
    float t1 = smoothstep(0.0 + lead, 1.0, clamp(uPhase, 0.0, 1.0));
    float t2 = smoothstep(0.0 + lead, 1.0, clamp(uPhase - 1.0, 0.0, 1.0));

    vec3 p = mix(position, aWave, t1);
    p = mix(p, aGlyph, t2);

    // ---- idle drift --------------------------------------------------------
    // Cheap layered sines: enough organic motion that the field never looks
    // frozen, without the cost of real noise.
    float t = uTime * 0.22 + aRand * 6.2831;
    p.x += sin(t + p.y * 0.42) * 0.16;
    p.y += cos(t * 0.85 + p.x * 0.31) * 0.16;
    p.z += sin(t * 0.6 + p.x * 0.25) * 0.28;

    // ---- cursor repulsion --------------------------------------------------
    // Points inside the cursor's radius are pushed out along the vector away
    // from it; the burst impulse briefly multiplies that radius and force.
    vec2 toCursor = p.xy - uMouse;
    float distance = length(toCursor) + 0.0001;
    float radius = 2.4 + uBurst * 3.0;
    float force = smoothstep(radius, 0.0, distance);
    p.xy += (toCursor / distance) * force * (1.15 + uBurst * 2.2);
    vPush = force;

    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    // Perspective-correct point size, with a floor so distant points don't
    // shimmer out of existence.
    float perspective = 14.0 / max(-viewPosition.z, 0.001);
    gl_PointSize = max(uSize * (0.45 + aRand) * uPixelRatio * perspective, 0.8);

    vRand = aRand;
    vDepth = -viewPosition.z;
  }
`;

export const fragmentShader = /* glsl */ `
  // No precision qualifiers here on purpose: three.js prepends matching ones
  // to both stages, and declaring a different float precision in only one of
  // them makes shared uniforms (uPhase) fail to link.
  uniform vec3 uColorA;   // acid — the playing half
  uniform vec3 uColorB;   // plasma — the building half
  uniform float uPhase;
  uniform float uOpacity;

  varying float vRand;
  varying float vDepth;
  varying float vPush;

  void main() {
    // Round the square point sprite, with a soft edge. Discarding early is
    // cheaper than blending a fully transparent fragment.
    vec2 offset = gl_PointCoord - 0.5;
    float sqrDistance = dot(offset, offset);
    if (sqrDistance > 0.25) discard;
    float mask = smoothstep(0.25, 0.02, sqrDistance);

    // Colour drifts from acid to plasma with scroll, scattered per point so
    // the field reads as a gradient rather than a flat fill.
    float blend = clamp(uPhase * 0.42 + vRand * 0.4 - 0.1, 0.0, 1.0);
    vec3 color = mix(uColorA, uColorB, blend);

    // Points shoved by the cursor flare toward white — the interaction is
    // legible even where the field is dim.
    color = mix(color, vec3(1.0), vPush * 0.5);

    float depthFade = smoothstep(30.0, 6.0, vDepth);
    gl_FragColor = vec4(color, mask * depthFade * (0.25 + vRand * 0.6) * uOpacity);
  }
`;
