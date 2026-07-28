import * as THREE from "three";
import type { CrystalShape } from "@/lib/hydrogem";

function heartShape(): THREE.Shape {
  const s = new THREE.Shape();
  const x = 0,
    y = 0;
  s.moveTo(x, y);
  s.bezierCurveTo(x, y + 0.3, x - 0.6, y + 0.5, x - 0.6, y);
  s.bezierCurveTo(x - 0.6, y - 0.4, x - 0.3, y - 0.6, x, y - 0.9);
  s.bezierCurveTo(x + 0.3, y - 0.6, x + 0.6, y - 0.4, x + 0.6, y);
  s.bezierCurveTo(x + 0.6, y + 0.5, x, y + 0.3, x, y);
  return s;
}

function starShape(points = 5, outer = 0.55, inner = 0.24): THREE.Shape {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

/** Cached geometry for each crystal shape. Radius ~= 0.5 units, then scaled. */
export function crystalGeometry(shape: CrystalShape): THREE.BufferGeometry {
  switch (shape) {
    case "diamond": {
      const g = new THREE.OctahedronGeometry(0.5, 0);
      g.scale(1, 1.3, 1);
      return g;
    }
    case "circle": {
      const g = new THREE.SphereGeometry(0.42, 12, 8);
      g.scale(1, 1, 0.55);
      return g;
    }
    case "square": {
      const g = new THREE.BoxGeometry(0.7, 0.7, 0.35);
      return g;
    }
    case "star": {
      const g = new THREE.ExtrudeGeometry(starShape(), {
        depth: 0.25,
        bevelEnabled: true,
        bevelSize: 0.05,
        bevelThickness: 0.08,
        bevelSegments: 2,
        curveSegments: 6,
      });
      g.center();
      return g;
    }
    case "heart": {
      const g = new THREE.ExtrudeGeometry(heartShape(), {
        depth: 0.25,
        bevelEnabled: true,
        bevelSize: 0.05,
        bevelThickness: 0.08,
        bevelSegments: 2,
        curveSegments: 8,
      });
      g.center();
      g.scale(0.9, 0.9, 0.9);
      return g;
    }
  }
}
