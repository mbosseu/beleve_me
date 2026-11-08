"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { createThreadTexture } from "./proceduralTextures";

/** Graphite pencil, hexagonal lacquered body, resting on a flat face. */
export function Pencil(props: { position: [number, number, number]; rotationY: number }) {
  const R = 0.0043;
  const L = 0.15;
  return (
    <group position={props.position} rotation={[0, props.rotationY, 0]}>
      <group rotation={[0, 0, Math.PI / 2]}>
        {/* body */}
        <mesh castShadow receiveShadow rotation={[0, Math.PI / 6, 0]}>
          <cylinderGeometry args={[R, R, L, 6]} />
          <meshPhysicalMaterial color="#1c1c1c" roughness={0.38} clearcoat={0.7} clearcoatRoughness={0.25} />
        </mesh>
        {/* end band — embroidery beige */}
        <mesh castShadow position={[0, -L / 2 - 0.003, 0]} rotation={[0, Math.PI / 6, 0]}>
          <cylinderGeometry args={[R * 1.02, R * 1.02, 0.006, 6]} />
          <meshStandardMaterial color="#d8c9a9" roughness={0.55} metalness={0.2} />
        </mesh>
        {/* sharpened wood */}
        <mesh castShadow position={[0, L / 2 + 0.011, 0]} rotation={[0, Math.PI / 6, 0]}>
          <cylinderGeometry args={[0.0013, R, 0.022, 6]} />
          <meshStandardMaterial color="#c4a47a" roughness={0.85} />
        </mesh>
        {/* graphite */}
        <mesh castShadow position={[0, L / 2 + 0.0245, 0]}>
          <coneGeometry args={[0.0013, 0.005, 12]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.35} metalness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Spool of beige embroidery thread with a loose strand wandering toward the
 * drawing — the first hint that this sketch will become a garment.
 */
export function ThreadSpool(props: {
  position: [number, number, number];
  strandEnd?: [number, number, number];
  color?: string;
}) {
  const color = props.color ?? "#d8c9a9";
  const bump = useMemo(() => createThreadTexture(), []);
  useEffect(() => () => bump.dispose(), [bump]);

  const strand = useMemo(() => {
    const [sx, , sz] = props.position;
    if (!props.strandEnd) return null;
    const [ex, , ez] = props.strandEnd;
    const y = 0.0007;
    const pts = [
      new THREE.Vector3(sx + 0.013, 0.02, sz),
      new THREE.Vector3(sx + 0.03, y, sz + 0.01),
      new THREE.Vector3(sx + (ex - sx) * 0.35, y, sz + (ez - sz) * 0.2 + 0.05),
      new THREE.Vector3(sx + (ex - sx) * 0.62, y, sz + (ez - sz) * 0.65 - 0.03),
      new THREE.Vector3(ex, y + 0.0015, ez),
    ];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.00055, 6, false);
  }, [props.position, props.strandEnd]);

  return (
    <group>
      <group position={props.position}>
        {/* wooden core + flanges */}
        <mesh castShadow receiveShadow position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.04, 24]} />
          <meshStandardMaterial color="#8a6a48" roughness={0.7} />
        </mesh>
        {[0.002, 0.038].map((y) => (
          <mesh key={y} castShadow receiveShadow position={[0, y, 0]}>
            <cylinderGeometry args={[0.0165, 0.0165, 0.004, 32]} />
            <meshStandardMaterial color="#9a7752" roughness={0.65} />
          </mesh>
        ))}
        {/* wound thread */}
        <mesh castShadow receiveShadow position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.0138, 0.0138, 0.032, 48]} />
          <meshStandardMaterial
            color={color}
            roughness={0.62}
            bumpMap={bump}
            bumpScale={1.5}
          />
        </mesh>
      </group>
      {strand && (
        <mesh geometry={strand} castShadow>
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      )}
    </group>
  );
}

/** A fine steel needle. */
export function Needle(props: { position: [number, number, number]; rotationY: number }) {
  return (
    <group position={props.position} rotation={[0, props.rotationY, 0]}>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.00045, 0.0001, 0.045, 8]} />
        <meshStandardMaterial color="#cfcfcf" roughness={0.18} metalness={1} />
      </mesh>
    </group>
  );
}
