"use client";

import { forwardRef, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { Product } from "@/data/products";
import { useExperience } from "@/experience/store";
import { cutout, faithfulMaterial } from "@/lib/cutout";
import { PLINTH, WALL_Z } from "./layout";
import { labelTexture } from "./labelTexture";
import { picking } from "./picking";

/** Plinth, light slot, plaque and spotlight shared by every display. */
function Plinth({ x, title, sub, light }: { x: number; title: string; sub: string; light: React.RefObject<THREE.SpotLight | null> }) {
  const sceneRoot = useThree((s) => s.scene);
  const plaque = useMemo(
    () =>
      labelTexture([
        { text: title, color: "#f4f1ea", size: 22 },
        { text: sub, color: "#d8c9a9", size: 16 },
      ], 768, 160),
    [title, sub],
  );
  useEffect(() => () => plaque.dispose(), [plaque]);
  useEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target.position.set(x, 0.7, 0);
    sceneRoot.add(l.target);
    return () => {
      sceneRoot.remove(l.target);
    };
  }, [sceneRoot, light, x]);

  return (
    <group>
      <mesh position={[x, PLINTH.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[PLINTH.w, PLINTH.h, PLINTH.d]} />
        <meshStandardMaterial color="#1b1a19" roughness={0.55} />
      </mesh>
      <mesh position={[x, PLINTH.h * 0.5, PLINTH.d / 2 + 0.001]}>
        <planeGeometry args={[PLINTH.w * 0.96, PLINTH.w * 0.96 * (160 / 768)]} />
        <meshBasicMaterial map={plaque} transparent toneMapped={false} />
      </mesh>
      {/* vertical light slot in the wall behind */}
      <mesh position={[x, 1.25, WALL_Z + 0.01]}>
        <planeGeometry args={[0.012, 1.9]} />
        <meshBasicMaterial color="#d8c9a9" toneMapped={false} />
      </mesh>
      <spotLight ref={light} position={[x, 3.1, 1.1]} angle={0.34} penumbra={0.9} decay={2} color="#fff3e2" intensity={0} />
    </group>
  );
}

/** Invisible box used for click / hover picking. */
const HitBox = forwardRef<THREE.Mesh, { x: number; slug: string }>(function HitBox({ x, slug }, ref) {
  return (
    <mesh ref={ref} position={[x, 0.75, 0]} userData={{ slug }}>
      <boxGeometry args={[PLINTH.w + 0.1, 1.5, PLINTH.d + 0.2]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  );
});

function useLightLevel(slug: string, light: React.RefObject<THREE.SpotLight | null>, reveal: () => number) {
  const level = useRef(0);
  useFrame((_, dt) => {
    const { focusedProduct } = useExperience.getState();
    let target = 14;
    if (picking.hovered === slug) target = 24;
    if (focusedProduct) target = focusedProduct === slug ? 26 : 3;
    level.current += (target - level.current) * (1 - Math.exp(-dt * 5));
    if (light.current) light.current.intensity = level.current * reveal();
  });
}

interface DisplayProps {
  product: Product;
  index: number;
  x: number;
  reveal: () => number;
  registerHit: (m: THREE.Mesh | null) => void;
}

/** A product with real visuals: every view of the brand, swapped in place. */
export function ProductDisplay({ product, index, x, reveal, registerHit }: DisplayProps) {
  const light = useRef<THREE.SpotLight>(null);
  useLightLevel(product.slug, light, reveal);
  const textures = useTexture(product.views.map((v) => v.src));

  const mats = useMemo(
    () =>
      product.views.map((v, i) => {
        const t = textures[i];
        let m: THREE.MeshBasicMaterial;
        if (v.kind === "cutout") m = faithfulMaterial(cutout(t.image as HTMLImageElement, v.clipX ?? 0));
        else {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 8;
          t.needsUpdate = true;
          m = faithfulMaterial(t);
        }
        m.opacity = 0; // views fade in; never all at once
        return m;
      }),
    [product, textures],
  );
  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats]);

  useFrame((_, dt) => {
    const { focusedProduct, focusedView } = useExperience.getState();
    const current = focusedProduct === product.slug ? focusedView : "front";
    const r = reveal();
    mats.forEach((m, i) => {
      const target = product.views[i].id === current ? 1 : 0;
      m.opacity += (target * r - m.opacity) * (1 - Math.exp(-dt * 7));
    });
  });

  return (
    <group>
      <Plinth x={x} title={`${String(index + 1).padStart(2, "0")} — ${product.name}`} sub="Disponible" light={light} />
      {product.views.map((v, i) => {
        const tall = v.kind === "cutout" || v.aspect < 0.7;
        const h = v.kind === "cutout" ? (v.id === "back" ? 0.93 : 0.88) : tall ? 0.98 : 0.6;
        const y = PLINTH.h + h / 2 + (v.kind === "cutout" ? 0.0 : 0.08);
        return (
          <mesh key={v.id} material={mats[i]} position={[x, y, 0.02]} renderOrder={3}>
            <planeGeometry args={[h * v.aspect, h]} />
          </mesh>
        );
      })}
      <HitBox x={x} slug={product.slug} ref={registerHit} />
    </group>
  );
}

/** A piece still in the making: an empty frame, never an invented garment. */
export function ComingSoonDisplay({ product, index, x, reveal, registerHit }: DisplayProps) {
  const light = useRef<THREE.SpotLight>(null);
  useLightLevel(product.slug, light, reveal);
  const sign = useMemo(
    () =>
      labelTexture(
        [
          { text: "À venir", color: "#d8c9a9", size: 30 },
          { text: product.name, color: "#d9d9d9", size: 20 },
        ],
        512,
        160,
      ),
    [product.name],
  );
  useEffect(() => () => sign.dispose(), [sign]);
  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a2927", roughness: 0.4, metalness: 0.6 }), []);
  useEffect(() => () => frameMat.dispose(), [frameMat]);

  const W = 0.56;
  const H = 0.9;
  const cy = PLINTH.h + H / 2 + 0.02;
  return (
    <group>
      <Plinth x={x} title={`${String(index + 1).padStart(2, "0")} — ${product.name}`} sub="Bientôt" light={light} />
      {/* empty frame */}
      {[
        [0, H / 2, W, 0.012],
        [0, -H / 2, W, 0.012],
        [-W / 2, 0, 0.012, H],
        [W / 2, 0, 0.012, H],
      ].map(([dx, dy, w, h], i) => (
        <mesh key={i} position={[x + dx, cy + dy, 0]} material={frameMat} castShadow>
          <boxGeometry args={[w, h, 0.012]} />
        </mesh>
      ))}
      <mesh position={[x, cy, -0.005]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color="#141413" roughness={0.9} transparent opacity={0.85} />
      </mesh>
      <mesh position={[x, cy, 0.008]}>
        <planeGeometry args={[W * 0.9, W * 0.9 * (160 / 512)]} />
        <meshBasicMaterial map={sign} transparent toneMapped={false} />
      </mesh>
      <HitBox x={x} slug={product.slug} ref={registerHit} />
    </group>
  );
}
