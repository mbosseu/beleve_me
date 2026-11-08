import * as THREE from "three";

/**
 * Procedural geometry of the BELIEVE ME doudoune, built from the reference
 * renders (35f91925 / ebd02fd3 / f7dc0779): cropped hip length, wide boxy
 * body with five horizontal baffles, dropped shoulders, quilted sleeves with
 * elastic cuffs, elastic hem, volumetric hood, central metal zip.
 * Units: metres. The hem sits at y = 0, the body centred on x = z = 0.
 */

export const BODY = {
  height: 0.64,
  hem: 0.075, // elastic band, fraction of height
  top: 0.86, // where the shoulders start to close
  rows: 5,
  rx: 0.285,
  rz: 0.178,
  loft: 0.0145,
} as const;

const smooth = THREE.MathUtils.smoothstep;
const lerp = THREE.MathUtils.lerp;

/** Cross-section radii and baffle loft at height fraction v. */
export function bodyProfile(v: number) {
  const hemBlend = smooth(v, BODY.hem, BODY.hem + 0.035);
  let rx = lerp(0.258, BODY.rx, hemBlend);
  let rz = lerp(0.162, BODY.rz, hemBlend);
  const shoulder = smooth(v, BODY.top - 0.05, 1);
  rx = lerp(rx, 0.108, Math.pow(shoulder, 1.35));
  rz = lerp(rz, 0.098, Math.pow(shoulder, 1.1));

  let loft = 0;
  if (v > BODY.hem && v < 1) {
    const f = ((v - BODY.hem) / (BODY.top - BODY.hem)) * BODY.rows;
    const frac = f - Math.floor(f);
    // Five full baffles, then a softer shoulder yoke.
    const amp = f < BODY.rows ? BODY.loft : BODY.loft * 0.55 * (1 - shoulder);
    loft = amp * Math.pow(Math.sin(Math.PI * frac), 0.85);
  }
  return { rx, rz, loft, hem: v < BODY.hem };
}

/** Point on the front centre line (where the zip runs). */
export function frontZ(v: number) {
  const p = bodyProfile(v);
  return p.rz + p.loft * 0.85;
}

/** Surface z on the front for a given x and height fraction. */
export function frontSurfaceZ(x: number, v: number) {
  const p = bodyProfile(v);
  const rx = p.rx + p.loft;
  const k = Math.min(0.999, Math.abs(x) / rx);
  return (p.rz + p.loft * 0.85) * Math.sqrt(1 - k * k);
}

function angularDistance(a: number, b: number) {
  const d = Math.abs(a - b) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
}

export function buildBody(U = 160, V = 200) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j <= V; j++) {
    const v = j / V;
    const y = v * BODY.height;
    const p = bodyProfile(v);
    for (let i = 0; i <= U; i++) {
      const th = (i / U) * Math.PI * 2;
      // Zip groove at centre front (+z) and a seam at centre back.
      const front = angularDistance(th, Math.PI / 2);
      const back = angularDistance(th, -Math.PI / 2);
      const groove = -0.006 * Math.exp(-Math.pow(front / 0.035, 2)) - 0.003 * Math.exp(-Math.pow(back / 0.02, 2));
      const rib = p.hem ? 0.0018 * Math.cos(th * 110) : 0;
      const x = (p.rx + p.loft + groove + rib) * Math.cos(th);
      const z = (p.rz + p.loft * 0.85 + groove + rib) * Math.sin(th);
      positions.push(x, y, z);
      uvs.push((i / U) * 8, v * 5);
    }
  }
  for (let j = 0; j < V; j++)
    for (let i = 0; i < U; i++) {
      const a = j * (U + 1) + i;
      const b = a + U + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Quilted sleeve along a hanging curve, ending in an elastic cuff. */
export function buildSleeve(side: 1 | -1, L = 140, R = 44) {
  const s = side;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.17 * s, 0.53, -0.01),
    new THREE.Vector3(0.29 * s, 0.505, 0.0),
    new THREE.Vector3(0.355 * s, 0.33, 0.02),
    new THREE.Vector3(0.385 * s, 0.12, 0.045),
    new THREE.Vector3(0.385 * s, -0.035, 0.06),
  ]);
  const frames = curve.computeFrenetFrames(L, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const pt = new THREE.Vector3();
  for (let j = 0; j <= L; j++) {
    const t = j / L;
    curve.getPointAt(t, pt);
    const N = frames.normals[j];
    const B = frames.binormals[j];
    const cuff = smooth(t, 0.9, 0.925);
    const base = lerp(0.092, 0.078, t);
    const rows = 5;
    const f = THREE.MathUtils.clamp((t - 0.08) / 0.82, 0, 1) * rows;
    const frac = f - Math.floor(f);
    const loft = t > 0.08 && t < 0.9 ? 0.0105 * Math.pow(Math.sin(Math.PI * frac), 0.85) : 0;
    for (let i = 0; i <= R; i++) {
      const a = (i / R) * Math.PI * 2;
      const rib = cuff > 0 ? 0.0014 * Math.cos(a * 46) * cuff : 0;
      const r = lerp(base + loft, 0.05, cuff) + rib;
      const cx = Math.cos(a) * r;
      const cy = Math.sin(a) * r;
      positions.push(pt.x + N.x * cx + B.x * cy, pt.y + N.y * cx + B.y * cy, pt.z + N.z * cx + B.z * cy);
      uvs.push((i / R) * 3, t * 6);
    }
  }
  for (let j = 0; j < L; j++)
    for (let i = 0; i < R; i++) {
      const a = j * (R + 1) + i;
      const b = a + R + 1;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  const end = curve.getPointAt(1);
  const tangent = curve.getTangentAt(1);
  return { geometry: g, cuffEnd: end, cuffDir: tangent };
}

/** Volumetric hood with three quilted panels and an open face. */
export function buildHood() {
  const opening = 1.2;
  const g = new THREE.SphereGeometry(0.16, 72, 44, Math.PI / 2 + opening, Math.PI * 2 - opening * 2, 0, Math.PI * 0.72);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const phi = Math.atan2(v.z, -v.x); // matches SphereGeometry's phi
    const u = (phi - (Math.PI / 2 + opening) + Math.PI * 4) % (Math.PI * 2);
    const span = Math.PI * 2 - opening * 2;
    const panel = Math.pow(Math.abs(Math.sin((u / span) * Math.PI * 3)), 0.7);
    const k = 1 + 0.035 * panel;
    v.multiplyScalar(k);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}
