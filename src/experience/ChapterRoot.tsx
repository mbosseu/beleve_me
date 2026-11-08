"use client";

import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { activeChapterId } from "./progress";

interface ChapterRootProps {
  id: string;
  children: ReactNode;
  /**
   * Called every frame while this chapter is active — the place to own the
   * world's background and fog.
   */
  onActiveFrame?: (scene: THREE.Scene) => void;
}

/**
 * Wraps one chapter's 3D world. Only the active chapter is visible, so its
 * lights, shadows and draw calls cost nothing while another one plays.
 */
export default function ChapterRoot({ id, children, onActiveFrame }: ChapterRootProps) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    const active = activeChapterId() === id;
    if (group.current) group.current.visible = active;
    if (active) onActiveFrame?.(state.scene);
  });
  return <group ref={group}>{children}</group>;
}
