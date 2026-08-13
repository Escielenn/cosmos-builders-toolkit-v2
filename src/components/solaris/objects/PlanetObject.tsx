import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { PlanetData } from "../types";
import { radiusToScene, auToScene } from "../utils/scaleAU";
import { getPlanetMaterial } from "../utils/planetColor";
import { getPlanetTexture } from "../utils/planetTexture";
import { MoonObject } from "./MoonObject";
import type { SolarisSim } from "../physics";

interface PlanetObjectProps {
  planet: PlanetData;
  sim: SolarisSim;
  index: number;
  onClick?: () => void;
  /** Begin a drag-to-reorbit. Omit to make the planet immovable. */
  onDragStart?: () => void;
  selected?: boolean;
  showMoons?: boolean;
  showLabel?: boolean;
}

export function PlanetObject({ planet, sim, index, onClick, onDragStart, selected = false, showMoons = true, showLabel = false }: PlanetObjectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const radius = radiusToScene(planet.radiusEarth);
  const material = getPlanetMaterial(planet.type);
  // Cached per type and colour, so this is a map lookup after the first planet
  // of a given appearance. Null where no canvas exists; the flat tint stands in.
  const texture = getPlanetTexture(planet.type, planet.colorHex);
  const tiltRad = (planet.axialTiltDeg * Math.PI) / 180;
  const spinSpeed = 0.3 / radius;

  useFrame((_state, delta) => {
    const p = sim.planets[index];
    if (groupRef.current && p) groupRef.current.position.set(auToScene(p.x), 0, auToScene(p.z));
    if (meshRef.current) meshRef.current.rotation.y += delta * spinSpeed;
  });

  const hitRadius = Math.max(radius * 2.6, 0.9);

  return (
    <group ref={groupRef}>
      {/* Invisible, larger hit-area so small planets are easy to click, select
          and grab. Also carries the drag start and the grab cursor. */}
      <mesh
        onClick={onClick}
        onPointerDown={
          onDragStart
            ? (e) => {
                // Keep the same gesture from also orbiting the camera.
                e.stopPropagation();
                onDragStart();
              }
            : undefined
        }
        onPointerOver={
          onDragStart
            ? () => {
                document.body.style.cursor = "grab";
              }
            : undefined
        }
        onPointerOut={
          onDragStart
            ? () => {
                document.body.style.cursor = "";
              }
            : undefined
        }
      >
        <sphereGeometry args={[hitRadius, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group rotation={[tiltRad, 0, 0]}>
        <mesh ref={meshRef} onClick={onClick}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial
            map={texture ?? undefined}
            // The texture already carries the planet's colour, so tinting it
            // again would double-darken it. White lets the map through as painted.
            color={texture ? "#ffffff" : planet.colorHex}
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
        <MoonObject key={moon.name + moonIdx} moon={moon} index={moonIdx} sim={sim} parentRadius={radius} />
      ))}

      {showLabel && (
        <Html position={[0, radius + 0.6, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "rgba(61,255,205,0.75)",
              whiteSpace: "nowrap",
            }}
          >
            {planet.name}
          </span>
        </Html>
      )}
    </group>
  );
}
