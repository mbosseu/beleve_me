"use client";

import { Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import * as THREE from "three";
import { chapters } from "./chapters";
import { isRenderIdle } from "./progress";
import { useExperience } from "./store";

/**
 * Takes over rendering (a positive-priority useFrame disables R3F's own
 * render): the scene graph keeps updating every frame, but nothing is drawn
 * while the canvas is fully covered by a transition — and it can never get
 * stuck paused, unlike toggling the frameloop.
 */
function RenderGate() {
  useFrame((state) => {
    if (process.env.NODE_ENV !== "production") {
      const w = window as unknown as { __bm?: { frames?: number } };
      if (w.__bm) w.__bm.frames = (w.__bm.frames ?? 0) + 1;
    }
    if (!isRenderIdle()) state.gl.render(state.scene, state.camera);
  }, 1);
  return null;
}

/** The single fixed WebGL canvas. Every live chapter's scene is lazy-loaded into it. */
export default function Experience() {
  const caps = useExperience((s) => s.caps);
  if (!caps) return null;

  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      <Canvas
        shadows="soft"
        dpr={caps.dpr}
        gl={{ antialias: caps.tier !== "low", powerPreference: "high-performance" }}
        camera={{ fov: 34, near: 0.008, far: 40, position: [0, 2.9, 3.6] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Suspense fallback={null}>
          {chapters
            .filter((c) => c.status === "live" && c.Scene)
            .map(({ id, Scene }) =>
              Scene ? (
                // Each chapter loads on its own: a late chapter never blanks an earlier one.
                <Suspense key={id} fallback={null}>
                  <Scene />
                </Suspense>
              ) : null,
            )}
          <Preload all />
        </Suspense>
        <RenderGate />
        <AdaptiveDpr pixelated={false} />
      </Canvas>
    </div>
  );
}
