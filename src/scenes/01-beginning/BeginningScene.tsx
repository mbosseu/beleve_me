"use client";

import { useMemo } from "react";
import * as THREE from "three";
import CameraPath from "@/animation/CameraPath";
import ChapterRoot from "@/experience/ChapterRoot";
import { useExperience } from "@/experience/store";
import Dust from "./Dust";
import LightBeam from "./LightBeam";
import Lighting from "./Lighting";
import Paper from "./Paper";
import { Needle, Pencil, ThreadSpool } from "./Props";
import Table from "./Table";
import { CAMERA_DESKTOP, CAMERA_MOBILE, SHEET } from "./layout";

/**
 * SCENE 01 — THE BEGINNING
 * A dark room. A lamp switches on above a table. On it, a single sheet: the
 * first BELIEVE ME drawing. The camera descends until the pencil strokes fill
 * the frame, then dives into the paper.
 */
export default function BeginningScene() {
  const caps = useExperience((s) => s.caps);
  const high = caps?.tier === "high";
  const illustration = high
    ? "/textures/illustration-original.jpg"
    : "/textures/illustration-original-mobile.jpg";

  const world = useMemo(
    () => ({ background: new THREE.Color("#090909"), fog: new THREE.Fog("#090909", 4.5, 11) }),
    [],
  );

  return (
    <ChapterRoot
      id="beginning"
      onActiveFrame={(scene) => {
        scene.background = world.background;
        scene.fog = world.fog;
        scene.environment = null;
      }}
    >
      <Lighting shadowMapSize={caps?.shadowMapSize ?? 1024} />
      <Table textureSize={high ? 2048 : 1024} />

      {/* Paper stack — research sheet and blank sheet under the first drawing */}
      <Paper
        textureUrl="/textures/sketch-sheet.jpg"
        width={0.5}
        height={0.333}
        position={[-0.5, 0, -0.17]}
        rotationY={0.24}
        lift={0.0007}
        curl={0.005}
        seed={3}
        bumpScale={0.8}
      />
      <Paper width={0.42} height={0.297} position={[0.4, 0, 0.2]} rotationY={-0.13} lift={0.0009} seed={4} />
      <Paper
        textureUrl={illustration}
        width={SHEET.width}
        height={SHEET.height}
        position={[0, 0, 0]}
        lift={0.0019}
        curl={0.0035}
        seed={1}
      />

      <Pencil position={[0.39, 0.0068, -0.06]} rotationY={-0.52} />
      <ThreadSpool position={[-0.4, 0, 0.29]} strandEnd={[-0.24, 0, 0.13]} />
      <Needle position={[-0.3, 0.0012, 0.34]} rotationY={0.75} />

      <LightBeam />
      <Dust count={caps?.dustCount ?? 0} />
      <CameraPath chapter="beginning" desktop={CAMERA_DESKTOP} mobile={CAMERA_MOBILE} />
    </ChapterRoot>
  );
}
