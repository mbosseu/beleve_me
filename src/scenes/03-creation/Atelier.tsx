"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Table from "@/scenes/01-beginning/Table";
import { LAMP_Y, LAMPS, MAT_Y, TABLE, TIMING, WALL_Z, step } from "./layout";
import { createCuttingMat } from "./textures";

/** One industrial pendant: cable, matte black shade, warm bulb, spotlight. */
function Pendant({ x, z, index, shadows, shadowMapSize }: {
  x: number;
  z: number;
  index: number;
  shadows: boolean;
  shadowMapSize: number;
}) {
  const light = useRef<THREE.SpotLight>(null);
  const bulb = useRef<THREE.MeshStandardMaterial>(null);
  const sceneRoot = useThree((s) => s.scene);

  useEffect(() => {
    const l = light.current!;
    l.target.position.set(x, 0, z);
    sceneRoot.add(l.target);
    return () => {
      sceneRoot.remove(l.target);
    };
  }, [sceneRoot, x, z]);

  useFrame(() => {
    // Lamps come on one after the other, left to right.
    const span = (TIMING.lamps[1] - TIMING.lamps[0]) / 3;
    const a = TIMING.lamps[0] + index * span;
    const on = step([a, a + span * 1.4]);
    if (light.current) light.current.intensity = 16 * on;
    if (bulb.current) bulb.current.emissiveIntensity = 3.2 * on;
  });

  return (
    <group position={[x, LAMP_Y, z]}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 1.8, 6]} />
        <meshStandardMaterial color="#111" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <coneGeometry args={[0.16, 0.18, 40, 1, true]} />
        <meshStandardMaterial color="#141414" roughness={0.45} metalness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.0, 0]}>
        <sphereGeometry args={[0.035, 20, 12]} />
        <meshStandardMaterial ref={bulb} color="#fff6e6" emissive="#ffe2b0" emissiveIntensity={0} />
      </mesh>
      <spotLight
        ref={light}
        position={[0, -0.04, 0]}
        angle={0.62}
        penumbra={0.9}
        decay={2}
        color="#fff0d8"
        intensity={0}
        castShadow={shadows}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.01}
        shadow-camera-near={0.3}
        shadow-camera-far={3}
      />
    </group>
  );
}

/**
 * The atelier shell: a long cutting table with its mat, a dark plaster wall,
 * a felt pin board, and three pendants that wake the room one by one.
 */
export default function Atelier({ high, shadowMapSize }: { high: boolean; shadowMapSize: number }) {
  const mat = useMemo(() => createCuttingMat(TABLE.width - 0.5, TABLE.depth - 0.3, high ? 512 : 300), [high]);
  useEffect(() => () => mat.dispose(), [mat]);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const boardLight = useRef<THREE.SpotLight>(null);
  const sceneRoot = useThree((s) => s.scene);

  useEffect(() => {
    const l = boardLight.current!;
    l.target.position.set(-1.6, 0.78, WALL_Z);
    sceneRoot.add(l.target);
    return () => {
      sceneRoot.remove(l.target);
    };
  }, [sceneRoot]);

  useFrame(() => {
    const on = step(TIMING.lamps);
    if (hemi.current) hemi.current.intensity = 0.02 + 0.06 * on;
    // Soft picture light that only rises when the sketches go up.
    if (boardLight.current) boardLight.current.intensity = 7 * step(TIMING.sketches);
  });

  return (
    <group>
      <hemisphereLight ref={hemi} args={["#cfc8bc", "#060606", 0.02]} />
      <spotLight
        ref={boardLight}
        position={[-1.6, 2.0, 0.35]}
        angle={0.42}
        penumbra={1}
        decay={2}
        color="#fff1dc"
        intensity={0}
      />
      {LAMPS.map((l, i) => (
        <Pendant
          key={i}
          index={i}
          x={l.x}
          z={l.z}
          shadows={high || i === 1}
          shadowMapSize={shadowMapSize}
        />
      ))}

      <Table width={TABLE.width} depth={TABLE.depth} textureSize={high ? 2048 : 1024} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, MAT_Y - 0.002, 0.02]} receiveShadow>
        <planeGeometry args={[TABLE.width - 0.5, TABLE.depth - 0.3]} />
        <meshStandardMaterial map={mat} roughness={0.85} />
      </mesh>

      {/* Wall + pin board */}
      <mesh position={[0, 1.2, WALL_Z]} receiveShadow>
        <planeGeometry args={[12, 5]} />
        <meshStandardMaterial color="#151413" roughness={0.97} />
      </mesh>
      <mesh position={[-1.6, 0.78, WALL_Z + 0.02]} receiveShadow castShadow>
        <boxGeometry args={[1.5, 0.95, 0.025]} />
        <meshStandardMaterial color="#1f1d1b" roughness={1} />
      </mesh>
    </group>
  );
}
