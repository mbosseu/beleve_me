"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import CameraPath, { type CameraKey } from "@/animation/CameraPath";
import ChapterRoot from "@/experience/ChapterRoot";
import { progress } from "@/experience/progress";
import { useExperience } from "@/experience/store";
import { sampleDrawing } from "@/scenes/02-inspiration/sampleDrawing";
import { BUD } from "@/scenes/02-inspiration/layout";

const vertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aDelay;
  attribute float aGroup;
  attribute float aShade;
  uniform float uTime;
  uniform float uReveal;
  uniform float uName;
  uniform float uDepth;
  uniform float uWorldSize;
  uniform float uScale;
  uniform float uMotion;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    // The drawing hangs in the dark like a constellation, with real depth.
    p.z += (aSeed - 0.5) * uDepth * (aGroup > 0.5 ? 0.15 : 1.0);
    float t = uTime * 0.25 + aSeed * 30.0;
    p += vec3(sin(t), cos(t * 0.8), sin(t * 0.6)) * 0.006 * uMotion;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uWorldSize * uScale / -mv.z, 1.0, 5.0);
    float show = aGroup > 0.5
      ? clamp((uName - aDelay * 0.6) / 0.4, 0.0, 1.0)
      : clamp((uReveal - aDelay * 0.7) / 0.3, 0.0, 1.0);
    // Faint twinkle
    float tw = 0.75 + 0.25 * sin(uTime * (0.6 + aSeed) + aSeed * 50.0) * uMotion;
    vAlpha = show * (0.35 + 0.65 * aShade) * tw;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uThread;
  uniform float uDim;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(uThread, vAlpha * uDim * smoothstep(0.5, 0.15, d) * 0.8);
  }
`;

const sm = (a: number, b: number, v: number) => THREE.MathUtils.smoothstep(v, a, b);

const CAMERA_DESKTOP: CameraKey[] = [
  { at: 0.0, position: [BUD[0], BUD[1], 0.7], target: [BUD[0], BUD[1], 0] },
  { at: 0.3, position: [0.25, 0.1, 2.6], target: [0.1, 0.05, 0] },
  { at: 0.65, position: [-0.1, -0.1, 4.6], target: [0, -0.15, 0] },
  { at: 1.0, position: [0, -0.55, 7.4], target: [0, -0.98, 0] },
];
const CAMERA_MOBILE: CameraKey[] = [
  { at: 0.0, position: [BUD[0], BUD[1], 1.0], target: [BUD[0], BUD[1], 0] },
  { at: 0.3, position: [0.2, 0.1, 4.2], target: [0.1, 0.05, 0] },
  { at: 0.65, position: [-0.05, -0.1, 7.5], target: [0, -0.15, 0] },
  { at: 1.0, position: [0, -0.6, 11.5], target: [0, -1.6, 0] },
];

/**
 * SCENE 06 — THE MESSAGE
 * Darkness. The very first drawing returns as a constellation of beige
 * thread; the camera steps back while the words are said, then the name
 * gathers beneath the flower.
 */
export default function MessageScene() {
  const caps = useExperience((s) => s.caps);
  const tier = caps?.tier ?? "mobile";
  const reduced = caps?.reducedMotion ?? false;
  const url = tier === "high" ? "/textures/illustration-original.jpg" : "/textures/illustration-original-mobile.jpg";
  const count = tier === "high" ? 42000 : tier === "mobile" ? 22000 : 16000;
  const texture = useTexture(url);

  const { geometry, material } = useMemo(() => {
    const s = sampleDrawing(texture.image as HTMLImageElement, count);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(s.flat, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(s.seed, 1));
    g.setAttribute("aDelay", new THREE.BufferAttribute(s.delay, 1));
    g.setAttribute("aGroup", new THREE.BufferAttribute(s.group, 1));
    g.setAttribute("aShade", new THREE.BufferAttribute(s.shade, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uName: { value: 0 },
        uDepth: { value: 0 },
        uDim: { value: 1 },
        uMotion: { value: 1 },
        uWorldSize: { value: 0.0045 },
        uScale: { value: 1000 },
        uThread: { value: new THREE.Color("#d8c9a9") },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: g, material: m };
  }, [texture, count]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  const world = useMemo(() => ({ background: new THREE.Color("#090909") }), []);

  useFrame((state) => {
    const p = progress.message;
    const u = material.uniforms;
    const cam = state.camera as THREE.PerspectiveCamera;
    u.uScale.value = (state.size.height * state.viewport.dpr) / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    u.uTime.value = state.clock.elapsedTime;
    u.uMotion.value = reduced ? 0 : 1;
    u.uReveal.value = sm(0.0, 0.18, p);
    // Depth opens while we travel, then folds back so the mark lands crisp.
    u.uDepth.value = 0.12 + 0.9 * sm(0.05, 0.6, p) * (1 - sm(0.78, 0.96, p));
    u.uName.value = sm(0.78, 0.94, p);
    // The flower steps back while the words are spoken.
    const speaking = Math.max(sm(0.12, 0.2, p) * (1 - sm(0.42, 0.48, p)), sm(0.5, 0.56, p) * (1 - sm(0.76, 0.82, p)));
    u.uDim.value = 1 - 0.6 * speaking;
  });

  return (
    <ChapterRoot
      id="message"
      onActiveFrame={(scene) => {
        scene.background = world.background;
        scene.fog = null;
        scene.environment = null;
      }}
    >
      <points geometry={geometry} material={material} frustumCulled={false} />
      <CameraPath
        chapter="message"
        desktop={CAMERA_DESKTOP}
        mobile={CAMERA_MOBILE}
        fov={[34, 48]}
        parallax={[0.18, 0.1]}
        parallaxFade={[1.1, 1.2]}
      />
    </ChapterRoot>
  );
}
