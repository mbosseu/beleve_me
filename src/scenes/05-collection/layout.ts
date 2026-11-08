import * as THREE from "three";
import type { CameraKey } from "@/animation/CameraPath";
import { products } from "@/data/products";
import { progress } from "@/experience/progress";

/** Showroom: one display per product, in catalogue order, along x. */
export const SPACING = 1.5;
export const PLINTH = { w: 0.78, h: 0.22, d: 0.52 };
export const WALL_Z = -1.3;

export const slotX = (index: number) => (index - (products.length - 1) / 2) * SPACING;
export const productX = (slug: string) => slotX(products.findIndex((p) => p.slug === slug));

export const step = (a: number, b: number) => THREE.MathUtils.smoothstep(progress.collection, a, b);

const HERO = productX("doudoune-signature");
const xs = products.map((_, i) => slotX(i));
const half = (xs[xs.length - 1] ?? 0) + SPACING / 2;

/** Camera: close on the hero (continuity with the studio), back to the room, along the displays, overview. */
function keys(mobile: boolean): CameraKey[] {
  const d = mobile ? 3.7 : 2.35;
  const over = mobile ? 11 : half * 1.9 + 1.2;
  const stops: CameraKey[] = xs.map((x, i) => ({
    at: 0.3 + (i / Math.max(1, xs.length - 1)) * 0.56,
    position: [x, 1.18, d],
    target: [x, 0.72, 0],
  }));
  return [
    { at: 0.0, position: [HERO, 0.95, mobile ? 2.2 : 1.35], target: [HERO, 0.72, 0] },
    { at: 0.18, position: [0, 1.7, over], target: [0, 0.7, 0] },
    ...stops,
    { at: 1.0, position: [0, 1.7, over], target: [0, 0.7, 0] },
  ];
}

export const CAMERA_DESKTOP = keys(false);
export const CAMERA_MOBILE = keys(true);

/** Shot used when a product is opened (the sheet sits right / bottom). */
export function focusShot(x: number, mobile: boolean, position: THREE.Vector3, target: THREE.Vector3) {
  if (mobile) {
    // The sheet covers the lower half: keep the piece in the upper half.
    position.set(x, 1.0, 4.8);
    target.set(x, 0.1, 0);
  } else {
    position.set(x + 0.5, 0.95, 2.45);
    target.set(x + 0.5, 0.66, 0);
  }
}
