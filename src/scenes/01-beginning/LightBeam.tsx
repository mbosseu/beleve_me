"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { progress, scene } from "@/experience/progress";
import { LAMP } from "./layout";

const vertexShader = /* glsl */ `
  uniform float uHeight;
  varying float vH;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    vH = position.y / uHeight + 0.5;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalV = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uColor;
  varying float vH;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    float facing = abs(dot(normalize(vNormalV), normalize(vViewDir)));
    float edge = pow(facing, 2.4);
    float fall = smoothstep(0.0, 0.45, vH) * mix(0.25, 1.0, vH);
    gl_FragColor = vec4(uColor, edge * fall * uOpacity);
  }
`;

/** Faint volumetric cone under the lamp — light made visible by dust. */
export default function LightBeam() {
  const height = LAMP.position[1];
  const radius = Math.tan(LAMP.angle) * height * 0.92;

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uHeight: { value: height },
          uOpacity: { value: 0 },
          uColor: { value: new THREE.Color("#f6ead6") },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [height],
  );

  useFrame(() => {
    // The beam dissolves as we lean over the sheet.
    const close = THREE.MathUtils.smoothstep(progress.beginning, 0.4, 0.7);
    material.uniforms.uOpacity.value = scene.light * 0.075 * (1 - close * 0.85);
  });

  return (
    <mesh
      position={[LAMP.position[0], height / 2, LAMP.position[2]]}
      material={material}
      renderOrder={2}
    >
      <coneGeometry args={[radius, height, 64, 1, true]} />
    </mesh>
  );
}
