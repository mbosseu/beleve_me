"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PIECE_Y, step } from "./layout";

/**
 * A warm off-white photo studio: seamless floor fading into the backdrop,
 * a large soft key, a fill, two rims to carve the black silhouette.
 * The lights snap on like strobes being armed.
 */
export default function Studio({ shadowMapSize }: { shadowMapSize: number }) {
  const key = useRef<THREE.SpotLight>(null);
  const fill = useRef<THREE.SpotLight>(null);
  const rimL = useRef<THREE.SpotLight>(null);
  const rimR = useRef<THREE.SpotLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sceneRoot = useThree((s) => s.scene);

  useEffect(() => {
    const lights = [key, fill, rimL, rimR].map((r) => r.current!);
    lights.forEach((l) => {
      l.target.position.set(0, PIECE_Y + 0.3, 0);
      sceneRoot.add(l.target);
    });
    return () => lights.forEach((l) => sceneRoot.remove(l.target));
  }, [sceneRoot]);

  useFrame(() => {
    const a = step(0.0, 0.025);
    const b = step(0.02, 0.05);
    const c = step(0.04, 0.08);
    if (key.current) key.current.intensity = 46 * a;
    if (fill.current) fill.current.intensity = 14 * b;
    if (rimL.current) rimL.current.intensity = 30 * c;
    if (rimR.current) rimR.current.intensity = 30 * c;
    if (hemi.current) hemi.current.intensity = 0.5 * b;
  });

  return (
    <group>
      <hemisphereLight ref={hemi} args={["#ffffff", "#bdb8ae", 0]} />
      <spotLight
        ref={key}
        position={[-1.6, 2.9, 2.4]}
        angle={0.55}
        penumbra={1}
        decay={2}
        color="#fff8ee"
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
        shadow-radius={8}
        shadow-camera-near={1}
        shadow-camera-far={7}
      />
      <spotLight ref={fill} position={[2.2, 1.6, 2.2]} angle={0.7} penumbra={1} decay={2} color="#f1efea" />
      <spotLight ref={rimL} position={[-1.7, 2.1, -1.8]} angle={0.5} penumbra={1} decay={2} color="#ffffff" />
      <spotLight ref={rimR} position={[1.7, 2.1, -1.8]} angle={0.5} penumbra={1} decay={2} color="#ffffff" />

      {/* Seamless floor: same tone as the fog/background, so it has no horizon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[14, 64]} />
        <meshStandardMaterial color="#e6e2db" roughness={0.95} />
      </mesh>
    </group>
  );
}
