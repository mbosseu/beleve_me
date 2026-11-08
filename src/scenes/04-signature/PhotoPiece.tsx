"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { progress } from "@/experience/progress";
import { useExperience } from "@/experience/store";
import { cutout, faithfulMaterial } from "@/lib/cutout";
import { PIECE_Y } from "./layout";

/**
 * The signature piece shown with the brand's OWN visuals, pixel for pixel:
 * the reference renders (front / profile / back), the macro details and the
 * founder wearing it. Materials are unlit and not tone-mapped, so colours and
 * embroidery are exactly those of the source files.
 */

const P = "/textures/piece/";
const C = PIECE_Y + 0.34;

const plateMaterial = faithfulMaterial;

const sm = (a: number, b: number, v: number) => THREE.MathUtils.smoothstep(v, a, b);
const win = (p: number, a: number, b: number, c: number, d: number) => sm(a, b, p) * (1 - sm(c, d, p));

export default function PhotoPiece({ yaw }: { yaw: { current: number } }) {
  const isMobile = useExperience((s) => s.caps?.isMobile ?? false);
  const tex = useTexture({
    front: P + "front.jpg",
    side: P + "side.jpg",
    back: P + "back.jpg",
    zip: P + "detail-zip.jpg",
    monogram: P + "detail-monogram.jpg",
    cuff: P + "detail-cuff.jpg",
    wornFront: P + "worn-front.jpg",
    wornBack: P + "worn-back.jpg",
  });

  const m = useMemo(() => {
    const plain = (t: THREE.Texture) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.needsUpdate = true;
      return plateMaterial(t);
    };
    return {
      front: plateMaterial(cutout(tex.front.image as HTMLImageElement)),
      side: plateMaterial(cutout(tex.side.image as HTMLImageElement, 9)),
      back: plateMaterial(cutout(tex.back.image as HTMLImageElement)),
      zip: plain(tex.zip),
      monogram: plain(tex.monogram),
      cuff: plain(tex.cuff),
      wornFront: plain(tex.wornFront),
      wornBack: plain(tex.wornBack),
    };
  }, [tex]);
  useEffect(() => () => Object.values(m).forEach((mat) => mat.dispose()), [m]);

  // Soft floor shadow under the floating piece.
  const shadow = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, "rgba(0,0,0,0.42)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false });
  }, []);

  const views = useRef<THREE.Group>(null);

  useFrame(() => {
    const p = progress.signature;
    const a = yaw.current;
    const c = Math.cos(a);
    const s = Math.abs(Math.sin(a));
    let wF = sm(0.35, 0.92, c);
    let wB = sm(0.35, 0.92, -c);
    let wS = sm(0.35, 0.92, s);
    const sum = Math.max(1e-4, wF + wB + wS);
    wF /= sum;
    wB /= sum;
    wS /= sum;

    // The full piece steps aside while a macro detail is on stage.
    const zip = win(p, 0.6, 0.63, 0.72, 0.74);
    const mono = win(p, 0.72, 0.74, 0.82, 0.84);
    const cuff = win(p, 0.82, 0.84, 0.92, 0.94);
    const piece = 1 - Math.max(zip, mono, cuff);
    const worn = sm(0.93, 0.98, p);

    m.front.opacity = wF * piece;
    m.back.opacity = wB * piece;
    m.side.opacity = wS * piece;
    m.zip.opacity = zip;
    m.monogram.opacity = mono;
    m.cuff.opacity = cuff;
    m.wornFront.opacity = worn;
    m.wornBack.opacity = worn;
    shadow.opacity = piece;

    // A hint of turntable parallax: the visible view sways with the turn.
    if (views.current) views.current.rotation.y = Math.sin(a * 2) * 0.06;
  });

  const H = 0.8; // jacket height on stage, metres
  const plateW = 0.66;
  const wornX = isMobile ? 0.5 : 0.86;
  const wornH = isMobile ? 0.66 : 1.05;

  return (
    <group>
      <group ref={views} position={[0, C, 0]}>
        <mesh material={m.front} renderOrder={3}>
          <planeGeometry args={[H * (600 / 700), H]} />
        </mesh>
        <mesh material={m.side} renderOrder={3}>
          <planeGeometry args={[H * (290 / 700), H]} />
        </mesh>
        <mesh material={m.back} renderOrder={3} position={[0, -0.005, 0]}>
          <planeGeometry args={[H * 1.04 * (1312 / 1199), H * 1.04]} />
        </mesh>
      </group>

      {/* Macro details, from the reference sheet */}
      {[m.zip, m.monogram, m.cuff].map((mat, i) => (
        <mesh key={i} material={mat} position={[0, C, 0.02]} renderOrder={4}>
          <planeGeometry args={[plateW, plateW * (264 / 356)]} />
        </mesh>
      ))}

      {/* Worn by the founder */}
      <mesh material={m.wornFront} position={[-wornX, C - 0.02, -0.25]} renderOrder={2}>
        <planeGeometry args={[wornH * (660 / 1328), wornH]} />
      </mesh>
      <mesh material={m.wornBack} position={[wornX, C - 0.02, -0.25]} renderOrder={2}>
        <planeGeometry args={[wornH * (700 / 1348), wornH]} />
      </mesh>

      <mesh material={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} scale={[1.1, 0.5, 1]}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
  );
}
