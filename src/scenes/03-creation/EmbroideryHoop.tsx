"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { sampleDrawing } from "@/scenes/02-inspiration/sampleDrawing";
import { MAT_Y, STATIONS, TIMING, step } from "./layout";
import { createWeaveTexture } from "./textures";

const HOOP_R = 0.17;
const SCALE = 0.17; // drawing world units → metres on the fabric
const FABRIC_Y = MAT_Y + 0.011;

const vertexShader = /* glsl */ `
  attribute float aDelay;
  attribute float aShade;
  uniform float uStitch;
  uniform float uWorldSize;
  uniform float uScale;
  varying float vAlpha;
  varying float vShade;
  void main() {
    float t = clamp((uStitch - aDelay * 0.85) / 0.15, 0.0, 1.0);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    // Each stitch lands with a small pop.
    float pop = 1.0 + (1.0 - t) * 1.4;
    gl_PointSize = clamp(uWorldSize * uScale * pop / -mv.z, 1.0, 7.0);
    vAlpha = step(0.001, t) * (0.45 + 0.55 * t);
    vShade = aShade;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uThread;
  uniform float uLight;
  varying float vAlpha;
  varying float vShade;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5 || vAlpha <= 0.0) discard;
    // Fake raised thread: lit from the top-left lamp.
    float relief = 0.75 + 0.35 * (0.5 - c.y) - 0.2 * d;
    gl_FragColor = vec4(uThread * relief * uLight * (0.8 + 0.2 * vShade), vAlpha * smoothstep(0.5, 0.25, d));
  }
`;

/**
 * Station IV — embroidery. A wooden hoop holds black twill; the original
 * drawing is stitched in beige thread, growing out of its stem.
 */
export default function EmbroideryHoop({ count }: { count: number }) {
  const [cx, , cz] = STATIONS.embroidery;
  const texture = useTexture("/textures/illustration-original-mobile.jpg");
  const weave = useMemo(() => createWeaveTexture(256, 8), []);
  useEffect(() => () => weave.dispose(), [weave]);

  const { geometry, material } = useMemo(() => {
    const s = sampleDrawing(texture.image as HTMLImageElement, Math.round(count / 0.8));
    // Keep the botanical strokes only (the hoop carries the flower, not the name).
    const pts: number[] = [];
    const delays: number[] = [];
    const shades: number[] = [];
    // Stitching grows from the stem base outward.
    const baseX = -0.15;
    const baseY = -0.32;
    let maxD = 0;
    const tmp: { x: number; y: number; d: number; shade: number; seed: number }[] = [];
    for (let i = 0; i < s.count; i++) {
      if (s.group[i] > 0.5) continue;
      const x = s.flat[i * 3];
      const y = s.flat[i * 3 + 1];
      const d = Math.hypot(x - baseX, y - baseY);
      maxD = Math.max(maxD, d);
      tmp.push({ x, y, d, shade: s.shade[i], seed: s.seed[i] });
    }
    const cy = 0.29; // vertical centre of the flower in drawing units
    for (const p of tmp) {
      pts.push(p.x * SCALE, FABRIC_Y + 0.0012, -(p.y - cy) * SCALE);
      delays.push((p.d / maxD) * 0.8 + p.seed * 0.2);
      shades.push(p.shade);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    geometry.setAttribute("aDelay", new THREE.Float32BufferAttribute(delays, 1));
    geometry.setAttribute("aShade", new THREE.Float32BufferAttribute(shades, 1));
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uStitch: { value: 0 },
        uWorldSize: { value: 0.0011 },
        uScale: { value: 1000 },
        uThread: { value: new THREE.Color("#d8c9a9") },
        uLight: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
    });
    return { geometry, material };
  }, [texture, count]);

  useFrame((state) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    material.uniforms.uScale.value =
      (state.size.height * state.viewport.dpr) / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    material.uniforms.uStitch.value = step(TIMING.stitch);
    material.uniforms.uLight.value = 0.15 + 0.85 * step([0.03, 0.12]);
  });

  return (
    <group position={[cx, 0, cz]} rotation={[0, 0.12, 0]}>
      {/* Outer and inner wooden rings */}
      {[HOOP_R + 0.006, HOOP_R].map((r, i) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, MAT_Y + 0.006 + i * 0.002, 0]} castShadow receiveShadow>
          <torusGeometry args={[r, 0.006, 12, 96]} />
          <meshStandardMaterial color={i ? "#a7855d" : "#94724c"} roughness={0.55} />
        </mesh>
      ))}
      {/* Screw clamp */}
      <mesh position={[HOOP_R + 0.02, MAT_Y + 0.008, 0]} castShadow>
        <boxGeometry args={[0.022, 0.012, 0.016]} />
        <meshStandardMaterial color="#b9b9b9" metalness={1} roughness={0.3} />
      </mesh>
      {/* Stretched black twill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FABRIC_Y, 0]} receiveShadow>
        <circleGeometry args={[HOOP_R - 0.002, 96]} />
        <meshStandardMaterial color="#060606" roughness={0.78} bumpMap={weave} bumpScale={0.5} />
      </mesh>
      <points geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />
    </group>
  );
}
