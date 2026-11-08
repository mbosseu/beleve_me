"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import CameraPath, { type CameraOverride } from "@/animation/CameraPath";
import { products } from "@/data/products";
import ChapterRoot from "@/experience/ChapterRoot";
import { activeChapterId } from "@/experience/progress";
import { useExperience } from "@/experience/store";
import { ComingSoonDisplay, ProductDisplay } from "./Display";
import { CAMERA_DESKTOP, CAMERA_MOBILE, WALL_Z, focusShot, productX, slotX, step } from "./layout";
import { picking } from "./picking";

const isUi = (t: EventTarget | null) =>
  t instanceof Element && !!t.closest("button, a, nav, input, select, [data-ui]");

/**
 * SCENE 05 — THE COLLECTION
 * The studio steps back into a showroom. Each piece of the catalogue has its
 * display; clicking one flies the camera to it and opens its sheet.
 */
export default function CollectionScene() {
  const caps = useExperience((s) => s.caps);
  const isMobile = caps?.isMobile ?? false;
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const hits = useRef<THREE.Mesh[]>([]);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const override = useRef<CameraOverride>({ weight: 0, position: new THREE.Vector3(), target: new THREE.Vector3() });

  const environment = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return env;
  }, [gl]);
  useEffect(() => () => environment.dispose(), [environment]);

  const world = useMemo(
    () => ({ background: new THREE.Color("#0b0b0a"), fog: new THREE.Fog("#0b0b0a", 6, 16) }),
    [],
  );

  const pick = (clientX: number, clientY: number) => {
    ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(hits.current, false)[0];
    return (hit?.object.userData.slug as string | undefined) ?? null;
  };

  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
    const w = window as unknown as { __bm?: Record<string, unknown> };
    if (w.__bm) {
      w.__bm.pick = pick;
      w.__bm.camera = camera;
      w.__bm.hits = hits;
    }
  }

  // Click / tap to open a piece. Listens on window: the scroll sections sit
  // above the canvas.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (activeChapterId() !== "collection" || isUi(e.target)) return;
      if (useExperience.getState().focusedProduct) return;
      const slug = pick(e.clientX, e.clientY);
      if (slug) useExperience.getState().focus(slug);
    };
    const onMove = (e: PointerEvent) => {
      picking.pointer.x = e.clientX;
      picking.pointer.y = e.clientY;
      picking.pointer.inside = e.pointerType === "mouse";
    };
    window.addEventListener("click", onClick);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("pointermove", onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  useFrame((_, delta) => {
    const active = activeChapterId() === "collection";
    const { focusedProduct } = useExperience.getState();
    // Hover (mouse only)
    const hovered = active && picking.pointer.inside && !focusedProduct ? pick(picking.pointer.x, picking.pointer.y) : null;
    if (hovered !== picking.hovered) {
      picking.hovered = hovered;
      document.documentElement.style.cursor = hovered ? "pointer" : "";
    }
    // Focus shot
    const o = override.current;
    if (focusedProduct) focusShot(productX(focusedProduct), isMobile, o.position, o.target);
    const target = focusedProduct ? 1 : 0;
    o.weight += (target - o.weight) * (1 - Math.exp(-Math.min(delta, 0.05) * 2.4));
  });

  // Displays rise from the dark as the camera steps back.
  const reveal = () => step(0.02, 0.16);

  return (
    <ChapterRoot
      id="collection"
      onActiveFrame={(scene) => {
        scene.background = world.background;
        scene.fog = world.fog;
        scene.environment = environment;
        scene.environmentIntensity = 0.18;
      }}
    >
      <hemisphereLight args={["#d9d4ca", "#050505", 0.18]} />
      {/* Polished concrete floor + wall */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 20]} />
        <meshLambertMaterial color="#141413" />
      </mesh>
      <mesh position={[0, 3, WALL_Z]} receiveShadow>
        <planeGeometry args={[40, 8]} />
        <meshLambertMaterial color="#121211" />
      </mesh>

      {products.map((p, i) => {
        const props = {
          product: p,
          index: i,
          x: slotX(i),
          reveal,
          registerHit: (m: THREE.Mesh | null) => {
            if (m && !hits.current.includes(m)) hits.current.push(m);
          },
        };
        return p.status === "available" ? (
          <ProductDisplay key={p.slug} {...props} />
        ) : (
          <ComingSoonDisplay key={p.slug} {...props} />
        );
      })}

      <CameraPath
        chapter="collection"
        desktop={CAMERA_DESKTOP}
        mobile={CAMERA_MOBILE}
        fov={[34, 48]}
        parallax={[0.1, 0.05]}
        parallaxFade={[0.9, 1]}
        override={override}
      />
    </ChapterRoot>
  );
}
