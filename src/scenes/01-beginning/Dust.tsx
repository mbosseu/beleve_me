"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scene } from "@/experience/progress";
import { LAMP } from "./layout";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uLamp;
  uniform float uRadius;
  uniform float uHeight;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime * (0.02 + aSeed * 0.03);
    p.x += sin(t * 6.2831 + aSeed * 40.0) * 0.05;
    p.z += cos(t * 5.1 + aSeed * 17.0) * 0.05;
    p.y = mod(p.y + uTime * 0.01 * (aSeed - 0.45), uHeight);

    vec4 world = modelMatrix * vec4(p, 1.0);
    float h = clamp((uLamp.y - world.y) / uHeight, 0.0, 1.0);
    float r = max(h * uRadius, 0.0001);
    float d = length(world.xz - uLamp.xz);
    float inCone = 1.0 - smoothstep(r * 0.5, r, d);

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(uSize * (0.4 + aSeed) * uPixelRatio / -mv.z, 48.0);
    vAlpha = inCone * smoothstep(0.0, 0.2, h) * (0.3 + 0.7 * fract(aSeed * 7.13));
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uLight;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(1.0, 0.95, 0.86, a * vAlpha * uLight * 0.6);
  }
`;

/** Dust drifting in the lamp's cone. */
export default function Dust({ count }: { count: number }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const height = LAMP.position[1];
  const radius = Math.tan(LAMP.angle) * height;

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radius;
      positions[i * 3] = LAMP.position[0] + Math.cos(a) * r;
      positions[i * 3 + 1] = Math.random() * height;
      positions[i * 3 + 2] = LAMP.position[2] + Math.sin(a) * r;
      seeds[i] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 5.5 },
        uPixelRatio: { value: dpr },
        uLamp: { value: new THREE.Vector3(...LAMP.position) },
        uRadius: { value: radius },
        uHeight: { value: height },
        uLight: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, material };
  }, [count, radius, height, dpr]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uLight.value = scene.light;
  });

  if (count === 0) return null;
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={3} />;
}
