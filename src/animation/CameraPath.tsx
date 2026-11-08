"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { activeChapterId, DAMPING, justJumped, progress, scene } from "@/experience/progress";
import { useExperience } from "@/experience/store";

export interface CameraKey {
  /** Chapter progress (0 → 1) at which the camera rests on this key. */
  at: number;
  position: [number, number, number];
  target: [number, number, number];
}

const easeInOut = (u: number) => -(Math.cos(Math.PI * u) - 1) / 2;

/** Maps chapter progress to a curve parameter that eases into each key. */
function curveParam(keys: CameraKey[], p: number) {
  const n = keys.length;
  let i = 0;
  while (i < n - 2 && p > keys[i + 1].at) i++;
  const u = THREE.MathUtils.clamp((p - keys[i].at) / (keys[i + 1].at - keys[i].at), 0, 1);
  // Mostly eased (the camera "settles" on each key), partly linear so it
  // never fully stops mid-scroll.
  return (i + u * 0.3 + easeInOut(u) * 0.7) / (n - 1);
}

interface CameraPathProps {
  chapter: string;
  desktop: CameraKey[];
  mobile: CameraKey[];
  fov?: [desktop: number, mobile: number];
  /** Pointer parallax amplitude (x, y), desktop only. */
  parallax?: [number, number];
  /** Progress range over which the parallax fades out. */
  parallaxFade?: [number, number];
  /** Optional shot that takes over the scroll path (weight 0 → 1). */
  override?: { current: CameraOverride };
}

export interface CameraOverride {
  weight: number;
  position: THREE.Vector3;
  target: THREE.Vector3;
}

/**
 * Scroll-driven camera for one chapter. It only writes to the camera while
 * its chapter is the active one, so chapters never fight over the shot.
 */
export default function CameraPath({
  chapter,
  desktop,
  mobile,
  fov = [34, 48],
  parallax = [0.14, 0.07],
  parallaxFade = [0.55, 0.95],
  override,
}: CameraPathProps) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const caps = useExperience((s) => s.caps);
  const isMobile = caps?.isMobile ?? false;
  const reduced = caps?.reducedMotion ?? false;
  const keys = isMobile ? mobile : desktop;

  const curves = useMemo(
    () => ({
      position: new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.position)), false, "centripetal"),
      target: new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.target)), false, "centripetal"),
    }),
    [keys],
  );

  const s = useRef({ smoothed: 0, px: 0, py: 0, pos: new THREE.Vector3(), look: new THREE.Vector3() }).current;

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const goal = progress[chapter] ?? 0;
    if (justJumped()) s.smoothed = goal;
    else s.smoothed += (goal - s.smoothed) * (1 - Math.exp(-dt * (reduced ? 12 : DAMPING)));
    if (activeChapterId() !== chapter) return;

    const targetFov = isMobile ? fov[1] : fov[0];
    if (camera.fov !== targetFov || camera.near !== 0.008) {
      camera.fov = targetFov;
      camera.near = 0.008;
      camera.far = 40;
      camera.updateProjectionMatrix();
    }

    const t = curveParam(keys, s.smoothed);
    curves.position.getPoint(t, s.pos);
    curves.target.getPoint(t, s.look);
    const o = override?.current;
    if (o && o.weight > 0.0001) {
      s.pos.lerp(o.position, o.weight);
      s.look.lerp(o.target, o.weight);
    }

    const live = 1 - THREE.MathUtils.smoothstep(s.smoothed, parallaxFade[0], parallaxFade[1]);
    s.px += (scene.pointerX - s.px) * (1 - Math.exp(-dt * 2));
    s.py += (scene.pointerY - s.py) * (1 - Math.exp(-dt * 2));
    if (!isMobile && !reduced) {
      s.pos.x += s.px * parallax[0] * live;
      s.pos.y += s.py * parallax[1] * live;
    }

    // Hand-held breathing, scaled by distance to the subject.
    if (!reduced) {
      const dist = Math.min(s.pos.distanceTo(s.look), 3);
      const time = frame.clock.elapsedTime;
      const amp = 0.006 * dist * (0.3 + live * 0.7);
      s.pos.x += Math.sin(time * 0.31) * amp;
      s.pos.y += Math.sin(time * 0.23 + 1.3) * amp * 0.6;
    }

    camera.position.copy(s.pos);
    camera.lookAt(s.look);
  });

  return null;
}
