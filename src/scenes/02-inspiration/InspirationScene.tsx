"use client";

import { useCallback, useMemo } from "react";
import * as THREE from "three";
import CameraPath from "@/animation/CameraPath";
import ChapterRoot from "@/experience/ChapterRoot";
import { progress } from "@/experience/progress";
import { useExperience } from "@/experience/store";
import InkDrawing from "./InkDrawing";
import { CAMERA_DESKTOP, CAMERA_MOBILE, TIMING } from "./layout";

const NIGHT = new THREE.Color("#090909");

/**
 * SCENE 02 — THE INSPIRATION
 * We are inside the paper. The strokes of the first drawing rise out of it
 * and rebuild the flower in space; the page goes dark and the ink becomes
 * thread. Then the name gathers beneath it.
 */
export default function InspirationScene() {
  const caps = useExperience((s) => s.caps);
  const tier = caps?.tier ?? "mobile";
  const count = tier === "high" ? 48000 : tier === "mobile" ? 26000 : 18000;
  const url = tier === "high" ? "/textures/illustration-original.jpg" : "/textures/illustration-original-mobile.jpg";

  const world = useMemo(() => ({ paper: new THREE.Color("#ebe8e2"), background: new THREE.Color() }), []);
  const onPaper = useCallback(
    ([r, g, b]: [number, number, number]) => world.paper.setRGB(r, g, b, THREE.SRGBColorSpace),
    [world],
  );

  return (
    <ChapterRoot
      id="inspiration"
      onActiveFrame={(scene) => {
        const dark = THREE.MathUtils.smoothstep(progress.inspiration, TIMING.dark[0], TIMING.dark[1]);
        world.background.copy(world.paper).lerp(NIGHT, dark);
        scene.background = world.background;
        scene.fog = null;
        scene.environment = null;
      }}
    >
      <InkDrawing url={url} count={count} reduced={caps?.reducedMotion ?? false} onPaper={onPaper} />
      <CameraPath
        chapter="inspiration"
        desktop={CAMERA_DESKTOP}
        mobile={CAMERA_MOBILE}
        parallax={[0.25, 0.12]}
        parallaxFade={[0.9, 1]}
      />
    </ChapterRoot>
  );
}
