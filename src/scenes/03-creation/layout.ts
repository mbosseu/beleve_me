import * as THREE from "three";
import type { CameraKey } from "@/animation/CameraPath";
import { progress } from "@/experience/progress";

/**
 * Scene 03 — the atelier. Units are metres, the cutting table top is y = 0.
 * Five stations run left → right along the table: the idea becomes a garment.
 */
export const TABLE = { width: 4.4, depth: 1.5 } as const;
export const MAT_Y = 0.003;

export const STATIONS = {
  sketch: [-1.6, 0, -0.25] as [number, number, number],
  fabric: [-0.75, 0, 0] as [number, number, number],
  volume: [0.2, 0, 0.02] as [number, number, number],
  embroidery: [1.02, 0, 0.05] as [number, number, number],
  hardware: [1.78, 0, 0.08] as [number, number, number],
};

export const WALL_Z = -1.15;

export const LAMPS: { x: number; z: number }[] = [
  { x: -1.35, z: -0.1 },
  { x: 0.2, z: 0.0 },
  { x: 1.45, z: 0.0 },
];
export const LAMP_Y = 1.65;

/** Progress windows of each step of the choreography. */
export const TIMING = {
  lamps: [0.0, 0.12] as const,
  sketches: [0.04, 0.14] as const,
  unroll: [0.22, 0.38] as const,
  inflate: [0.38, 0.53] as const,
  stitch: [0.54, 0.71] as const,
  zip: [0.71, 0.83] as const,
};

/** Smoothstep of the chapter progress inside a window. */
export const step = (w: readonly [number, number]) =>
  THREE.MathUtils.smoothstep(progress.creation, w[0], w[1]);

export const CAMERA_DESKTOP: CameraKey[] = [
  { at: 0.0, position: [-2.7, 1.55, 2.7], target: [-0.6, 0.3, -0.2] },
  { at: 0.14, position: [-1.55, 0.95, 0.85], target: [-1.6, 0.72, -1.0] },
  { at: 0.3, position: [-0.95, 0.8, 1.05], target: [-0.72, 0.0, -0.05] },
  { at: 0.46, position: [0.2, 0.62, 0.78], target: [0.2, 0.0, 0.0] },
  { at: 0.62, position: [1.02, 0.52, 0.42], target: [1.02, 0.0, 0.02] },
  { at: 0.77, position: [1.74, 0.24, 0.34], target: [1.8, 0.0, 0.04] },
  { at: 0.9, position: [0.3, 2.2, 3.5], target: [0.1, 0.1, -0.2] },
  { at: 1.0, position: [0.2, 2.6, 4.2], target: [0.1, 0.1, -0.2] },
];

/** Portrait framing: same stations, further back and higher. */
export const CAMERA_MOBILE: CameraKey[] = [
  { at: 0.0, position: [-3.0, 2.4, 4.4], target: [-0.6, 0.3, -0.2] },
  { at: 0.14, position: [-1.6, 1.05, 1.55], target: [-1.6, 0.72, -1.0] },
  { at: 0.3, position: [-0.95, 1.25, 1.35], target: [-0.72, 0.0, -0.05] },
  { at: 0.46, position: [0.2, 1.05, 1.05], target: [0.2, 0.0, 0.0] },
  { at: 0.62, position: [1.02, 0.85, 0.6], target: [1.02, 0.0, 0.02] },
  { at: 0.77, position: [1.78, 0.6, 0.65], target: [1.78, 0.0, 0.06] },
  { at: 0.9, position: [0.3, 3.6, 5.6], target: [0.1, 0.1, -0.2] },
  { at: 1.0, position: [0.2, 4.2, 6.6], target: [0.1, 0.1, -0.2] },
];
