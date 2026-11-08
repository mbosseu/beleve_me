"use client";

import { forwardRef, useEffect, useMemo } from "react";
import { Decal, useTexture } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { createWeaveTexture } from "@/scenes/03-creation/textures";
import { BODY, buildBody, buildHood, buildSleeve, frontSurfaceZ, frontZ } from "./geometry";

/**
 * Turns a crop of the real embroidery (photographed on black nylon) into a
 * decal: thread pixels stay, the black fabric becomes transparent.
 */
function useEmbroidery(url: string) {
  const src = useTexture(url);
  const tex = useMemo(() => {
    const img = src.image as HTMLImageElement;
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, img.width, img.height);
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      const lum = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
      const a = THREE.MathUtils.smoothstep(lum, 72, 150);
      px[i + 3] = Math.round(a * 255);
    }
    ctx.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [src]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function EmbroideryMaterial({ map }: { map: THREE.Texture }) {
  return (
    <meshStandardMaterial
      map={map}
      bumpMap={map}
      bumpScale={2.2}
      roughness={0.55}
      transparent
      alphaTest={0.08}
      polygonOffset
      polygonOffsetFactor={-6}
      depthWrite={false}
    />
  );
}

const TEETH_STEP = 0.0046;

/**
 * The BELIEVE ME doudoune, procedural — black matte nylon, five baffles,
 * BM monogram on the chest, the produced botanical embroidery on the back.
 */
const Doudoune = forwardRef<THREE.Group, ThreeElements["group"]>(function Doudoune(props, ref) {
  const back = useEmbroidery("/textures/embroidery-back.jpg");
  const chest = useEmbroidery("/textures/embroidery-chest.jpg");
  const ripstop = useMemo(() => createWeaveTexture(256, 6), []);

  const parts = useMemo(() => {
    const body = buildBody();
    const left = buildSleeve(-1);
    const right = buildSleeve(1);
    const hood = buildHood();
    return { body, left, right, hood };
  }, []);

  const nylon = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#080808",
        roughness: 0.62,
        sheen: 0.55,
        sheenColor: new THREE.Color("#3c3c3c"),
        sheenRoughness: 0.45,
        clearcoat: 0.0,
        clearcoatRoughness: 0.5,
        bumpMap: ripstop,
        bumpScale: 0.06,
        side: THREE.DoubleSide,
      }),
    [ripstop],
  );
  const lining = useMemo(() => new THREE.MeshStandardMaterial({ color: "#050505", roughness: 0.9 }), []);
  const metal = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#d6d6d6", metalness: 1, roughness: 0.22 }),
    [],
  );

  useEffect(
    () => () => {
      [parts.body, parts.hood, parts.left.geometry, parts.right.geometry].forEach((g) => g.dispose());
      [nylon, lining, metal, ripstop].forEach((m) => m.dispose());
    },
    [parts, nylon, lining, metal, ripstop],
  );

  // Central zip: teeth follow the front groove from hem to collar.
  const zip = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.011, 0.0028, 0.004);
    const collarH = 0.075;
    const total = BODY.height + collarH;
    const count = Math.floor(total / TEETH_STEP);
    const mesh = new THREE.InstancedMesh(geo, metal, count);
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const y = 0.004 + i * TEETH_STEP;
      const z = y <= BODY.height ? frontZ(y / BODY.height) - 0.0035 : 0.1;
      o.position.set(i % 2 ? 0.0015 : -0.0015, y, z);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    }
    mesh.castShadow = true;
    return mesh;
  }, [metal]);
  useEffect(() => () => zip.geometry.dispose(), [zip]);

  const pocket = (side: 1 | -1) => {
    const v = 0.3;
    const x = 0.175 * side;
    const z = frontSurfaceZ(x, v) + 0.001;
    const yaw = Math.atan2(x / (BODY.rx * BODY.rx), z / (BODY.rz * BODY.rz));
    return (
      <mesh position={[x, v * BODY.height, z]} rotation={[0, yaw, 0.14 * side]} material={lining}>
        <boxGeometry args={[0.006, 0.105, 0.006]} />
      </mesh>
    );
  };

  const chestV = 0.74;
  const chestX = 0.118;

  return (
    <group ref={ref} {...props}>
      <mesh geometry={parts.body} material={nylon} castShadow receiveShadow>
        <Decal
          position={[chestX, chestV * BODY.height, frontSurfaceZ(chestX, chestV)]}
          rotation={[0, 0.35, 0]}
          scale={[0.088, 0.05, 0.12]}
        >
          <EmbroideryMaterial map={chest} />
        </Decal>
        <Decal position={[0, 0.335, -0.2]} rotation={[0, Math.PI, 0]} scale={[0.3, 0.347, 0.3]}>
          <EmbroideryMaterial map={back} />
        </Decal>
      </mesh>

      {[parts.left, parts.right].map((s, i) => (
        <group key={i}>
          <mesh geometry={s.geometry} material={nylon} castShadow receiveShadow />
          {/* Dark cuff opening */}
          <mesh
            position={s.cuffEnd}
            quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), s.cuffDir)}
            material={lining}
          >
            <circleGeometry args={[0.049, 32]} />
          </mesh>
        </group>
      ))}

      {/* Stand-up collar */}
      <mesh position={[0, BODY.height + 0.022, 0]} scale={[1, 1, 0.94]} material={nylon} castShadow>
        <cylinderGeometry args={[0.104, 0.112, 0.06, 64, 1, true]} />
      </mesh>

      {/* Hood, resting up behind the collar */}
      <mesh
        geometry={parts.hood}
        material={nylon}
        position={[0, BODY.height + 0.085, -0.06]}
        rotation={[-0.12, 0, 0]}
        scale={[0.98, 1.3, 1.18]}
        castShadow
        receiveShadow
      />

      <primitive object={zip} />
      {/* Zip slider + pull, drawn up to the chest */}
      <group position={[0, BODY.height * 0.93, frontZ(0.93) + 0.002]}>
        <mesh material={metal} castShadow>
          <boxGeometry args={[0.016, 0.026, 0.008]} />
        </mesh>
        <mesh material={metal} position={[0, -0.03, 0.004]} castShadow>
          <boxGeometry args={[0.012, 0.036, 0.002]} />
        </mesh>
      </group>
      {/* Bottom stop */}
      <mesh material={metal} position={[0, 0.006, frontZ(0.01)]}>
        <boxGeometry args={[0.016, 0.01, 0.006]} />
      </mesh>

      {pocket(1)}
      {pocket(-1)}
    </group>
  );
});

export default Doudoune;
