"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Paper from "@/scenes/01-beginning/Paper";
import { Pencil } from "@/scenes/01-beginning/Props";
import { MAT_Y, STATIONS, TIMING, WALL_Z, step } from "./layout";

interface Sheet {
  url: string;
  size: [number, number];
  at: [number, number];
  tilt: number;
}

/**
 * Station I — the sketch becomes a plan. The first drawing, the research
 * sheet and the doudoune's technical renders get pinned up, one by one.
 */
const SHEETS: Sheet[] = [
  { url: "/textures/sketch-sheet.jpg", size: [0.42, 0.28], at: [-1.96, 0.55], tilt: 0.03 },
  { url: "/textures/illustration-original-mobile.jpg", size: [0.39, 0.26], at: [-1.24, 0.57], tilt: -0.025 },
  { url: "/textures/doudoune-techsheet.jpg", size: [0.56, 0.373], at: [-1.86, 0.99], tilt: -0.015 },
  { url: "/textures/doudoune-back.jpg", size: [0.34, 0.31], at: [-1.24, 0.99], tilt: 0.035 },
];

function PinnedSheet({ sheet, index }: { sheet: Sheet; index: number }) {
  const group = useRef<THREE.Group>(null);
  const [a, b] = TIMING.sketches;
  const span = (b - a) / SHEETS.length;
  const win = [a + index * span, a + (index + 1.6) * span] as const;

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = step(win);
    g.visible = t > 0.001;
    g.position.set(sheet.at[0], sheet.at[1] - (1 - t) * 0.07, WALL_Z + 0.036 + (1 - t) * 0.06);
    g.rotation.set(Math.PI / 2, sheet.tilt + (1 - t) * 0.18 * (index % 2 ? 1 : -1), 0);
  });

  return (
    <group ref={group}>
      <Paper
        textureUrl={sheet.url}
        width={sheet.size[0]}
        height={sheet.size[1]}
        position={[0, 0, 0]}
        lift={0}
        curl={0.004}
        seed={index + 5}
        bumpScale={0.5}
        shadows={false}
      />
      {/* brass pin */}
      <mesh position={[0, 0.008, -sheet.size[1] / 2 + 0.018]} castShadow>
        <sphereGeometry args={[0.006, 12, 8]} />
        <meshStandardMaterial color="#b89a64" metalness={1} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default function Pinboard() {
  const [sx, , sz] = STATIONS.sketch;
  return (
    <group>
      {SHEETS.map((s, i) => (
        <PinnedSheet key={s.url} sheet={s} index={i} />
      ))}
      {/* On the table: a pattern sheet and the pencil from the first night */}
      <Paper width={0.5} height={0.36} position={[sx, MAT_Y, sz]} rotationY={0.08} lift={0.001} seed={9} />
      <Pencil position={[sx + 0.32, MAT_Y + 0.0045, sz + 0.05]} rotationY={-0.9} />
    </group>
  );
}
