import * as THREE from "three";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { crystalGeometry } from "./crystal-geometry";
import { useBottleModel, CRYSTAL_SURFACE_RE, KEYCHAIN_ANCHOR_RE } from "./models";
import type { BottleKind, CrystalShape } from "@/lib/hydrogem";

export interface BottleSurfaceInfo {
  topY: number;
  radius: number;
  radiusAtY: (y: number) => number;
  keychainAnchor: THREE.Vector3;
}

interface BottleProps {
  kind: BottleKind;
  color: string;
  accent: string;
  crystalShape: CrystalShape;
  crystalDensity?: number; // 0..1
  onSurface?: (info: BottleSurfaceInfo) => void;
}

const TARGET_HEIGHT = 3.2;

function lighten(color: THREE.Color, amount = 0.42) {
  return color.clone().lerp(new THREE.Color("#ffffff"), amount);
}

/**
 * Cover a surface mesh completely with crystals arranged on a regular
 * cylindrical grid (rows in Y, columns around the axis). Each slot is
 * ray-cast onto the real mesh so every crystal sits exactly on the skin.
 */
function buildCrystalGrid(surface: THREE.Mesh, spacing: number) {
  surface.updateWorldMatrix(true, false);
  const box = new THREE.Box3().setFromObject(surface);
  const cx = (box.min.x + box.max.x) / 2;
  const cz = (box.min.z + box.max.z) / 2;
  const height = box.max.y - box.min.y;
  const rMax = Math.max(box.max.x - cx, box.max.z - cz, 0.01);

  const rows = Math.max(3, Math.round(height / spacing));
  const cols = Math.max(10, Math.round((2 * Math.PI * rMax * 0.95) / spacing));

  const prevSide = (surface.material as THREE.Material).side;
  (surface.material as THREE.Material).side = THREE.DoubleSide;

  const ray = new THREE.Raycaster();
  ray.far = rMax * 4;
  const origin = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(surface.matrixWorld);

  const dummy = new THREE.Object3D();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const quat = new THREE.Quaternion();
  const matrices: number[] = [];
  const scale = spacing * 1.06;

  for (let r = 0; r < rows; r++) {
    const y = box.min.y + ((r + 0.5) / rows) * height;
    for (let c = 0; c < cols; c++) {
      const a = (c / cols) * Math.PI * 2;
      origin.set(cx, y, cz);
      dir.set(Math.cos(a), 0, Math.sin(a));
      ray.set(origin, dir);
      const hits = ray.intersectObject(surface, false);
      if (!hits.length) continue;
      const hit = hits[hits.length - 1];
      const n = hit.face
        ? hit.face.normal.clone().applyMatrix3(normalMatrix).normalize()
        : dir.clone();
      if (n.dot(dir) < 0) n.negate();

      dummy.position.copy(hit.point).addScaledVector(n, scale * 0.3);
      quat.setFromUnitVectors(zAxis, n);
      dummy.quaternion.copy(quat);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      for (let i = 0; i < 16; i++) matrices.push(dummy.matrix.elements[i]);
    }
  }

  (surface.material as THREE.Material).side = prevSide;
  return { matrices: new Float32Array(matrices), count: matrices.length / 16 };
}

export function Bottle({ kind, color, crystalShape, crystalDensity = 1, onSurface }: BottleProps) {
  const raw = useBottleModel(kind);

  // Clone + normalize the model. Colour changes must not rebuild geometry.
  const { model, topY, radius, colorMeshes, keychainAnchor, crystalSurface } = useMemo(() => {
    const model = raw.clone(true);

    const box0 = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box0.getSize(size);
    const scale = TARGET_HEIGHT / Math.max(size.y, 0.0001);
    model.scale.setScalar(scale);
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y;
    model.updateMatrixWorld(true);

    const finalBox = new THREE.Box3().setFromObject(model);
    const topY = finalBox.max.y;
    const s = new THREE.Vector3();
    finalBox.getSize(s);
    const radius = Math.max(s.x, s.z) / 2;

    let crystalSurface: THREE.Mesh | null = null;
    let anchorObject: THREE.Object3D | null = null;
    const meshes: THREE.Mesh[] = [];

    model.traverse((child) => {
      if (KEYCHAIN_ANCHOR_RE.test(child.name) && !(child as THREE.Mesh).isMesh) {
        anchorObject = child;
      }
      const m = child as THREE.Mesh;
      if (!m.isMesh) return;
      if (CRYSTAL_SURFACE_RE.test(m.name)) {
        crystalSurface = m;
        m.visible = false;
        return;
      }
      m.castShadow = true;
      m.receiveShadow = false;
      meshes.push(m);
    });

    // Build fresh materials so recolouring never mutates the cached glTF.
    const baseColor = new THREE.Color(color);
    const lightColor = lighten(baseColor);
    const colorMeshes: { mesh: THREE.Mesh; light: boolean }[] = [];

    if (kind === "tumbler") {
      // Simple flat finish: body takes the selected colour, lid stays black.
      for (const m of meshes) {
        const isLid = /model_0/i.test(m.name);
        const mat = new THREE.MeshStandardMaterial({
          color: isLid ? new THREE.Color("#141518") : baseColor.clone(),
          metalness: isLid ? 0.35 : 0.15,
          roughness: isLid ? 0.42 : 0.45,
        });
        m.material = mat;
        if (!isLid) colorMeshes.push({ mesh: m, light: false });
      }
    } else {
      // Saturated source materials are the recolourable parts; greys stay fixed.
      const info = meshes.map((m) => {
        const src = m.material as THREE.MeshStandardMaterial;
        const c = (src?.color ?? new THREE.Color("#888")).clone();
        const hsl = { h: 0, s: 0, l: 0 };
        c.getHSL(hsl);
        return { mesh: m, src, hsl };
      });
      // Coloured or bright (white plastic) parts take the selected colour;
      // dark greys / metals stay as authored.
      let tinted = info.filter((i) => i.hsl.s > 0.25 || i.hsl.l > 0.5);
      // Keep every tinted part on the exact selected colour.
      const allowLight = false;
      // Some models (e.g. Orbit Sip) ship desaturated materials — tint the
      // brighter parts so the selected colour is always visible.
      if (tinted.length === 0) tinted = info;
      const tintedSet = new Set(tinted.map((i) => i.mesh));
      const maxL = tinted.reduce((a, i) => Math.max(a, i.hsl.l), 0);
      for (const i of info) {
        const isTinted = tintedSet.has(i.mesh);
        const light = isTinted && allowLight && i.hsl.l >= maxL - 0.001;
        const mat = new THREE.MeshStandardMaterial({
          color: isTinted
            ? (light ? lightColor : baseColor).clone()
            : (i.src?.color?.clone() ?? new THREE.Color("#1a1c20")),
          metalness: isTinted ? 0.15 : (i.src?.metalness ?? 0.3),
          roughness: isTinted ? 0.42 : (i.src?.roughness ?? 0.45),
        });
        i.mesh.material = mat;
        if (isTinted) colorMeshes.push({ mesh: i.mesh, light });
      }
    }

    let keychainAnchor: THREE.Vector3;
    if (anchorObject) {
      keychainAnchor = new THREE.Vector3();
      (anchorObject as THREE.Object3D).getWorldPosition(keychainAnchor);
    } else {
      keychainAnchor = new THREE.Vector3(radius * 0.95, topY * 0.8, 0);
    }

    return {
      model,
      topY,
      radius,
      colorMeshes,
      keychainAnchor,
      crystalSurface: crystalSurface as THREE.Mesh | null,
    };
  }, [raw, kind]);

  // Free the per-instance materials when the model changes / unmounts.
  useEffect(() => {
    return () => {
      model.traverse((child) => {
        const m = child as THREE.Mesh;
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (!mat) return;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat.dispose();
      });
    };
  }, [model]);

  // Recolour without rebuilding geometry.
  useEffect(() => {
    const base = new THREE.Color(color);
    const light = lighten(base);
    for (const { mesh, light: isLight } of colorMeshes) {
      (mesh.material as THREE.MeshStandardMaterial).color.copy(isLight ? light : base);
    }
  }, [color, colorMeshes]);

  const radiusAtY = useMemo(() => () => radius, [radius]);

  useEffect(() => {
    onSurface?.({ topY, radius, radiusAtY, keychainAnchor });
  }, [topY, radius, radiusAtY, keychainAnchor, onSurface]);

  const crystalGeom = useMemo(() => crystalGeometry(crystalShape), [crystalShape]);

  const { matrices, count } = useMemo(() => {
    if (!crystalSurface) return { matrices: new Float32Array(0), count: 0 };
    const spacing = 0.066 / Math.max(crystalDensity, 0.5);
    return buildCrystalGrid(crystalSurface, spacing);
  }, [crystalSurface, crystalDensity]);

  const instRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const inst = instRef.current;
    if (!inst) return;
    if (!count) {
      inst.count = 0;
      inst.instanceMatrix.needsUpdate = true;
      return;
    }
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      m.fromArray(matrices, i * 16);
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
    inst.count = count;
  }, [matrices, count, crystalGeom]);

  return (
    <group>
      <primitive object={model} />
      {count > 0 && (
        <instancedMesh
          key={crystalShape}
          ref={instRef}
          args={[crystalGeom, undefined, count]}
          castShadow={false}
        >
          <meshStandardMaterial
            color={color}
            metalness={0.8}
            roughness={0.2}
            envMapIntensity={1.1}
          />
        </instancedMesh>
      )}
    </group>
  );
}
