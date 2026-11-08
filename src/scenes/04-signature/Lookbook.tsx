"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { productBySlug } from "@/data/products";
import { progress } from "@/experience/progress";
import { useExperience } from "@/experience/store";
import { labelTexture } from "@/scenes/05-collection/labelTexture";
import { PIECE_Y } from "./layout";

/**
 * Closing spread of the signature chapter, laid out like a lookbook page:
 * the piece in the centre, the founder wearing it (front / back) as framed
 * prints on either side, aligned on the same top and bottom lines, each with
 * its caption. The photographs themselves are shown untouched.
 */

const C = PIECE_Y + 0.34;
const INK = "#292929";

const sm = (a: number, b: number, v: number) => THREE.MathUtils.smoothstep(v, a, b);

/** Soft rectangular drop shadow, drawn once. */
function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 320;
  const g = c.getContext("2d")!;
  g.filter = "blur(18px)";
  g.fillStyle = "rgba(0,0,0,0.38)";
  g.fillRect(40, 40, 176, 240);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const basic = (opts: THREE.MeshBasicMaterialParameters) =>
  new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false, opacity: 0, ...opts });

interface PrintSpec {
  map: THREE.Texture;
  aspect: number;
  x: number;
  caption: [string, string];
}

function Print({ spec, height, shadow, side }: { spec: PrintSpec; height: number; shadow: THREE.Texture; side: 1 | -1 }) {
  const group = useRef<THREE.Group>(null);
  const FRAME = 0.006 * (height / 0.84);
  const MAT = 0.045 * (height / 0.84);
  const photoH = height - 2 * (FRAME + MAT);
  const photoW = photoH * spec.aspect;
  const outerW = photoW + 2 * (FRAME + MAT);

  const mats = useMemo(() => {
    spec.map.colorSpace = THREE.SRGBColorSpace;
    spec.map.anisotropy = 8;
    spec.map.needsUpdate = true;
    return {
      shadow: basic({ map: shadow }),
      frame: basic({ color: "#151515" }),
      mat: basic({ color: "#f4f1ea" }),
      photo: basic({ map: spec.map }),
      caption: basic({
        map: labelTexture(
          [
            { text: spec.caption[0], color: INK, size: 22 },
            { text: spec.caption[1], color: "#7a756d", size: 17 },
          ],
          640,
          120,
        ),
      }),
    };
  }, [spec, shadow]);
  useEffect(
    () => () => {
      mats.caption.map?.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    },
    [mats],
  );

  useFrame(() => {
    const t = sm(0.86, 0.92, progress.signature);
    const e = 1 - Math.pow(1 - t, 3);
    Object.values(mats).forEach((m) => (m.opacity = e));
    mats.shadow.opacity = e * 0.9;
    if (group.current) {
      group.current.visible = t > 0.001;
      group.current.position.x = spec.x + side * (1 - e) * 0.12;
    }
  });

  const capW = Math.max(outerW, 0.42);
  return (
    <group ref={group} position={[spec.x, C, -0.04]}>
      <mesh material={mats.shadow} position={[0.012, -0.028, -0.012]} renderOrder={1}>
        <planeGeometry args={[outerW * 1.45, height * 1.33]} />
      </mesh>
      <mesh material={mats.frame} renderOrder={2}>
        <planeGeometry args={[outerW, height]} />
      </mesh>
      <mesh material={mats.mat} position={[0, 0, 0.001]} renderOrder={3}>
        <planeGeometry args={[outerW - 2 * FRAME, height - 2 * FRAME]} />
      </mesh>
      <mesh material={mats.photo} position={[0, 0, 0.002]} renderOrder={4}>
        <planeGeometry args={[photoW, photoH]} />
      </mesh>
      <mesh material={mats.caption} position={[0, -height / 2 - 0.075, 0]} renderOrder={4}>
        <planeGeometry args={[capW, capW * (120 / 640)]} />
      </mesh>
    </group>
  );
}

/** Caption under the piece itself: name and price, from the catalogue. */
function PieceCaption({ height }: { height: number }) {
  const product = productBySlug("doudoune-signature");
  const price =
    product?.price != null
      ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(product.price)
      : "Bientôt";
  const mat = useMemo(
    () =>
      basic({
        map: labelTexture(
          [
            { text: product?.name ?? "Doudoune Signature", color: INK, size: 24 },
            { text: price, color: "#7a756d", size: 18 },
          ],
          640,
          120,
        ),
      }),
    [product, price],
  );
  useEffect(() => () => {
    mat.map?.dispose();
    mat.dispose();
  }, [mat]);
  useFrame(() => {
    mat.opacity = sm(0.87, 0.93, progress.signature);
  });
  return (
    <mesh material={mat} position={[0, C - height / 2 - 0.075, 0.01]} renderOrder={4}>
      <planeGeometry args={[0.5, 0.5 * (120 / 640)]} />
    </mesh>
  );
}

export default function Lookbook() {
  const isMobile = useExperience((s) => s.caps?.isMobile ?? false);
  const tex = useTexture({ front: "/textures/piece/worn-front.jpg", back: "/textures/piece/worn-back.jpg" });
  const shadow = useMemo(() => shadowTexture(), []);
  useEffect(() => () => shadow.dispose(), [shadow]);

  const height = isMobile ? 0.56 : 0.84;
  const x = isMobile ? 0.56 : 0.8;

  const prints = useMemo<PrintSpec[]>(
    () => [
      { map: tex.front, aspect: 660 / 1328, x: -x, caption: ["Porté — Face", "Le fondateur"] },
      { map: tex.back, aspect: 700 / 1348, x, caption: ["Porté — Dos", "Broderie botanique"] },
    ],
    [tex, x],
  );

  return (
    <group>
      <Print spec={prints[0]} height={height} shadow={shadow} side={-1} />
      <Print spec={prints[1]} height={height} shadow={shadow} side={1} />
      <PieceCaption height={0.8} />
    </group>
  );
}
