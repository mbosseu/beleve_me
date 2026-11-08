export type QualityTier = "high" | "mobile" | "low";

export interface Capabilities {
  tier: QualityTier;
  isMobile: boolean;
  reducedMotion: boolean;
  webgl: boolean;
  dpr: [number, number];
  shadowMapSize: number;
  dustCount: number;
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Detects device capabilities once, on the client. */
export function detectCapabilities(): Capabilities {
  const isMobile =
    window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 8;
  const lowPower = cores <= 4 || memory <= 4;

  const tier: QualityTier = lowPower ? "low" : isMobile ? "mobile" : "high";

  return {
    tier,
    isMobile,
    reducedMotion,
    webgl: hasWebGL(),
    dpr: tier === "high" ? [1, 2] : tier === "mobile" ? [1, 1.5] : [1, 1.25],
    shadowMapSize: tier === "high" ? 2048 : 1024,
    dustCount: reducedMotion ? 0 : tier === "high" ? 520 : tier === "mobile" ? 220 : 140,
  };
}
