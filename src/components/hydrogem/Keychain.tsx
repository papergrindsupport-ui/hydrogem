import * as THREE from "three";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { crystalGeometry } from "./crystal-geometry";
import type { CrystalShape } from "@/lib/hydrogem";

const FONT_URL = "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json";
const CHAIN_LINKS = 14;
const LINK_REST = 0.092;
const GOLD = "#f0c45c";

const SILVER = "#e6ecf3";

interface KeychainProps {
  letter: string;
  color: string;
  accent: string;
  crystalShape: CrystalShape;
  anchor: THREE.Vector3;
  onDragChange?: (dragging: boolean) => void;
  /** cheaper materials / fewer strands on phones */
  simple?: boolean;
}

interface ChainNode {
  position: THREE.Vector3;
  previous: THREE.Vector3;
}

function createChainNodes(): ChainNode[] {
  return Array.from({ length: CHAIN_LINKS + 1 }, (_, index) => {
    const position = new THREE.Vector3(0, -index * LINK_REST, 0);
    return { position, previous: position.clone() };
  });
}

export function Keychain({
  letter,
  color,
  accent,
  crystalShape,
  anchor,
  onDragChange,
  simple = false,
}: KeychainProps) {
  const { camera, gl } = useThree();
  const rootRef = useRef<THREE.Group>(null);
  const endRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const linkRefs = useRef<(THREE.Mesh | null)[]>([]);
  const chainRef = useRef<ChainNode[]>(createChainNodes());
  const dragTarget = useRef(new THREE.Vector3(0, -CHAIN_LINKS * LINK_REST, 0));
  const dragPlane = useRef(new THREE.Plane());
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    onDragChange?.(dragging);
    gl.domElement.style.cursor = dragging ? "grabbing" : "auto";
    return () => {
      gl.domElement.style.cursor = "auto";
    };
  }, [dragging, gl.domElement, onDragChange]);

  useFrame((_, delta) => {
    const nodes = chainRef.current;
    const fixed = nodes[0];
    fixed.position.set(0, 0, 0);
    fixed.previous.set(0, 0, 0);
    const dt = Math.min(delta, 0.033);
    const gravity = new THREE.Vector3(0, -6.5 * dt * dt, 0);

    for (let i = 1; i < nodes.length; i++) {
      const node = nodes[i];
      const vel = node.position.clone().sub(node.previous).multiplyScalar(0.9);
      node.previous.copy(node.position);
      node.position.add(vel).add(gravity);
    }

    for (let iter = 0; iter < 6; iter++) {
      fixed.position.set(0, 0, 0);
      for (let i = 1; i < nodes.length; i++) {
        const a = nodes[i - 1];
        const b = nodes[i];
        const d = b.position.clone().sub(a.position);
        const dist = Math.max(d.length(), 0.0001);
        const corr = d.multiplyScalar((dist - LINK_REST) / dist);
        if (i === 1) b.position.addScaledVector(corr, -1);
        else {
          a.position.addScaledVector(corr, 0.5);
          b.position.addScaledVector(corr, -0.5);
        }
      }
      if (dragging) nodes[nodes.length - 1].position.lerp(dragTarget.current, 0.6);
    }

    const yAxis = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < CHAIN_LINKS; i++) {
      const link = linkRefs.current[i];
      if (!link) continue;
      const a = nodes[i].position;
      const b = nodes[i + 1].position;
      link.position.copy(a).add(b).multiplyScalar(0.5);
      link.quaternion.setFromUnitVectors(yAxis, b.clone().sub(a).normalize());
      link.rotateZ(i % 2 === 0 ? Math.PI / 2 : 0);
    }

    // First ring stays pinned to the bottle but swings with the chain load.
    const ring = ringRef.current;
    if (ring) {
      const dir = nodes[1].position.clone().sub(nodes[0].position);
      const len = Math.max(dir.length(), 0.0001);
      ring.rotation.z = THREE.MathUtils.clamp(-dir.x / len, -1, 1) * 0.6;
      ring.rotation.x = Math.PI / 2 + THREE.MathUtils.clamp(dir.z / len, -1, 1) * 0.6;
    }

    const end = endRef.current;
    if (end) {
      const last = nodes[nodes.length - 1];
      end.position.copy(last.position);
      end.lookAt(camera.position);
    }
  });

  function setPointerCursor(cursor: string) {
    if (dragging) return;
    gl.domElement.style.cursor = cursor;
  }

  function updateDragTarget(event: ThreeEvent<PointerEvent>) {
    const root = rootRef.current;
    if (!root) return;
    const hit = new THREE.Vector3();
    if (event.ray.intersectPlane(dragPlane.current, hit)) {
      dragTarget.current.copy(root.worldToLocal(hit));
    }
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    const root = rootRef.current;
    const end = endRef.current;
    if (!root || !end) return;
    const endWorld = new THREE.Vector3();
    end.getWorldPosition(endWorld);
    const normal = new THREE.Vector3();
    camera.getWorldDirection(normal);
    dragPlane.current.setFromNormalAndCoplanarPoint(normal, endWorld);
    updateDragTarget(event);
    const t = event.target as EventTarget & { setPointerCapture?: (id: number) => void };
    t.setPointerCapture?.(event.pointerId);
    setDragging(true);
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    if (!dragging) return;
    event.stopPropagation();
    updateDragTarget(event);
  }

  function handlePointerUp(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    const t = event.target as EventTarget & { releasePointerCapture?: (id: number) => void };
    t.releasePointerCapture?.(event.pointerId);
    setDragging(false);
  }

  return (
    <group ref={rootRef} position={anchor}>
      {/* Ring clip that stays hooked to the bottle but swings with the chain */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.095, 0.021, 14, 32]} />
        <meshStandardMaterial
          color={GOLD}
          metalness={1}
          roughness={0.14}
          envMapIntensity={2.6}
          emissive={GOLD}
          emissiveIntensity={0.12}
        />
      </mesh>

      {Array.from({ length: CHAIN_LINKS }).map((_, i) => (
        <mesh
          key={i}
          ref={(node) => {
            linkRefs.current[i] = node;
          }}
        >
          <torusGeometry args={[0.046, 0.015, 10, 20]} />
          <meshStandardMaterial
            color={GOLD}
            metalness={1}
            roughness={0.15}
            envMapIntensity={2.8}
            emissive={GOLD}
            emissiveIntensity={0.12}
          />
        </mesh>
      ))}

      <group
        ref={endRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerOver={() => setPointerCursor("grab")}
        onPointerOut={() => setPointerCursor("auto")}
      >
        {/* Glass heart charm sits above the letter */}
        <group position={[0, -0.16, 0]}>
          <GlassHeart color={color} simple={simple} />
        </group>
        <group position={[0, -0.5, 0]}>
          <CrystalStuddedLetter
            letter={letter}
            color={color}
            accent={accent}
            crystalShape={crystalShape}
          />
        </group>
        <group position={[0, -0.82, 0]}>
          <Tassel color={color} accent={accent} simple={simple} />
        </group>
      </group>
    </group>
  );
}

function CrystalStuddedLetter({
  letter,
  color,
  accent,
  crystalShape,
}: {
  letter: string;
  color: string;
  accent: string;
  crystalShape: CrystalShape;
}) {
  const font = useLoader(FontLoader, FONT_URL) as unknown as Font;

  const letterGeom = useMemo(() => {
    const g = new TextGeometry(letter.toUpperCase(), {
      font,
      size: 0.32,
      depth: 0.1,
      curveSegments: 6,
      bevelEnabled: true,
      bevelSize: 0.014,
      bevelThickness: 0.02,
      bevelSegments: 2,
    });
    g.computeBoundingBox();
    g.center();
    return g;
  }, [font, letter]);

  const crystalGeom = useMemo(() => crystalGeometry(crystalShape), [crystalShape]);

  const placements = useMemo(() => {
    letterGeom.computeBoundingBox();
    const box = letterGeom.boundingBox;
    if (!box) return [];
    const mesh = new THREE.Mesh(letterGeom);
    mesh.updateMatrixWorld(true);
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3(0, 0, -1);
    const cell = 0.036;
    const zFront = box.max.z;
    const list: { p: THREE.Vector3; n: THREE.Vector3 }[] = [];
    for (let y = box.min.y + cell * 0.5; y <= box.max.y - cell * 0.2; y += cell) {
      const row = Math.round((y - box.min.y) / cell);
      const offset = row % 2 === 0 ? 0 : cell * 0.5;
      for (let x = box.min.x + cell * 0.5 + offset; x <= box.max.x - cell * 0.2; x += cell) {
        raycaster.set(new THREE.Vector3(x, y, zFront + 0.5), direction);
        const [hit] = raycaster.intersectObject(mesh, false);
        if (!hit) continue;
        const normal = hit.face?.normal.clone() ?? new THREE.Vector3(0, 0, 1);
        if (normal.z < 0.4) continue;
        list.push({ p: new THREE.Vector3(x, y, zFront + 0.005), n: normal.normalize() });
      }
    }
    return list;
  }, [letterGeom]);

  const instRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const inst = instRef.current;
    if (!inst) return;
    if (!placements.length) {
      inst.count = 0;
      inst.instanceMatrix.needsUpdate = true;
      return;
    }
    const dummy = new THREE.Object3D();
    const zAxis = new THREE.Vector3(0, 0, 1);
    const quat = new THREE.Quaternion();
    for (let i = 0; i < placements.length; i++) {
      const { p, n } = placements[i];
      dummy.position.set(p.x, p.y, p.z + 0.005);
      quat.setFromUnitVectors(zAxis, n);
      dummy.quaternion.copy(quat);
      dummy.scale.setScalar(0.014 + (i % 4) * 0.001);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    inst.count = placements.length;
  }, [placements, crystalGeom]);

  return (
    <group>
      <mesh geometry={letterGeom}>
        <meshStandardMaterial
          color={color}
          metalness={0.55}
          roughness={0.3}
          envMapIntensity={1.3}
          emissive={accent}
          emissiveIntensity={0.08}
        />
      </mesh>
      {placements.length > 0 && (
        <instancedMesh
          key={crystalShape}
          ref={instRef}
          args={[crystalGeom, undefined, placements.length]}
        >
          <meshPhysicalMaterial
            color="#f7fbff"
            metalness={0.9}
            roughness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.05}
            envMapIntensity={2.4}
          />
        </instancedMesh>
      )}
    </group>
  );
}

function GlassHeart({ color, simple = false }: { color: string; simple?: boolean }) {
  const geom = useMemo(() => crystalGeometry("heart"), []);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.8) * 0.35;
  });
  return (
    <mesh ref={ref} geometry={geom} scale={0.42}>
      {simple ? (
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.75}
          roughness={0.1}
          metalness={0.2}
          envMapIntensity={2}
        />
      ) : (
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.65}
          roughness={0.06}
          metalness={0}
          transmission={0.9}
          thickness={0.35}
          ior={1.45}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      )}
    </mesh>
  );
}

const STRAND_COUNT = 12;

function Tassel({
  color,
  accent,
  simple = false,
}: {
  color: string;
  accent: string;
  simple?: boolean;
}) {
  const count = simple ? 7 : STRAND_COUNT;
  const strands = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2;
        const spread = 0.05 + (index % 5) * 0.008;
        const length = 0.28 + (index % 4) * 0.018;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(Math.cos(angle) * 0.018, 0, Math.sin(angle) * 0.018),
          new THREE.Vector3(
            Math.cos(angle) * spread * 0.85,
            -length * 0.35,
            Math.sin(angle) * spread * 0.85,
          ),
          new THREE.Vector3(Math.cos(angle) * spread, -length * 0.72, Math.sin(angle) * spread),
          new THREE.Vector3(
            Math.cos(angle) * spread * 0.78,
            -length,
            Math.sin(angle) * spread * 0.78,
          ),
        ]);
        return {
          geometry: new THREE.TubeGeometry(curve, 8, 0.005, 4, false),
          phase: index * 0.7,
          axis: new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)),
        };
      }),
    [count],
  );

  const groupRef = useRef<THREE.Group>(null);
  const strandRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(t * 1.1) * 0.04;
      groupRef.current.rotation.x = Math.cos(t * 0.85) * 0.03;
    }
    for (let i = 0; i < strands.length; i++) {
      const mesh = strandRefs.current[i];
      if (!mesh) continue;
      const s = strands[i];
      const wobble = Math.sin(t * 1.6 + s.phase) * 0.06;
      mesh.quaternion.setFromAxisAngle(s.axis, wobble);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.09, 20]} />
        <meshStandardMaterial
          color={SILVER}
          metalness={0.85}
          roughness={0.2}
          envMapIntensity={2.1}
        />
      </mesh>
      <mesh position={[0, -0.03, 0]}>
        <cylinderGeometry args={[0.058, 0.058, 0.03, 20]} />
        <meshStandardMaterial color={accent} metalness={0.1} roughness={0.5} />
      </mesh>
      {strands.map((strand, index) => (
        <mesh
          key={index}
          geometry={strand.geometry}
          position={[0, -0.04, 0]}
          ref={(node) => {
            strandRefs.current[index] = node;
          }}
        >
          <meshPhysicalMaterial
            color={color}
            metalness={0}
            roughness={0.8}
            sheen={0.5}
            sheenRoughness={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}
