import type { CameraKey } from "@/animation/CameraPath";

/**
 * Scene 01 spatial layout. Units are metres; the table top is at y = 0 and
 * the first drawing is centred on the origin.
 */

export const SHEET = { width: 0.6, height: 0.4 } as const;

/** Points of interest on the drawing (derived from the reference image). */
export const POI = {
  bud: [0.094, 0, -0.028] as [number, number, number],
  bouquet: [-0.042, 0, -0.052] as [number, number, number],
  wordmark: [0, 0, 0.092] as [number, number, number],
};

export const LAMP = {
  position: [0.04, 2.2, 0.0] as [number, number, number],
  angle: 0.37,
  penumbra: 0.85,
};

export const CAMERA_DESKTOP: CameraKey[] = [
  { at: 0.0, position: [0, 2.9, 3.6], target: [0, 0, 0.1] },
  { at: 0.2, position: [-1.55, 1.05, 1.95], target: [0, 0.02, 0] },
  { at: 0.42, position: [-0.58, 0.6, 0.66], target: [0, 0, -0.02] },
  { at: 0.64, position: [0.06, 0.7, 0.4], target: [0.05, 0, 0.075] },
  { at: 0.84, position: [0.165, 0.15, 0.1], target: POI.bud },
  { at: 1.0, position: [0.1, 0.022, -0.012], target: [0.094, 0, -0.034] },
];

/** Portrait framing: tighter subjects, more vertical arcs. */
export const CAMERA_MOBILE: CameraKey[] = [
  { at: 0.0, position: [0, 3.7, 3.3], target: [0, 0, 0.15] },
  { at: 0.2, position: [-1.25, 1.55, 2.2], target: [0, 0.02, 0] },
  { at: 0.42, position: [-0.42, 0.98, 0.78], target: [0.01, 0, -0.02] },
  { at: 0.64, position: [0.03, 0.88, 0.27], target: [0.03, 0, -0.03] },
  { at: 0.84, position: [0.14, 0.2, 0.12], target: POI.bud },
  { at: 1.0, position: [0.1, 0.022, -0.012], target: [0.094, 0, -0.034] },
];
