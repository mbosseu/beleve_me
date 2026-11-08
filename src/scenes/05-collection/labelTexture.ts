import * as THREE from "three";

/** Renders small uppercase plaque text with the site's own sans font. */
export function labelTexture(lines: { text: string; color: string; size: number; spacing?: number }[], w = 512, h = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const family =
    getComputedStyle(document.documentElement).getPropertyValue("--font-inter-tight").trim() ||
    "Helvetica Neue, Arial, sans-serif";
  const total = lines.reduce((s, l) => s + l.size * 1.7, 0);
  let y = (h - total) / 2;
  for (const l of lines) {
    ctx.font = `500 ${l.size}px ${family}`;
    ctx.fillStyle = l.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${l.spacing ?? l.size * 0.35}px`;
    ctx.fillText(l.text.toUpperCase(), w / 2, y);
    y += l.size * 1.7;
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
