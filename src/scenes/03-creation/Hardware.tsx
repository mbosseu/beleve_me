"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ThreadSpool } from "@/scenes/01-beginning/Props";
import { MAT_Y, STATIONS, TIMING, step } from "./layout";

const TEETH = 64;
const LEN = 0.46;
const PITCH = LEN / TEETH;
const OPEN_GAP = 0.024;

const metal = () => new THREE.MeshStandardMaterial({ color: "#cfcfcf", metalness: 1, roughness: 0.24 });

/**
 * Station V — finishings. A metal zip closes on its own, tooth by tooth,
 * among snaps, spools and a tailor's tape.
 */
export default function Hardware() {
  const [cx, , cz] = STATIONS.hardware;
  const teethMat = useMemo(metal, []);
  const teethGeo = useMemo(() => new THREE.BoxGeometry(PITCH * 0.82, 0.0028, 0.0075), []);
  const left = useRef<THREE.InstancedMesh>(null);
  const right = useRef<THREE.InstancedMesh>(null);
  const tapeL = useRef<THREE.Group>(null);
  const tapeR = useRef<THREE.Group>(null);
  const slider = useRef<THREE.Group>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => () => {
    teethGeo.dispose();
    teethMat.dispose();
  }, [teethGeo, teethMat]);

  const y = MAT_Y + 0.0025;
  const x0 = -LEN / 2;

  useFrame(() => {
    const t = step(TIMING.zip);
    const sx = x0 + 0.02 + t * (LEN - 0.03);
    const place = (mesh: THREE.InstancedMesh | null, side: 1 | -1) => {
      if (!mesh) return;
      for (let i = 0; i < TEETH; i++) {
        const x = x0 + (i + (side > 0 ? 0 : 0.5)) * PITCH;
        // Behind the slider the teeth interlock; ahead of it the tapes splay.
        const ahead = THREE.MathUtils.smoothstep(x - sx, 0, 0.12);
        const z = side * (0.0028 + ahead * OPEN_GAP);
        tmp.position.set(x, y, z);
        tmp.rotation.set(0, side * ahead * 0.12, 0);
        tmp.updateMatrix();
        mesh.setMatrixAt(i, tmp.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    place(left.current, 1);
    place(right.current, -1);
    if (slider.current) slider.current.position.set(sx, y + 0.002, 0);
    const splay = (1 - t) * 0.6;
    if (tapeL.current) tapeL.current.position.z = 0.012 + OPEN_GAP * splay;
    if (tapeR.current) tapeR.current.position.z = -0.012 - OPEN_GAP * splay;
  });

  const tape = useMemo(() => {
    const pts = Array.from({ length: 40 }, (_, i) => {
      const k = i / 39;
      return new THREE.Vector3(-0.12 + k * 0.42, MAT_Y + 0.0012, 0.24 + Math.sin(k * 5.5) * 0.05 - k * 0.06);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.007, 4, false);
  }, []);

  return (
    <group position={[cx, 0, cz]} rotation={[0, -0.18, 0]}>
      {/* Zip tapes */}
      {[tapeL, tapeR].map((ref, i) => (
        <group key={i} ref={ref}>
          <mesh position={[0, MAT_Y + 0.0011, 0]} receiveShadow castShadow>
            <boxGeometry args={[LEN + 0.04, 0.0012, 0.018]} />
            <meshStandardMaterial color="#121212" roughness={0.8} />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={left} args={[teethGeo, teethMat, TEETH]} castShadow />
      <instancedMesh ref={right} args={[teethGeo, teethMat, TEETH]} castShadow />
      {/* Slider + pull tab */}
      <group ref={slider}>
        <mesh castShadow material={teethMat}>
          <boxGeometry args={[0.024, 0.006, 0.018]} />
        </mesh>
        <mesh castShadow material={teethMat} position={[0.024, -0.0005, 0]}>
          <boxGeometry args={[0.03, 0.0018, 0.011]} />
        </mesh>
      </group>

      {/* Snaps */}
      {[
        [0.06, -0.14],
        [0.11, -0.16],
        [0.16, -0.13],
      ].map(([x, z], i) => (
        <group key={i} position={[x, MAT_Y + 0.003, z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow material={teethMat}>
            <torusGeometry args={[0.009, 0.0028, 12, 32]} />
          </mesh>
          <mesh position={[0, 0.002, 0]} castShadow material={teethMat}>
            <cylinderGeometry args={[0.005, 0.006, 0.004, 20]} />
          </mesh>
        </group>
      ))}

      {/* Tailor's tape, beige */}
      <mesh geometry={tape} scale={[1, 0.18, 1]} castShadow receiveShadow>
        <meshStandardMaterial color="#d8c9a9" roughness={0.7} />
      </mesh>

      <ThreadSpool position={[-0.27, MAT_Y, -0.12]} />
      <ThreadSpool position={[-0.22, MAT_Y, -0.19]} color="#141414" />
      <ThreadSpool position={[-0.31, MAT_Y, -0.22]} color="#d9d9d9" />
    </group>
  );
}
