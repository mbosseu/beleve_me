import * as THREE from "three";

/** Deterministic PRNG so the table looks the same on every visit. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Dark smoked-oak table top: colour map + roughness map drawn on canvas.
 * Grain runs along the X axis (the long side of the table).
 */
export function createWoodTextures(width: number) {
  const height = width / 2;
  const rand = mulberry32(19);

  const color = document.createElement("canvas");
  color.width = width;
  color.height = height;
  const c = color.getContext("2d")!;

  const rough = document.createElement("canvas");
  rough.width = width;
  rough.height = height;
  const r = rough.getContext("2d")!;

  c.fillStyle = "#16120e";
  c.fillRect(0, 0, width, height);
  r.fillStyle = "rgb(150,150,150)";
  r.fillRect(0, 0, width, height);

  const lines = Math.round(width * 0.22);
  for (let i = 0; i < lines; i++) {
    const y0 = rand() * height;
    const amp = 1 + rand() * (height * 0.012);
    const freq = ((0.4 + rand() * 1.8) * Math.PI * 2) / width;
    const phase = rand() * Math.PI * 2;
    const light = rand() > 0.55;
    const alpha = 0.04 + rand() * 0.16;
    c.strokeStyle = light ? `rgba(78,62,46,${alpha})` : `rgba(4,3,2,${alpha * 1.4})`;
    r.strokeStyle = light ? `rgba(200,200,200,${alpha})` : `rgba(95,95,95,${alpha})`;
    const lw = 0.4 + rand() * 2.6 * (width / 2048);
    c.lineWidth = lw;
    r.lineWidth = lw;
    c.beginPath();
    r.beginPath();
    for (let x = 0; x <= width; x += 6) {
      const y =
        y0 +
        Math.sin(x * freq + phase) * amp +
        Math.sin(x * freq * 3.3 + phase * 1.7) * amp * 0.22;
      if (x === 0) {
        c.moveTo(x, y);
        r.moveTo(x, y);
      } else {
        c.lineTo(x, y);
        r.lineTo(x, y);
      }
    }
    c.stroke();
    r.stroke();
  }

  // Pores / speckles
  const specks = width * 6;
  for (let i = 0; i < specks; i++) {
    const x = rand() * width;
    const y = rand() * height;
    c.fillStyle = `rgba(0,0,0,${rand() * 0.25})`;
    c.fillRect(x, y, 1 + rand() * 3, 1);
  }

  const map = new THREE.CanvasTexture(color);
  map.colorSpace = THREE.SRGBColorSpace;
  const roughnessMap = new THREE.CanvasTexture(rough);
  for (const t of [map, roughnessMap]) {
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.anisotropy = 8;
  }
  return { map, roughnessMap };
}

/** Fine wound-thread stripes for the embroidery spool (bump map). */
export function createThreadTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(7);
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 32, 256);
  for (let y = 0; y < 256; y += 2) {
    ctx.fillStyle = `rgba(255,255,255,${0.25 + rand() * 0.35})`;
    ctx.fillRect(0, y, 32, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 1);
  return tex;
}
