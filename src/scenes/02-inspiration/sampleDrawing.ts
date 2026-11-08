import { LANDMARKS, toWorld } from "./layout";

export interface DrawingSample {
  count: number;
  /** Where the ink sits on the paper (z = 0). */
  flat: Float32Array;
  /** The drawing rebuilt in depth. */
  sculpt: Float32Array;
  /** Wordmark particles' dispersed position. */
  scatter: Float32Array;
  seed: Float32Array;
  delay: Float32Array;
  /** 0 = botanical illustration, 1 = wordmark. */
  group: Float32Array;
  /** Ink density of the source pixel (0 light → 1 black). */
  shade: Float32Array;
  /** Average paper colour, so the background can match the sheet exactly. */
  paper: [number, number, number];
}

/**
 * Turns the original raster illustration into ink particles. Every particle
 * is a real dark pixel of the drawing — nothing is redrawn or invented.
 */
export function sampleDrawing(image: CanvasImageSource & { width: number; height: number }, total: number): DrawingSample {
  const w = image.width;
  const h = image.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;

  // Paper colour from the four corners.
  let pr = 0, pg = 0, pb = 0, pn = 0;
  for (const [cx, cy] of [[8, 8], [w - 40, 8], [8, h - 40], [w - 40, h - 40]]) {
    for (let y = cy; y < cy + 32; y++)
      for (let x = cx; x < cx + 32; x++) {
        const i = (y * w + x) * 4;
        pr += data[i]; pg += data[i + 1]; pb += data[i + 2]; pn++;
      }
  }
  const paper: [number, number, number] = [pr / pn / 255, pg / pn / 255, pb / pn / 255];

  const flowerPx: number[] = [];
  const wordPx: number[] = [];
  const x0 = Math.floor(w * 0.15), x1 = Math.ceil(w * 0.86);
  const y0 = Math.floor(h * 0.04), y1 = Math.ceil(h * 0.95);
  for (let y = y0; y < y1; y++) {
    const v = y / h;
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      if (lum < 0.5) (v < LANDMARKS.wordmarkStart ? flowerPx : wordPx).push(y * w + x);
    }
  }

  const wordCount = Math.min(wordPx.length, Math.round(total * 0.2));
  const flowerCount = Math.min(flowerPx.length, total - wordCount);
  const count = flowerCount + wordCount;

  const out: DrawingSample = {
    count,
    flat: new Float32Array(count * 3),
    sculpt: new Float32Array(count * 3),
    scatter: new Float32Array(count * 3),
    seed: new Float32Array(count),
    delay: new Float32Array(count),
    group: new Float32Array(count),
    shade: new Float32Array(count),
    paper,
  };

  // Partial Fisher–Yates: pick `n` distinct pixels from `pool`.
  const pick = (pool: number[], n: number) => {
    for (let i = 0; i < n; i++) {
      const j = i + Math.floor(Math.random() * (pool.length - i));
      const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return pool.slice(0, n);
  };

  const [budX, budY] = toWorld(LANDMARKS.bud.u, LANDMARKS.bud.v);
  const budR = LANDMARKS.bud.radius;
  let k = 0;

  const write = (px: number, isWord: boolean) => {
    const x = px % w;
    const y = Math.floor(px / w);
    const u = (x + Math.random()) / w;
    const v = (y + Math.random()) / h;
    const [X, Y] = toWorld(u, v);
    const i4 = px * 4;
    const lum = (0.2126 * data[i4] + 0.7152 * data[i4 + 1] + 0.0722 * data[i4 + 2]) / 255;
    const seed = Math.random();

    out.flat.set([X, Y, 0], k * 3);
    out.seed[k] = seed;
    out.shade[k] = Math.min(1, (0.5 - lum) / 0.4);
    out.group[k] = isWord ? 1 : 0;

    let Z = 0;
    if (!isWord) {
      if (u > 0.565) {
        // The bud: a real volume, its petals bulging toward the viewer.
        const d = Math.hypot(X - budX, Y - budY);
        Z = 0.2 + (d < budR ? Math.sqrt(budR * budR - d * d) * 0.95 : 0);
        if (v < LANDMARKS.bud.v - 0.12) Z += Math.sin((LANDMARKS.bud.v - 0.12 - v) * 9) * 0.12; // blade leaf curls
        if (v > LANDMARKS.bud.v + 0.1) Z *= 1 - Math.min(1, (v - LANDMARKS.bud.v - 0.1) / 0.14); // stem roots
      } else {
        // The bouquet opens in depth as it rises from its stem.
        const t = Math.max(0, (LANDMARKS.wordmarkStart - v) / 0.6);
        Z = -0.06 + t * (0.32 * Math.sin(X * 5 + 1.3) + 0.14 * Math.cos(Y * 7));
      }
      Z += (Math.random() - 0.5) * 0.025;
      out.delay[k] = (v / LANDMARKS.wordmarkStart) * 0.55 + seed * 0.45;
    } else {
      out.delay[k] = seed;
    }
    out.sculpt.set([X, Y, Z], k * 3);

    // Dispersion shell for the wordmark.
    const a = Math.random() * Math.PI * 2;
    const b = Math.acos(2 * Math.random() - 1);
    const r = 1.6 + Math.random() * 2.2;
    out.scatter.set([Math.sin(b) * Math.cos(a) * r, Math.cos(b) * r * 0.6, Math.sin(b) * Math.sin(a) * r], k * 3);
    k++;
  };

  for (const px of pick(flowerPx, flowerCount)) write(px, false);
  for (const px of pick(wordPx, wordCount)) write(px, true);
  return out;
}
