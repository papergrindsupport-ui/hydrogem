import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { crystalGeometry } from "./crystal-geometry";

interface AmbienceProps {
  /** fewer instances / simpler materials on small devices */
  mobile?: boolean;
  dark?: boolean;
}

/** Rising bubbles behind and around the bottle. */
function Bubbles({ count, dark }: { count: number; dark: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  // Heart-shaped bubbles.
  const geom = useMemo(() => crystalGeometry("heart"), []);

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 7,
        z: -1 - Math.random() * 3.5,
        y0: Math.random() * 6,
        speed: 0.18 + Math.random() * 0.35,
        scale: 0.06 + Math.random() * 0.11,
        sway: 0.15 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      })),
    [count],
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const inst = ref.current;
    if (!inst) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const y = ((s.y0 + t * s.speed) % 6.5) - 1.4;
      dummy.position.set(
        s.x + Math.sin(t * 0.6 + s.phase) * s.sway,
        y,
        s.z + Math.cos(t * 0.4 + s.phase) * s.sway * 0.5,
      );
      const fade = Math.min(1, (y + 1.4) / 0.8);
      dummy.scale.setScalar(s.scale * fade);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geom, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial
        color={dark ? "#bfeef0" : "#ffffff"}
        transparent
        opacity={0.3}
        roughness={0.15}
        metalness={0}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

/** Slowly bobbing, slowly "melting" (shrinking then reforming) ice cubes. */
function MeltingIce({ count, dark }: { count: number; dark: boolean }) {
  const geom = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.multiplyScalar(0.86 + Math.random() * 0.18);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const cubes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        base: new THREE.Vector3(
          (i % 2 === 0 ? -1 : 1) * (1.6 + Math.random() * 2.2),
          -1.35 + Math.random() * 0.25,
          -1.2 - Math.random() * 2.2,
        ),
        size: 0.24 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.25,
      })),
    [count],
  );

  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < cubes.length; i++) {
      const m = refs.current[i];
      if (!m) continue;
      const c = cubes[i];
      const melt = 0.55 + 0.45 * (0.5 + 0.5 * Math.cos(t * 0.16 + c.phase));
      m.scale.setScalar(c.size * melt);
      m.position.set(c.base.x, c.base.y + Math.sin(t * 0.5 + c.phase) * 0.03, c.base.z);
      m.rotation.y = t * c.spin + c.phase;
      m.rotation.x = Math.sin(t * 0.3 + c.phase) * 0.15;
    }
  });

  return (
    <group>
      {cubes.map((c, i) => (
        <mesh
          key={i}
          geometry={geom}
          ref={(n) => {
            refs.current[i] = n;
          }}
        >
          <meshStandardMaterial
            color={dark ? "#dff6ff" : "#ffffff"}
            transparent
            opacity={0.35}
            roughness={0.18}
            metalness={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function Ambience({ mobile = false, dark = true }: AmbienceProps) {
  return (
    <group>
      <Bubbles count={mobile ? 12 : 32} dark={dark} />
      <MeltingIce count={mobile ? 2 : 4} dark={dark} />
    </group>
  );
}
