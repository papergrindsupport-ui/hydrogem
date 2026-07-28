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
  palette?: { hex: string; accent: string };
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

export function BottleScene({
  kind,
  colorKey,
  palette: paletteOverride,
  crystalShape,
  letter,
  dark,
}: SceneProps) {
  const palette = paletteOverride ?? BOTTLE_COLORS[colorKey];
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
        toneMappingExposure: dark ? 1.35 : 1.15,
        powerPreference: "high-performance",
      }}
      style={{ background: bg }}
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 9, 20]} />

      {/* Balanced three-point studio rig — neutral key, gentle cool fill, warm rim */}
      <ambientLight intensity={dark ? 0.35 : 0.55} color={dark ? "#c9dde6" : "#ffffff"} />
      <hemisphereLight
        args={[dark ? "#dfeef5" : "#ffffff", dark ? "#0e1a20" : "#c8d3d0", dark ? 0.45 : 0.75]}
      />
      <directionalLight
        position={[5, 8, 4]}
        intensity={dark ? 1.6 : 1.8}
        color="#ffffff"
        castShadow={!mobile}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={24}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0012}
        shadow-normalBias={0.03}
        shadow-radius={6}
      />
      {/* soft cool fill from the opposite side */}
      <directionalLight position={[-6, 3.5, 3]} intensity={dark ? 0.5 : 0.55} color="#d6ecf5" />
      {/* warm rim from behind for separation */}
      <directionalLight position={[-2, 4, -6]} intensity={dark ? 0.9 : 0.6} color="#ffe6c7" />

      {/* Env/ambience/shadows suspend silently; the model deliberately sits
          OUTSIDE any Suspense boundary here so its load bubbles up to
          <LazyScene>'s CSS loader until the bottle is fully ready. */}
      <Suspense fallback={null}>
        <Environment preset="studio" resolution={mobile ? 32 : 64} />
        <Ambience mobile={mobile} dark={dark} />

        <mesh position={[0, -1.605, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={!mobile}>
          <circleGeometry args={[7, 48]} />
          <meshStandardMaterial
            color={dark ? "#0b1a24" : "#dbe8ef"}
            roughness={0.9}
            metalness={0.05}
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
