"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import CameraPath from "@/animation/CameraPath";
import ChapterRoot from "@/experience/ChapterRoot";
import { progress } from "@/experience/progress";
import { useExperience } from "@/experience/store";
import PhotoPiece from "./PhotoPiece";
import Studio from "./Studio";
import { CAMERA_DESKTOP, CAMERA_MOBILE, pieceYaw } from "./layout";
import { useDragRotate } from "./useDragRotate";

/**
 * SCENE 04 — THE SIGNATURE PIECE
 * The atelier goes dark; studio strobes arm one by one. The doudoune is shown
 * with the brand's own visuals — front, profile, back, embroidery, zip,
 * monogram, cuff — then worn by the founder. The visitor can turn it freely.
 * (A procedural 3D model also exists in ./doudoune, kept for a future GLB.)
 */
export default function SignatureScene() {
  const caps = useExperience((s) => s.caps);
  const high = caps?.tier === "high";
  const reduced = caps?.reducedMotion ?? false;
  const gl = useThree((s) => s.gl);
  const userYaw = useDragRotate("signature");
  const smoothYaw = useRef(0);

  const environment = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    pmrem.dispose();
    return env;
  }, [gl]);
  useEffect(() => () => environment.dispose(), [environment]);

  const world = useMemo(
    () => ({ background: new THREE.Color("#e6e2db"), fog: new THREE.Fog("#e6e2db", 5, 13) }),
    [],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const target = pieceYaw(progress.signature) + userYaw(dt);
    smoothYaw.current += (target - smoothYaw.current) * (1 - Math.exp(-dt * (reduced ? 14 : 5)));
  });

  return (
    <ChapterRoot
      id="signature"
      onActiveFrame={(scene) => {
        scene.background = world.background;
        scene.fog = world.fog;
        scene.environment = environment;
        scene.environmentIntensity = 0.32;
      }}
    >
      <Studio shadowMapSize={high ? 1024 : 512} />
      <PhotoPiece yaw={smoothYaw} />
      <CameraPath
        chapter="signature"
        desktop={CAMERA_DESKTOP}
        mobile={CAMERA_MOBILE}
        fov={[30, 42]}
        parallax={[0.08, 0.04]}
        parallaxFade={[0.45, 0.6]}
      />
    </ChapterRoot>
  );
}
