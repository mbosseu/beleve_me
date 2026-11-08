import type { CameraKey } from "@/animation/CameraPath";

/**
 * Scene 02 world: the original illustration, scaled up to 3 × 2 units and
 * centred on the origin (image u/v → world x/y).
 */
export const DRAWING = { width: 3, height: 2 } as const;

export const toWorld = (u: number, v: number): [number, number] => [
  (u - 0.5) * DRAWING.width,
  (0.5 - v) * DRAWING.height,
];

/** Image-space landmarks measured on the reference illustration. */
export const LANDMARKS = {
  bud: { u: 0.657, v: 0.43, radius: 0.215 },
  /** Below this v, pixels belong to the BELIEVE ME / BM wordmark. */
  wordmarkStart: 0.665,
};

const [budX, budY] = toWorld(LANDMARKS.bud.u, LANDMARKS.bud.v);
export const BUD: [number, number, number] = [budX, budY, 0];

/** Progress windows of the choreography (see InkDrawing). */
export const TIMING = {
  crossfade: [0.03, 0.11] as const, // printed sheet → ink particles
  lift: [0.08, 0.38] as const, // strokes leave the paper
  dark: [0.36, 0.5] as const, // paper turns into night, ink into thread
  assemble: [0.72, 0.88] as const, // the wordmark gathers
};

export const CAMERA_DESKTOP: CameraKey[] = [
  { at: 0.0, position: [budX, budY, 0.95], target: [budX, budY, 0] },
  { at: 0.12, position: [0.3, 0.1, 2.5], target: [0.1, 0.12, 0] },
  { at: 0.32, position: [1.75, 0.75, 2.35], target: [0.0, 0.2, 0.05] },
  { at: 0.5, position: [-0.4, 0.45, 1.05], target: [0.35, 0.2, 0] },
  { at: 0.66, position: [1.2, 0.38, 1.3], target: [budX - 0.05, budY, 0.15] },
  { at: 0.84, position: [0, -0.3, 4.3], target: [0, -0.32, 0] },
  { at: 1.0, position: [0, -0.3, 5.4], target: [0, -0.34, 0] },
];

/** Same story, pulled back for a portrait frame. */
export const CAMERA_MOBILE: CameraKey[] = [
  { at: 0.0, position: [budX, budY, 1.25], target: [budX, budY, 0] },
  { at: 0.12, position: [0.25, 0.1, 4.6], target: [0.1, 0.12, 0] },
  { at: 0.32, position: [2.0, 0.85, 2.8], target: [0.0, 0.2, 0.05] },
  { at: 0.5, position: [-0.3, 0.5, 1.7], target: [0.35, 0.2, 0] },
  { at: 0.66, position: [1.55, 0.45, 1.95], target: [budX - 0.05, budY, 0.15] },
  { at: 0.84, position: [0, -0.45, 6.0], target: [0, -0.5, 0] },
  { at: 1.0, position: [0, -0.45, 7.0], target: [0, -0.52, 0] },
];
