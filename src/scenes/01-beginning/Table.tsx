"use client";

import { useEffect, useMemo } from "react";
import { createWoodTextures } from "./proceduralTextures";

const LEG = { s: 0.07, h: 0.74 };

export default function Table({
  textureSize = 2048,
  width = 3.2,
  depth = 1.6,
}: {
  textureSize?: number;
  width?: number;
  depth?: number;
}) {
  const TOP = { w: width, d: depth, t: 0.05 };
  const wood = useMemo(() => createWoodTextures(textureSize), [textureSize]);
  useEffect(() => () => {
    wood.map.dispose();
    wood.roughnessMap.dispose();
  }, [wood]);

  const legX = TOP.w / 2 - 0.14;
  const legZ = TOP.d / 2 - 0.12;

  return (
    <group>
      {/* Top */}
      <mesh position={[0, -TOP.t / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[TOP.w, TOP.t, TOP.d]} />
        <meshStandardMaterial
          map={wood.map}
          roughnessMap={wood.roughnessMap}
          roughness={0.62}
          metalness={0}
        />
      </mesh>

      {/* Legs */}
      {[
        [legX, legZ],
        [-legX, legZ],
        [legX, -legZ],
        [-legX, -legZ],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, -TOP.t - LEG.h / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[LEG.s, LEG.h, LEG.s]} />
          <meshStandardMaterial color="#120f0c" roughness={0.7} />
        </mesh>
      ))}

      {/* Concrete floor, almost swallowed by the dark */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -TOP.t - LEG.h, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.96} />
      </mesh>
    </group>
  );
}
