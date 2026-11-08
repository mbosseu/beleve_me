"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import CameraPath from "@/animation/CameraPath";
import ChapterRoot from "@/experience/ChapterRoot";
import { useExperience } from "@/experience/store";
import Atelier from "./Atelier";
import EmbroideryHoop from "./EmbroideryHoop";
import FabricRoll from "./FabricRoll";
import Hardware from "./Hardware";
import Pinboard from "./Pinboard";
import QuiltedPanel from "./QuiltedPanel";
import { CAMERA_DESKTOP, CAMERA_MOBILE } from "./layout";

/**
 * SCENE 03 — THE CREATION
 * The thread from the drawing leads into an atelier. Lamps wake one by one
 * above a long cutting table; the camera tracks along five stations where the
 * idea becomes a garment: sketch → material → volume → embroidery → finishing.
 */
export default function CreationScene() {
  const caps = useExperience((s) => s.caps);
  const high = caps?.tier === "high";
  const gl = useThree((s) => s.gl);

  // A soft procedural reflection environment so metal and nylon read as
  // real materials — generated locally, nothing downloaded.
  const environment = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return env;
  }, [gl]);
  useEffect(() => () => environment.dispose(), [environment]);

  const world = useMemo(
    () => ({ background: new THREE.Color("#090909"), fog: new THREE.Fog("#090909", 3.6, 9.5) }),
    [],
  );

  return (
    <ChapterRoot
      id="creation"
      onActiveFrame={(scene) => {
        scene.background = world.background;
        scene.fog = world.fog;
        scene.environment = environment;
        scene.environmentIntensity = 0.12;
      }}
    >
      <Atelier high={high} shadowMapSize={high ? 1024 : 512} />
      <Pinboard />
      <FabricRoll />
      <QuiltedPanel />
      <EmbroideryHoop count={high ? 26000 : 12000} />
      <Hardware />
      <CameraPath
        chapter="creation"
        desktop={CAMERA_DESKTOP}
        mobile={CAMERA_MOBILE}
        parallax={[0.12, 0.06]}
        parallaxFade={[0.2, 0.9]}
      />
    </ChapterRoot>
  );
}
