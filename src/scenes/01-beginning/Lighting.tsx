"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { progress, scene } from "@/experience/progress";
import { LAMP } from "./layout";

/**
 * Lighting rig: one desk-lamp key light from above (the "idea" lighting up),
 * a cool low rim to carve the table edge out of the dark, and a raking light
 * that only rises during the macro shots to reveal pencil strokes and paper
 * grain.
 */
export default function Lighting({ shadowMapSize }: { shadowMapSize: number }) {
  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.SpotLight>(null);
  const rake = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sceneRoot = useThree((s) => s.scene);

  useEffect(() => {
    const k = key.current!;
    k.target.position.set(LAMP.position[0], 0, LAMP.position[2]);
    sceneRoot.add(k.target);
    const r = rim.current!;
    r.target.position.set(0, 0, 0);
    sceneRoot.add(r.target);
    const rk = rake.current!;
    rk.target.position.set(0.05, 0, -0.02);
    sceneRoot.add(rk.target);
    return () => {
      sceneRoot.remove(k.target, r.target, rk.target);
    };
  }, [sceneRoot]);

  useFrame(() => {
    const l = scene.light;
    const p = progress.beginning;
    if (key.current) key.current.intensity = 20 * l;
    if (rim.current) rim.current.intensity = 6 * l;
    if (hemi.current) hemi.current.intensity = 0.015 + 0.035 * l;
    if (rake.current) rake.current.intensity = l * (0.15 + 1.1 * THREE.MathUtils.smoothstep(p, 0.55, 0.85));
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#c9c4bb", "#050505", 0.05]} />
      <spotLight
        ref={key}
        position={LAMP.position}
        angle={LAMP.angle}
        penumbra={LAMP.penumbra}
        decay={2}
        color="#fff1dc"
        intensity={0}
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.00008}
        shadow-normalBias={0.012}
        shadow-camera-near={0.8}
        shadow-camera-far={3.2}
        shadow-radius={4}
      />
      <spotLight
        ref={rim}
        position={[-0.6, 1.1, -3.4]}
        angle={0.5}
        penumbra={1}
        decay={2}
        color="#d9dde3"
        intensity={0}
      />
      <directionalLight ref={rake} position={[-2.6, 0.5, -0.8]} color="#f4ead8" intensity={0} />
    </>
  );
}
