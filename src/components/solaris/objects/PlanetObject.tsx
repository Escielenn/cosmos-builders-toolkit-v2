import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PlanetData } from "../types";
import { radiusToScene } from "../utils/scaleAU";
import { getPlanetMaterial } from "../utils/planetColor";
import { keplerPosition, phaseForIndex } from "../hooks/useOrbitalPosition";
import { MoonObject } from "./MoonObject";

interface PlanetObjectProps {
  planet: PlanetData;
  index: number;
  timeYears: number;
  onClick?: () => void;
  selected?: boolean;
  showMoons?: boolean;
}

export function PlanetObject({
  planet,
  index,
  timeYears,
  onClick,
  selected = false,
  showMoons = true,
}: PlanetObjectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const radius = radiusToScene(planet.radiusEarth);
  const material = getPlanetMaterial(planet.type);
  const tiltRad = (planet.axialTiltDeg * Math.PI) / 180;
  const spinSpeed = 0.3 / radius;

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    // Update orbital position
    const [x, z] = keplerPosition(
      planet.semiMajorAxisAU,
      planet.eccentricity,
      planet.orbitalPeriodYears,
      timeYears,
      phaseForIndex(index)
    );
    groupRef.current.position.set(x, 0, z);

    // Self-rotation
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * spinSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Axial tilt wrapper */}
      <group rotation={[tiltRad, 0, 0]}>
        {/* Planet sphere */}
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

        {/* Atmosphere shell */}
        {planet.atmosphereColorHex && (
          <mesh>
            <sphereGeometry args={[radius * 1.15, 32, 32]} />
            <meshBasicMaterial
              color={planet.atmosphereColorHex}
              transparent
              opacity={0.15}
              side={THREE.FrontSide}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Ring system */}
        {planet.hasRings && (
          <mesh rotation={[30 * Math.PI / 180, 0, 0]} scale={[1, 0.02, 1]}>
            <torusGeometry args={[radius * 2.5, radius * 0.3, 2, 64]} />
            <meshBasicMaterial
              color={planet.ringColorHex ?? "#AAAAAA"}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      {/* Selection spotlight */}
      {selected && (
        <spotLight
          position={[0, radius * 3, 0]}
          target-position={[0, 0, 0]}
          intensity={0.5}
          color="#ffffff"
          angle={0.5}
          penumbra={0.8}
          distance={radius * 10}
        />
      )}

      {/* Moons orbit in the untilted frame */}
      {showMoons && planet.moons.map((moon, moonIdx) => (
        <MoonObject
          key={moon.name}
          moon={moon}
          index={moonIdx}
          timeYears={timeYears}
          parentRadius={radius}
        />
      ))}
    </group>
  );
}
