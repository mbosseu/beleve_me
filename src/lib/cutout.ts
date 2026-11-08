import * as THREE from "three";

/**
 * Removes the white studio background of a product render by flood-filling
 * from the image borders, so light parts inside the garment (a silver zip,
 * beige embroidery) are never touched. Returns an sRGB texture.
 */
export function cutout(img: HTMLImageElement, clipX = 0) {
  const w = img.width;
  const h = img.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const isBg = (i: number) => Math.min(px[i], px[i + 1], px[i + 2]) > 168;
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop()!;
    if (seen[p]) continue;
    seen[p] = 1;
    if (!isBg(p * 4)) continue;
    const m = Math.min(px[p * 4], px[p * 4 + 1], px[p * 4 + 2]);
    px[p * 4 + 3] = Math.round(255 * (1 - THREE.MathUtils.smoothstep(m, 168, 205)));
    const x = p % w;
    const y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
  // Defringe: the anti-aliased ring left from the white backdrop would glow on
  // a dark set. Fade light pixels that border the removed background.
  for (let pass = 0; pass < 2; pass++) {
    const alpha = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) alpha[i] = px[i * 4 + 3];
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (alpha[i] < 255) continue;
        if (alpha[i - 1] > 127 && alpha[i + 1] > 127 && alpha[i - w] > 127 && alpha[i + w] > 127) continue;
        const m = Math.min(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
        px[i * 4 + 3] = Math.round(255 * (1 - THREE.MathUtils.smoothstep(m, 60, 200)));
      }
  }
  if (clipX > 0)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) if (x < clipX || x >= w - clipX) px[(y * w + x) * 4 + 3] = 0;
  ctx.putImageData(data, 0, 0);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Unlit, not tone-mapped: the pixels on screen are the pixels of the file. */
export function faithfulMaterial(map: THREE.Texture) {
  return new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false, depthWrite: false });
}
