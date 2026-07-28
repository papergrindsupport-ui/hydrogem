import * as THREE from "three";
import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import type { BottleKind } from "@/lib/hydrogem";

export const MODEL_URLS: Record<BottleKind, string> = {
  tumbler: "/final_stanleyy.glb",
  sport: "/final_hydroflaskk.glb",
  twist: "/final_owalaa.glb",
};

useGLTF.preload(MODEL_URLS.tumbler);

/**
 * Load ONLY the selected bottle (suspends while fetching) and release the
 * other models from the GPU/CPU cache to keep memory usage low.
 */
export function useBottleModel(kind: BottleKind): THREE.Object3D {
  const url = MODEL_URLS[kind];
  const gltf = useGLTF(url);

  useEffect(() => {
    for (const [k, u] of Object.entries(MODEL_URLS)) {
      if (k !== kind) useGLTF.clear(u);
    }
  }, [kind]);

  return useMemo(() => gltf.scene, [gltf]);
}

export const CRYSTAL_SURFACE_RE = /crystals?_surface/i;
export const KEYCHAIN_ANCHOR_RE = /keychain_attach|^empty$/i;
