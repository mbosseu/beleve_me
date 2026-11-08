/**
 * Frame-level shared values. Mutated by ScrollTrigger / GSAP and read inside
 * useFrame or rAF loops — never through React state, so scrolling never
 * triggers a React re-render.
 */
export const progress: Record<string, number> = {
  beginning: 0,
  inspiration: 0,
  creation: 0,
  signature: 0,
  collection: 0,
  message: 0,
};

/** Live chapters in story order — the 3D layer only knows these. */
export const LIVE_ORDER = ["beginning", "inspiration", "creation", "signature", "collection", "message"] as const;

export const scene = {
  /** 0 → 1 : the desk lamp switching on (driven by the intro). */
  light: 0,
  /** Normalised pointer position, -1 → 1. */
  pointerX: 0,
  pointerY: 0,
  /** Timestamp of the last cut-jump; smoothed values snap instead of sweeping. */
  jumpAt: -1,
};

/** How fast cameras and narration catch up with the scroll (per second). */
export const DAMPING = 4.6;

/** True right after a cut-jump: followers should snap to the new position. */
export const justJumped = () => scene.jumpAt > 0 && performance.now() - scene.jumpAt < 450;

/** The chapter currently owning the camera: the last one that has started. */
export function activeChapterId(): string {
  let active: string = LIVE_ORDER[0];
  for (const id of LIVE_ORDER) if ((progress[id] ?? 0) > 0) active = id;
  return active;
}

/** True when the active chapter is finished and fully covered by the UI. */
export function isRenderIdle(): boolean {
  const id = activeChapterId();
  // The last chapter stays alive behind the closing page.
  if (id === LIVE_ORDER[LIVE_ORDER.length - 1]) return false;
  const p = progress[id] ?? 0;
  // Between chapters the white-out covers the canvas; after the last one the
  // page itself does.
  return p > 0.995;
}

// Dev-only inspection hook.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __bm: unknown }).__bm = { progress, activeChapterId };
}
