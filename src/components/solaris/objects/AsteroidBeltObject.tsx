import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import type { AsteroidBeltData } from "../types";
import { auToScene } from "../utils/scaleAU";

interface AsteroidBeltObjectProps {
  belt: AsteroidBeltData;
  visible: boolean;
}

const DENSITY_COUNTS: Record<AsteroidBeltData["density"], number> = {
  sparse: 800,
  moderate: 2000,
  dense: 4000,
};

export function AsteroidBeltObject({ belt, visible }: AsteroidBeltObjectProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const count = DENSITY_COUNTS[belt.density];
  const innerRadius = auToScene(belt.innerAU);
  const outerRadius = auToScene(belt.outerAU);

  const matrices = useMemo(() => {
    const result: THREE.Matrix4[] = [];
    const tempMatrix = new THREE.Matrix4();
    const tempPosition = new THREE.Vector3();
    const tempQuaternion = new THREE.Quaternion();
    const tempScale = new THREE.Vector3();
    const tempEuler = new THREE.Euler();

    for (let i = 0; i < count; i++) {
      // Random position in the annular belt
      const angle = Math.random() * Math.PI * 2;
      const r = innerRadius + Math.random() * (outerRadius - innerRadius);
      const yOffset = (Math.random() - 0.5) * 0.6; // +/- 0.3

      tempPosition.set(
        Math.cos(angle) * r,
        yOffset,
        Math.sin(angle) * r
      );

      // Random rotation
      tempEuler.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      tempQuaternion.setFromEuler(tempEuler);

      // Random scale (size variation 0.02 - 0.08)
      const s = 0.02 + Math.random() * 0.06;
      tempScale.set(s, s, s);

      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      result.push(tempMatrix.clone());
    }

    return result;
  }, [count, innerRadius, outerRadius]);

  // Apply instance matrices on mount
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < matrices.length; i++) {
      meshRef.current.setMatrixAt(i, matrices[i]);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  if (!visible) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={belt.colorHex}
        emissive={belt.colorHex}
        emissiveIntensity={0.6}
        roughness={0.95}
      />
    </instancedMesh>
  );
}
