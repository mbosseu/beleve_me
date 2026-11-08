import * as THREE from "three";

/** Graphite self-healing cutting mat with a fine centimetre grid. */
export function createCuttingMat(width: number, height: number, pxPerMetre = 512) {
  const w = Math.round(width * pxPerMetre);
  const h = Math.round(height * pxPerMetre);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext("2d")!;
  c.fillStyle = "#1b1b1a";
  c.fillRect(0, 0, w, h);
  const cm = pxPerMetre / 100;
  for (let i = 0; i * cm < w; i++) {
    c.strokeStyle = i % 10 === 0 ? "rgba(216,201,169,0.22)" : "rgba(255,255,255,0.045)";
    c.lineWidth = i % 10 === 0 ? 1.2 : 0.6;
    c.beginPath();
    c.moveTo(i * cm, 0);
    c.lineTo(i * cm, h);
    c.stroke();
  }
  for (let j = 0; j * cm < h; j++) {
    c.strokeStyle = j % 10 === 0 ? "rgba(216,201,169,0.22)" : "rgba(255,255,255,0.045)";
    c.lineWidth = j % 10 === 0 ? 1.2 : 0.6;
    c.beginPath();
    c.moveTo(0, j * cm);
    c.lineTo(w, j * cm);
    c.stroke();
  }
  // Wear: faint knife scratches
  for (let k = 0; k < 140; k++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const a = Math.random() * Math.PI;
    const l = 20 + Math.random() * 120;
    c.strokeStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.04})`;
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Tight twill weave, used as a bump map on the technical fabrics. */
export function createWeaveTexture(size = 256, repeat = 24) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext("2d")!;
  c.fillStyle = "#808080";
  c.fillRect(0, 0, size, size);
  const step = size / 32;
  for (let i = -size; i < size * 2; i += step) {
    c.strokeStyle = "rgba(255,255,255,0.35)";
    c.lineWidth = step * 0.45;
    c.beginPath();
    c.moveTo(i, 0);
    c.lineTo(i + size, size);
    c.stroke();
  }
  for (let n = 0; n < size * 6; n++) {
    c.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
    c.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}
