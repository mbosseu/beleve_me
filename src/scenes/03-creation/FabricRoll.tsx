"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MAT_Y, STATIONS, TIMING, step } from "./layout";
import { createWeaveTexture } from "./textures";

const WIDTH = 0.72; // across x
const LENGTH = 1.1; // fabric length
const THICK = 0.0028;
const CORE = 0.022;
const START_Z = -0.62; // where the fabric is anchored

/**
 * Station II — the material. A bolt of black technical twill unrolls toward
 * the viewer. The cloth is a real mesh wrapped on an Archimedean spiral.
 */
export default function FabricRoll() {
  const [cx] = STATIONS.fabric;
  const weave = useMemo(() => createWeaveTexture(256, 18), []);
  useEffect(() => () => weave.dispose(), [weave]);

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(WIDTH, LENGTH, 4, 260);
    return g;
  }, []);
  // Rest coordinates: u across, s along the length (0 = anchored end).
  const rest = useMemo(() => {
    const pos = geometry.attributes.position;
    const arr = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      arr[i * 2] = pos.getX(i);
      arr[i * 2 + 1] = LENGTH / 2 - pos.getY(i);
    }
    return arr;
  }, [geometry]);

  const state = useMemo(() => ({ last: -1 }), []);

  useFrame(() => {
    const t = step(TIMING.unroll);
    const unrolled = 0.03 + t * (LENGTH - 0.12);
    if (Math.abs(unrolled - state.last) < 1e-5) return;
    state.last = unrolled;

    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const remaining = LENGTH - unrolled;
    // Outer radius of the roll, from the cloth still wound on it.
    const outer = Math.sqrt(CORE * CORE + (remaining * THICK) / Math.PI);
    const y0 = MAT_Y + 0.001;
    const centreZ = START_Z + unrolled;
    for (let i = 0; i < pos.count; i++) {
      const u = rest[i * 2];
      const s = rest[i * 2 + 1];
      if (s <= unrolled) {
        // Flat, with a gentle ripple where it left the roll.
        const ripple = Math.sin(s * 22 + u * 3) * 0.0012 * Math.min(1, (unrolled - s) * 6);
        pos.setXYZ(i, u, y0 + Math.abs(ripple), START_Z + s);
      } else {
        // Wound: radius shrinks as we go inward along the spiral.
        const d = s - unrolled;
        const r = Math.sqrt(Math.max(CORE * CORE, outer * outer - (d * THICK) / Math.PI));
        const theta = d / ((r + outer) / 2);
        pos.setXYZ(i, u, y0 + outer - Math.cos(theta) * r, centreZ + Math.sin(theta) * r);
      }
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
  });

  const coreZ = () => START_Z;

  return (
    <group position={[cx, 0, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#121212"
          roughness={0.62}
          bumpMap={weave}
          bumpScale={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Cardboard core ends, visible at both sides of the bolt */}
      <RollCore start={coreZ()} />
      {/* Swatches waiting to be chosen */}
      {[
        { c: "#0b0b0b", r: 0.4, x: 0.5, z: -0.35, rot: 0.2 },
        { c: "#d9d9d9", r: 0.8, x: 0.52, z: -0.22, rot: -0.15 },
        { c: "#d8c9a9", r: 0.75, x: 0.47, z: -0.09, rot: 0.1 },
        { c: "#292929", r: 0.55, x: 0.55, z: 0.05, rot: -0.05 },
      ].map((sw, i) => (
        <mesh key={i} position={[sw.x, MAT_Y + 0.0015 + i * 0.0012, sw.z]} rotation={[-Math.PI / 2, 0, sw.rot]} castShadow receiveShadow>
          <planeGeometry args={[0.17, 0.12]} />
          <meshStandardMaterial color={sw.c} roughness={sw.r} bumpMap={weave} bumpScale={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/** Thin cardboard tube that travels with the roll. */
function RollCore({ start }: { start: number }) {
  const ref = useMemo(() => ({ mesh: null as THREE.Mesh | null }), []);
  useFrame(() => {
    const t = step(TIMING.unroll);
    const unrolled = 0.03 + t * (LENGTH - 0.12);
    const remaining = LENGTH - unrolled;
    const outer = Math.sqrt(CORE * CORE + (remaining * THICK) / Math.PI);
    if (ref.mesh) ref.mesh.position.set(0, MAT_Y + 0.001 + outer, start + unrolled);
  });
  return (
    <mesh ref={(m) => { ref.mesh = m; }} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[CORE, CORE, WIDTH + 0.03, 24, 1, true]} />
      <meshStandardMaterial color="#8f7a5c" roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}
