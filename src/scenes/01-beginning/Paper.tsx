"use client";

import { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

interface PaperProps {
  width: number;
  height: number;
  position: [number, number, number];
  rotationY?: number;
  /** Height above the table, so stacked sheets never z-fight. */
  lift?: number;
  /** How much the corners curl up, in metres. */
  curl?: number;
  seed?: number;
  textureUrl?: string;
  bumpScale?: number;
  /** Disable for sheets lit at grazing angles (avoids self-shadow acne). */
  shadows?: boolean;
}

/** Builds a subdivided sheet with a soft natural curl and slight waviness. */
function usePaperGeometry(width: number, height: number, lift: number, curl: number, seed: number) {
  return useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, height, 72, 48);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const nx = x / (width / 2);
      const nz = z / (height / 2);
      const corner = Math.pow(Math.abs(nx * nz), 3);
      const edgeX = Math.pow(Math.max(0, nx * (seed % 2 ? -1 : 1)), 6);
      const wave = Math.sin(nx * 2.4 + seed) * Math.cos(nz * 1.7 + seed * 0.5);
      const y = lift + curl * (corner * 0.9 + edgeX * 0.45) + wave * 0.00045;
      pos.setY(i, y);
    }
    geo.computeVertexNormals();
    return geo;
  }, [width, height, lift, curl, seed]);
}

function TexturedPaper({ url, bumpScale = 1.2, ...rest }: PaperProps & { url: string }) {
  const gl = useThree((s) => s.gl);
  const map = useTexture(url);
  useLayoutEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = gl.capabilities.getMaxAnisotropy();
    map.needsUpdate = true;
  }, [map, gl]);
  const geometry = usePaperGeometry(rest.width, rest.height, rest.lift ?? 0.0015, rest.curl ?? 0.004, rest.seed ?? 1);

  return (
    <mesh
      geometry={geometry}
      position={rest.position}
      rotation={[0, rest.rotationY ?? 0, 0]}
      castShadow={rest.shadows ?? true}
      receiveShadow={rest.shadows ?? true}
    >
      <meshStandardMaterial
        map={map}
        bumpMap={map}
        bumpScale={bumpScale}
        roughness={0.93}
        metalness={0}
        color="#fffaf2"
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function BlankPaper(props: PaperProps) {
  const geometry = usePaperGeometry(props.width, props.height, props.lift ?? 0.001, props.curl ?? 0.003, props.seed ?? 2);
  return (
    <mesh
      geometry={geometry}
      position={props.position}
      rotation={[0, props.rotationY ?? 0, 0]}
      castShadow={props.shadows ?? true}
      receiveShadow={props.shadows ?? true}
    >
      <meshStandardMaterial color="#e9e4da" roughness={0.95} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function Paper(props: PaperProps) {
  return props.textureUrl ? <TexturedPaper {...props} url={props.textureUrl} /> : <BlankPaper {...props} />;
}
