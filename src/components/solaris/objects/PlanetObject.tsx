import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PlanetData } from "../types";
import { radiusToScene, auToScene } from "../utils/scaleAU";
import { getPlanetMaterial } from "../utils/planetColor";
import { MoonObject } from "./MoonObject";
import type { SolarisSim } from "../physics";

interface PlanetObjectProps {
  planet: PlanetData;
  sim: SolarisSim;
  index: number;
  onClick?: () => void;
  selected?: boolean;
  showMoons?: boolean;
}

export function PlanetObject({ planet, sim, index, onClick, selected = false, showMoons = true }: PlanetObjectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const radius = radiusToScene(planet.radiusEarth);
  const material = getPlanetMaterial(planet.type);
  const tiltRad = (planet.axialTiltDeg * Math.PI) / 180;
  const spinSpeed = 0.3 / radius;

  useFrame((_state, delta) => {
    const p = sim.planets[index];
    if (groupRef.current && p) groupRef.current.position.set(auToScene(p.x), 0, auToScene(p.z));
    if (meshRef.current) meshRef.current.rotation.y += delta * spinSpeed;
  });

  return (
    <group ref={groupRef}>
      <group rotation={[tiltRad, 0, 0]}>
        <mesh ref={meshRef} onClick={onClick}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial
            color={planet.colorHex}
            roughness={material.roughness}
            metalness={material.metalness}
            emissive={planet.inHabitableZone ? "#22CC66" : "#000000"}
            emissiveIntensity={planet.inHabitableZone ? 0.15 : 0}
          />
        </mesh>

        {planet.atmosphereColorHex && (
          <mesh>
            <sphereGeometry args={[radius * 1.15, 32, 32]} />
            <meshBasicMaterial color={planet.atmosphereColorHex} transparent opacity={0.15} side={THREE.FrontSide} depthWrite={false} />
          </mesh>
        )}

        {planet.hasRings && (
          <mesh rotation={[(30 * Math.PI) / 180, 0, 0]} scale={[1, 0.02, 1]}>
            <torusGeometry args={[radius * 2.5, radius * 0.3, 2, 64]} />
            <meshBasicMaterial color={planet.ringColorHex ?? "#AAAAAA"} transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>

      {selected && (
        <spotLight position={[0, radius * 3, 0]} target-position={[0, 0, 0]} intensity={0.5} color="#ffffff" angle={0.5} penumbra={0.8} distance={radius * 10} />
      )}

      {showMoons && planet.moons.map((moon, moonIdx) => (
        <MoonObject key={moon.name} moon={moon} index={moonIdx} sim={sim} parentRadius={radius} />
      ))}
    </group>
  );
}
