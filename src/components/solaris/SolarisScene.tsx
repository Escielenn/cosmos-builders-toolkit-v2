/**
 * SolarisScene, The Three.js canvas and scene graph.
 * Renders the star system as an interactive orrery.
 */

import { useCallback, useEffect, useRef } from "react";
import type { ElementRef, RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { StarSystem, SelectedBody, CameraMode } from "./types";
import { useSimulationTime } from "./hooks/useSimulationTime";
import { keplerPosition, phaseForIndex } from "./hooks/useOrbitalPosition";
import { auToScene } from "./utils/scaleAU";
import { StarObject } from "./objects/StarObject";
import { PlanetObject } from "./objects/PlanetObject";
import { OrbitalPath } from "./objects/OrbitalPath";
import { HabitableZone } from "./objects/HabitableZone";
import { AsteroidBeltObject } from "./objects/AsteroidBeltObject";
import { StarField } from "./objects/StarField";

type ControlsRef = RefObject<ElementRef<typeof OrbitControls>>;

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
  speedMultiplier: number;
}

/**
 * CameraRig, Steers OrbitControls' target based on the active camera mode.
 * 'free' leaves the user's target alone; 'star' eases toward the origin;
 * 'planet-N' eases toward that planet's current orbital position (computed
 * with the same Kepler math + phase the PlanetObject uses, so they agree).
 * The user can still orbit/zoom around the followed body.
 */
function CameraRig({
  cameraMode,
  planets,
  timeYears,
  controlsRef,
}: {
  cameraMode: CameraMode;
  planets: StarSystem["planets"];
  timeYears: number;
  controlsRef: ControlsRef;
}) {
  const target = useRef(new THREE.Vector3());

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls || cameraMode === "free") return;

    let tx = 0;
    let tz = 0;
    if (cameraMode.startsWith("planet-")) {
      const idx = parseInt(cameraMode.slice("planet-".length), 10);
      const p = planets[idx];
      if (p) {
        const [x, z] = keplerPosition(
          p.semiMajorAxisAU,
          p.eccentricity,
          p.orbitalPeriodYears,
          timeYears,
          phaseForIndex(idx)
        );
        tx = x;
        tz = z;
      }
    }

    target.current.set(tx, 0, tz);
    controls.target.lerp(target.current, 0.08);
    controls.update();
  });

  return null;
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
  cameraMode,
  speedMultiplier,
  controlsRef,
}: Omit<SolarisSceneProps, "showLabels"> & { controlsRef: ControlsRef }) {
  const sim = useSimulationTime(speedMultiplier);

  // Keep the simulation clock in sync with the speed control.
  useEffect(() => {
    sim.setSpeedMultiplier(speedMultiplier);
  }, [speedMultiplier, sim]);

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
      <ambientLight intensity={0.06} />
      {/* Faint sky/ground fill so planet night-sides aren't pure black */}
      <hemisphereLight args={["#8ea6c8", "#0a0a12", 0.12]} />
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

      <CameraRig
        cameraMode={cameraMode}
        planets={system.planets}
        timeYears={sim.timeYears}
        controlsRef={controlsRef}
      />

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

/** Scene radius of the outermost feature (orbit apoapsis or belt), for framing. */
function systemExtent(system: StarSystem): number {
  let maxAU = 1;
  for (const p of system.planets) {
    maxAU = Math.max(maxAU, p.semiMajorAxisAU * (1 + Math.abs(p.eccentricity)));
  }
  for (const b of system.asteroidBelts) {
    maxAU = Math.max(maxAU, b.outerAU);
  }
  return auToScene(maxAU);
}

export default function SolarisScene(props: SolarisSceneProps) {
  const controlsRef = useRef<ElementRef<typeof OrbitControls>>(null);

  // Frame the whole system on load: pull the camera back to fit the outermost orbit.
  const extent = systemExtent(props.system);
  const camPos: [number, number, number] = [0, extent * 0.75, extent * 1.35];

  return (
    <Canvas
      camera={{ position: camPos, fov: 45, near: 0.1, far: 50000 }}
      gl={{ antialias: true }}
      style={{ background: "#09090B" }}
    >
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan
        enableZoom
        enableRotate
        minDistance={2}
        maxDistance={extent * 4}
        dampingFactor={0.08}
        enableDamping
      />
      <SceneContents {...props} controlsRef={controlsRef} />
    </Canvas>
  );
}
