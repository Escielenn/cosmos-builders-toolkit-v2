/**
 * SolarisScene — The Three.js canvas and scene graph.
 * Renders the star system as an interactive orrery.
 */

import { useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { StarSystem, SelectedBody, CameraMode } from "./types";
import { useSimulationTime } from "./hooks/useSimulationTime";
import StarObject from "./objects/StarObject";
import PlanetObject from "./objects/PlanetObject";
import OrbitalPath from "./objects/OrbitalPath";
import HabitableZone from "./objects/HabitableZone";
import AsteroidBeltObject from "./objects/AsteroidBeltObject";
import StarField from "./objects/StarField";

interface SolarisSceneProps {
  system: StarSystem;
  showOrbitalPaths: boolean;
  showHabitableZone: boolean;
  showAsteroidBelts: boolean;
  showMoons: boolean;
  showLabels: boolean;
  onBodySelect?: (body: SelectedBody | null) => void;
  selectedBody: SelectedBody | null;
  cameraMode: CameraMode;
}

/** Inner component that runs inside the Canvas (has access to useFrame). */
function SceneContents({
  system,
  showOrbitalPaths,
  showHabitableZone,
  showAsteroidBelts,
  showMoons,
  onBodySelect,
  selectedBody,
}: Omit<SolarisSceneProps, "cameraMode" | "showLabels">) {
  const sim = useSimulationTime(10);

  const handleStarClick = useCallback(() => {
    onBodySelect?.({
      type: "star",
      name: system.star.name,
      data: system.star,
    });
  }, [system.star, onBodySelect]);

  const handlePlanetClick = useCallback(
    (index: number) => {
      const planet = system.planets[index];
      if (!planet) return;
      onBodySelect?.({
        type: "planet",
        name: planet.name,
        data: planet,
      });
    },
    [system.planets, onBodySelect]
  );

  const handleBgClick = useCallback(() => {
    onBodySelect?.(null);
  }, [onBodySelect]);

  return (
    <>
      <ambientLight intensity={0.04} />
      <StarField />

      <StarObject star={system.star} onClick={handleStarClick} />

      <HabitableZone
        innerAU={system.star.habitableZoneInnerAU}
        outerAU={system.star.habitableZoneOuterAU}
        visible={showHabitableZone}
      />

      {system.planets.map((planet, i) => (
        <group key={planet.name + i}>
          {showOrbitalPaths && (
            <OrbitalPath
              semiMajorAxisAU={planet.semiMajorAxisAU}
              eccentricity={planet.eccentricity}
              colorHex={planet.colorHex}
            />
          )}
          <PlanetObject
            planet={planet}
            index={i}
            timeYears={sim.timeYears}
            onClick={() => handlePlanetClick(i)}
            selected={selectedBody?.name === planet.name}
            showMoons={showMoons}
          />
        </group>
      ))}

      {showAsteroidBelts &&
        system.asteroidBelts.map((belt, i) => (
          <AsteroidBeltObject key={`belt-${i}`} belt={belt} visible />
        ))}

      {/* Invisible click plane for deselection */}
      <mesh
        position={[0, -0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleBgClick}
        visible={false}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}

export default function SolarisScene(props: SolarisSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 45, 80], fov: 45, near: 0.1, far: 50000 }}
      gl={{ antialias: true }}
      style={{ background: "#09090B" }}
    >
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={3}
        maxDistance={800}
        dampingFactor={0.08}
        enableDamping
      />
      <SceneContents {...props} />
    </Canvas>
  );
}
