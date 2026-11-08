"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MAT_Y, STATIONS, TIMING, step } from "./layout";
import { createWeaveTexture } from "./textures";

const W = 0.64;
const D = 0.48;
/** Five horizontal baffles — the construction of the BELIEVE ME doudoune. */
const ROWS = 5;
const LOFT = 0.034;

/**
 * Station III — volume. A flat nylon panel fills with down, row by row,
 * until it holds the five quilted baffles of the signature piece.
 */
export default function QuiltedPanel() {
  const [cx, , cz] = STATIONS.volume;
  const weave = useMemo(() => createWeaveTexture(256, 10), []);
  useEffect(() => () => weave.dispose(), [weave]);

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(W, D, 90, 150);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);
  const state = useMemo(() => ({ last: -1 }), []);

  useFrame(() => {
    const t = step(TIMING.inflate);
    if (Math.abs(t - state.last) < 1e-4) return;
    state.last = t;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const rowD = D / ROWS;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const z = base[i * 3 + 2];
      const row = Math.min(ROWS - 1, Math.floor((z + D / 2) / rowD));
      // Rows fill from the top of the panel down, each slightly after the last.
      const rowT = THREE.MathUtils.clamp((t * 1.6 - (row / ROWS) * 0.6), 0, 1);
      const eased = 1 - Math.pow(1 - rowT, 3);
      const f = ((z + D / 2) % rowD) / rowD;
      const edge = THREE.MathUtils.smoothstep(W / 2 - Math.abs(x), 0, 0.05);
      const puff = Math.pow(Math.sin(Math.PI * f), 0.62) * edge;
      // As it fills, each baffle pulls in a little at the seams.
      const pinch = 1 - 0.035 * eased * (1 - Math.pow(Math.sin(Math.PI * f), 2));
      pos.setXYZ(i, x * pinch, MAT_Y + 0.002 + puff * LOFT * eased, z);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <group position={[cx, 0, cz]} rotation={[0, -0.06, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#0d0d0d"
          roughness={0.5}
          clearcoat={0.12}
          clearcoatRoughness={0.6}
          sheen={0.6}
          sheenColor="#3a3a3a"
          sheenRoughness={0.5}
          bumpMap={weave}
          bumpScale={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

