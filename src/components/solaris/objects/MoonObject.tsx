import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MoonData } from "../types";
import { phaseForIndex } from "../hooks/useOrbitalPosition";
import type { SolarisSim } from "../physics";

interface MoonObjectProps {
  moon: MoonData;
  index: number;
  sim: SolarisSim;
  parentRadius: number;
}

export function MoonObject({ moon, index, sim, parentRadius }: MoonObjectProps) {
  const groupRef = useRef<THREE.Group>(null);

  const orbitRadius = parentRadius * 2 + index * 0.5;
  const periodYears = moon.periodDays / 365.25;
  const moonRadius = Math.max(0.05, (moon.radiusKM / 6371) * 0.3);

  useFrame(() => {
    if (!groupRef.current) return;
    const angle = ((2 * Math.PI * sim.tYears) / Math.max(periodYears, 0.001)) + phaseForIndex(index);
    groupRef.current.position.x = Math.cos(angle) * orbitRadius;
    groupRef.current.position.z = Math.sin(angle) * orbitRadius;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[moonRadius, 16, 16]} />
        <meshStandardMaterial color={moon.colorHex} roughness={0.9} />
      </mesh>
    </group>
  );
}
