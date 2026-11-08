"use client";

import { Suspense, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor, Preload } from "@react-three/drei";
import * as THREE from "three";
import { chapters } from "./chapters";
import { activeChapterId, isRenderIdle, LIVE_ORDER, progress, scene } from "./progress";
import { useExperience } from "./store";

/**
 * Takes over rendering (a positive-priority useFrame disables R3F's own
 * render): the scene graph keeps updating every frame, but nothing is drawn
 * while the canvas is fully covered by a transition.
 *
 * Shadows are expensive and only change when objects move — which here only
 * happens when the scroll (or the lamp) changes. So shadow maps are redrawn
 * on those frames only, not 60 times a second.
 */
function RenderGate() {
  const last = useState(() => ({ key: "", settle: 0, compiled: false }))[0];
  useFrame((state) => {
    // Once the visitor enters, compile every chapter's shaders up front, each
    // with its own lights — no freeze the first time a chapter appears.
    if (!last.compiled && useExperience.getState().entered) {
      last.compiled = true;
      const all: THREE.Object3D[] = [];
      state.scene.traverse((o) => {
        if (o.userData.chapterRoot) all.push(o);
      });
      const before = all.map((r) => r.visible);
      for (const root of all) {
        all.forEach((r) => (r.visible = r === root));
        // Same fog / environment as when the chapter plays.
        (root.userData.applyWorld as ((s: THREE.Scene) => void) | undefined)?.(state.scene);
        state.gl.compile(state.scene, state.camera);
      }
      // Upload every texture to the GPU now rather than on first sight.
      state.scene.traverse((o) => {
        const mats = (o as THREE.Mesh).material;
        if (!mats) return;
        for (const m of Array.isArray(mats) ? mats : [mats]) {
          for (const v of Object.values(m as unknown as Record<string, unknown>)) {
            if (v instanceof THREE.Texture) state.gl.initTexture(v);
          }
        }
      });
      all.forEach((r, i) => (r.visible = before[i]));
    }
    if (process.env.NODE_ENV !== "production") {
      const w = window as unknown as { __bm?: { frames?: number } };
      if (w.__bm) w.__bm.frames = (w.__bm.frames ?? 0) + 1;
    }
    const key =
      activeChapterId() +
      LIVE_ORDER.map((id) => (progress[id] ?? 0).toFixed(4)).join() +
      scene.light.toFixed(3);
    if (key !== last.key) {
      last.key = key;
      last.settle = 30; // keep updating while smoothed animations catch up
    }
    if (last.settle > 0) {
      last.settle--;
      state.gl.shadowMap.needsUpdate = true;
    }
    if (!isRenderIdle()) state.gl.render(state.scene, state.camera);
  }, 1);
  return null;
}

/** The single fixed WebGL canvas. Every live chapter's scene is lazy-loaded into it. */
export default function Experience() {
  const caps = useExperience((s) => s.caps);
  // Resolution adapts to the device: it steps down when frames drop.
  const [dpr, setDpr] = useState<number | null>(null);
  if (!caps) return null;
  const max = caps.dpr[1];
  const current = dpr ?? max;

  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      <Canvas
        shadows="soft"
        dpr={current}
        gl={{ antialias: caps.tier === "high", powerPreference: "high-performance" }}
        camera={{ fov: 34, near: 0.008, far: 40, position: [0, 2.9, 3.6] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.shadowMap.autoUpdate = false;
          gl.shadowMap.needsUpdate = true;
        }}
      >
        <PerformanceMonitor
          bounds={() => [40, 58]}
          flipflops={4}
          onDecline={() => setDpr((d) => Math.max(0.65, +((d ?? max) - 0.2).toFixed(2)))}
          onIncline={() => setDpr((d) => Math.min(max, +((d ?? max) + 0.15).toFixed(2)))}
        />
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
      </Canvas>
    </div>
  );
}
