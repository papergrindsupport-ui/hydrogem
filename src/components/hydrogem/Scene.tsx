import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  AdaptiveDpr,
  AdaptiveEvents,
} from "@react-three/drei";
import { Suspense, useCallback, useEffect, useState } from "react";
import * as THREE from "three";
import { Bottle, type BottleSurfaceInfo } from "./Bottle";
import { Keychain } from "./Keychain";
import { Ambience } from "./Ambience";
import {
  BOTTLE_COLORS,
  type BottleKind,
  type CrystalShape,
  type BottleColorKey,
} from "@/lib/hydrogem";

interface SceneProps {
  kind: BottleKind;
  colorKey: BottleColorKey;
  crystalShape: CrystalShape;
  letter: string | null;
  dark: boolean;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

export function BottleScene({ kind, colorKey, crystalShape, letter, dark }: SceneProps) {
  const palette = BOTTLE_COLORS[colorKey];
  const bg = dark ? "#070b0e" : "#eef4f3";
  const mobile = useIsMobile();

  const [surface, setSurface] = useState<BottleSurfaceInfo>(() => ({
    topY: 3.0,
    radius: 0.6,
    radiusAtY: () => 0.6,
    keychainAnchor: new THREE.Vector3(0.6, 2.4, 0),
  }));
  const [keychainDragging, setKeychainDragging] = useState(false);
  const handleSurface = useCallback((info: BottleSurfaceInfo) => setSurface(info), []);

  return (
    <Canvas
      shadows={mobile ? false : "soft"}
      dpr={mobile ? [1, 1.2] : [1, 1.6]}
      camera={{ position: [4.5, 2.4, 4.5], fov: 40 }}
      gl={{
        antialias: !mobile,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: dark ? 1.15 : 1.0,
        powerPreference: "high-performance",
      }}
      style={{ background: bg }}
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 9, 20]} />

      {/* Balanced three-point studio rig */}
      <hemisphereLight
        args={[dark ? "#9fd9e8" : "#ffffff", dark ? "#0b1418" : "#cdd9d6", dark ? 0.55 : 0.9]}
      />
      <directionalLight
        position={[5, 8, 4]}
        intensity={dark ? 1.9 : 2.2}
        color="#ffffff"
        castShadow={!mobile}
        shadow-mapSize={[512, 512]}
        shadow-camera-near={0.5}
        shadow-camera-far={24}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0012}
        shadow-normalBias={0.02}
      />
      {/* fill */}
      <directionalLight position={[-6, 3.5, 3]} intensity={dark ? 0.65 : 0.8} color="#bfe5f2" />
      {/* rim */}
      <directionalLight position={[-2, 4, -6]} intensity={dark ? 1.1 : 0.7} color="#ffffff" />
      <pointLight
        position={[2.5, -0.5, 3]}
        intensity={dark ? 0.5 : 0.3}
        color="#81E6D9"
        distance={12}
      />

      {/* Env/ambience/shadows suspend silently; the model deliberately sits
          OUTSIDE any Suspense boundary here so its load bubbles up to
          <LazyScene>'s CSS loader until the bottle is fully ready. */}
      <Suspense fallback={null}>
        <Environment preset="studio" resolution={mobile ? 32 : 64} />
        <Ambience mobile={mobile} dark={dark} />

        <mesh position={[0, -1.605, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={!mobile}>
          <circleGeometry args={[7, 48]} />
          <meshStandardMaterial
            color={dark ? "#0e161b" : "#e4ecea"}
            roughness={0.95}
            metalness={0}
          />
        </mesh>

        <ContactShadows
          position={[0, -1.596, 0]}
          opacity={dark ? 0.7 : 0.42}
          scale={7}
          blur={2.6}
          far={2.8}
          frames={mobile ? 1 : 60}
          resolution={mobile ? 96 : 192}
          color="#000000"
        />
      </Suspense>

      <group position={[0, -1.6, 0]}>
        <Bottle
          kind={kind}
          color={palette.hex}
          accent={palette.accent}
          crystalShape={crystalShape}
          crystalDensity={mobile ? 0.55 : 0.9}
          onSurface={handleSurface}
        />
        {letter && (
          <Keychain
            letter={letter}
            color={palette.hex}
            accent={palette.accent}
            crystalShape={crystalShape}
            anchor={surface.keychainAnchor}
            onDragChange={setKeychainDragging}
          />
        )}
      </group>


      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <OrbitControls
        enablePan={false}
        enabled={!keychainDragging}
        minDistance={3}
        maxDistance={10}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.82}
        autoRotate
        autoRotateSpeed={0.3}
        enableDamping
        target={[0, 0.2, 0]}
      />
    </Canvas>
  );
}
