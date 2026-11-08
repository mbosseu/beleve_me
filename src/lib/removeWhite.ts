const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Removes the white studio backdrop of a product render (flood fill from the
 * borders, so light details inside the garment are kept) and returns a PNG
 * data URL. Plain canvas — no 3D library needed in the UI bundle.
 */
export async function removeWhiteBackground(src: string): Promise<string> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const min = (i: number) => Math.min(px[i], px[i + 1], px[i + 2]);

  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop()!;
    if (seen[p]) continue;
    seen[p] = 1;
    const m = min(p * 4);
    if (m <= 168) continue;
    px[p * 4 + 3] = Math.round(255 * (1 - smooth(168, 205, m)));
    const x = p % w;
    const y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
  // Defringe the anti-aliased edge left by the white backdrop.
  for (let pass = 0; pass < 2; pass++) {
    const alpha = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) alpha[i] = px[i * 4 + 3];
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (alpha[i] < 255) continue;
        if (alpha[i - 1] > 127 && alpha[i + 1] > 127 && alpha[i - w] > 127 && alpha[i + w] > 127) continue;
        px[i * 4 + 3] = Math.round(255 * (1 - smooth(60, 200, min(i * 4))));
      }
  }
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL("image/png");
}
