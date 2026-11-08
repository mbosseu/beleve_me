"use client";

import { useLayoutEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { progress } from "@/experience/progress";
import { DRAWING, TIMING } from "./layout";
import { sampleDrawing } from "./sampleDrawing";

const vertexShader = /* glsl */ `
  attribute vec3 aSculpt;
  attribute vec3 aScatter;
  attribute float aSeed;
  attribute float aDelay;
  attribute float aGroup;
  attribute float aShade;
  uniform float uLift;
  uniform float uAssemble;
  uniform float uBreath;
  uniform float uTime;
  uniform float uWorldSize;
  uniform float uScale;
  varying float vAlpha;

  float ease(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    float lift = ease(clamp((uLift - aDelay * 0.6) / 0.4, 0.0, 1.0));
    vec3 p;
    vAlpha = 0.35 + 0.65 * aShade;

    if (aGroup < 0.5) {
      p = mix(position, aSculpt, lift);
      // Each stroke arcs toward the viewer as it leaves the paper.
      p.z += sin(lift * 3.14159) * (0.12 + aSeed * 0.22);
      float t = uTime * 0.35 + aSeed * 20.0;
      p += vec3(sin(t), cos(t * 0.8), sin(t * 0.6)) * 0.005 * uBreath;
    } else {
      float gather = ease(clamp((uAssemble - aDelay * 0.5) / 0.5, 0.0, 1.0));
      vec3 away = mix(position, aScatter, lift);
      float t = uTime * 0.2 + aSeed * 30.0;
      away += vec3(sin(t), cos(t * 0.7), sin(t * 0.5)) * 0.04 * lift;
      p = mix(away, position, gather);
      vAlpha *= mix(1.0, 0.3, lift * (1.0 - gather));
    }

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uWorldSize * uScale / -mv.z, 1.0, 6.5);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uDark;
  uniform float uOpacity;
  uniform vec3 uInk;
  uniform vec3 uThread;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.15, d);
    gl_FragColor = vec4(mix(uInk, uThread, uDark), a * vAlpha * uOpacity * mix(1.0, 0.72, uDark));
  }
`;

const smooth = (a: number, b: number, v: number) => THREE.MathUtils.smoothstep(v, a, b);

/**
 * The first drawing leaves its paper. A printed sheet hands over to ink
 * particles sampled from it; they lift into depth, then — as the world turns
 * black — become beige thread, the colour of the future embroidery.
 */
export default function InkDrawing({
  url,
  count,
  reduced,
  onPaper,
}: {
  url: string;
  count: number;
  reduced: boolean;
  /** Receives the sheet's paper colour once sampled. */
  onPaper: (rgb: [number, number, number]) => void;
}) {
  const texture = useTexture(url);
  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  const sample = useMemo(
    () => sampleDrawing(texture.image as HTMLImageElement, count),
    [texture, count],
  );
  useLayoutEffect(() => {
    onPaper(sample.paper);
  }, [sample, onPaper]);

  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(sample.flat, 3));
    geometry.setAttribute("aSculpt", new THREE.BufferAttribute(sample.sculpt, 3));
    geometry.setAttribute("aScatter", new THREE.BufferAttribute(sample.scatter, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(sample.seed, 1));
    geometry.setAttribute("aDelay", new THREE.BufferAttribute(sample.delay, 1));
    geometry.setAttribute("aGroup", new THREE.BufferAttribute(sample.group, 1));
    geometry.setAttribute("aShade", new THREE.BufferAttribute(sample.shade, 1));
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uLift: { value: 0 },
        uAssemble: { value: 0 },
        uBreath: { value: 0 },
        uTime: { value: 0 },
        uDark: { value: 0 },
        uOpacity: { value: 0 },
        uWorldSize: { value: 0.0042 },
        uScale: { value: 1000 },
        uInk: { value: new THREE.Color("#1e1c1a") },
        uThread: { value: new THREE.Color("#d8c9a9") },
      },
      transparent: true,
      depthWrite: false,
    });
    return { geometry, material };
  }, [sample]);

  const sheet = useMemo(
    () => new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false, depthWrite: false }),
    [texture],
  );

  useFrame((state) => {
    const p = progress.inspiration;
    const u = material.uniforms;
    const cam = state.camera as THREE.PerspectiveCamera;
    u.uScale.value = (state.size.height * state.viewport.dpr) / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    u.uTime.value = state.clock.elapsedTime;
    u.uLift.value = smooth(TIMING.lift[0], TIMING.lift[1], p);
    u.uAssemble.value = smooth(TIMING.assemble[0], TIMING.assemble[1], p);
    u.uDark.value = smooth(TIMING.dark[0], TIMING.dark[1], p);
    u.uBreath.value = reduced ? 0 : u.uDark.value;
    const handover = smooth(TIMING.crossfade[0], TIMING.crossfade[1], p);
    u.uOpacity.value = handover;
    sheet.opacity = 1 - handover;
    // Thread glows on black: additive once the night has fallen.
    material.blending = u.uDark.value > 0.6 ? THREE.AdditiveBlending : THREE.NormalBlending;
  });

  return (
    <group>
      <mesh material={sheet} renderOrder={0}>
        <planeGeometry args={[DRAWING.width, DRAWING.height]} />
      </mesh>
      <points geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />
    </group>
  );
}
