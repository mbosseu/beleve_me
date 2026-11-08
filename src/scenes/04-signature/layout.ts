import * as THREE from "three";
import type { CameraKey } from "@/animation/CameraPath";
import { progress } from "@/experience/progress";

/** The piece floats at eye level above the studio floor (y = 0). */
export const PIECE_Y = 0.92;
const C = PIECE_Y + 0.34; // visual centre of the jacket

export const step = (a: number, b: number) => THREE.MathUtils.smoothstep(progress.signature, a, b);

/**
 * Turntable choreography (radians) — the seven views of the brief:
 * front, profile, back, embroidery, zip, fabric, finishings.
 */
export function pieceYaw(p: number) {
  const q = Math.PI / 2;
  const k = (a: number, b: number) => THREE.MathUtils.smoothstep(p, a, b);
  let yaw = 0;
  yaw += q * k(0.18, 0.27); // profile
  yaw += q * k(0.31, 0.4); // back
  yaw += Math.PI * k(0.57, 0.63); // front again, for the details and the free view
  return yaw;
}

export const CAMERA_DESKTOP: CameraKey[] = [
  { at: 0.0, position: [0, C + 0.12, 4.6], target: [0, C, 0] },
  { at: 0.12, position: [0, C + 0.03, 1.75], target: [0, C, 0] },
  { at: 0.27, position: [0, C + 0.03, 1.7], target: [0, C, 0] },
  { at: 0.42, position: [0, C + 0.03, 1.8], target: [0, C, 0] },
  { at: 0.52, position: [0, C + 0.05, 1.05], target: [0, C + 0.05, 0] },
  { at: 0.64, position: [0, C, 1.35], target: [0, C, 0] },
  { at: 0.73, position: [0, C, 1.35], target: [0, C, 0] },
  { at: 0.82, position: [0, C, 1.35], target: [0, C, 0] },
  { at: 0.92, position: [0, C + 0.05, 3.3], target: [0, C - 0.04, 0] },
  { at: 1.0, position: [0, C + 0.05, 3.35], target: [0, C - 0.04, 0] },
];

export const CAMERA_MOBILE: CameraKey[] = [
  { at: 0.0, position: [0, C + 0.15, 6.4], target: [0, C, 0] },
  { at: 0.12, position: [0, C + 0.03, 2.9], target: [0, C, 0] },
  { at: 0.27, position: [0, C + 0.03, 2.8], target: [0, C, 0] },
  { at: 0.42, position: [0, C + 0.03, 2.9], target: [0, C, 0] },
  { at: 0.52, position: [0, C + 0.05, 1.7], target: [0, C + 0.05, 0] },
  { at: 0.64, position: [0, C, 2.6], target: [0, C, 0] },
  { at: 0.73, position: [0, C, 2.6], target: [0, C, 0] },
  { at: 0.82, position: [0, C, 2.6], target: [0, C, 0] },
  { at: 0.92, position: [0, C + 0.05, 4.6], target: [0, C - 0.06, 0] },
  { at: 1.0, position: [0, C + 0.05, 4.65], target: [0, C - 0.06, 0] },
];
