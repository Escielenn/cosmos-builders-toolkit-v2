/**
 * SolarisScene, The Three.js canvas and scene graph.
 *
 * Positions come from the SolarisSim physics engine (physics.ts). The engine
 * is stepped once per frame by <SimStepper>, and each body reads its own
 * position from the engine inside its useFrame — imperatively, with NO
 * per-frame React re-render (that churn was overrunning software WebGL on
 * multi-star scenes, and is the perf-correct approach regardless).
 */

import { useCallback, useRef } from "react";
import type { ElementRef, RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { StarSystem, SelectedBody, CameraMode } from "./types";
import { SolarisSim } from "./physics";
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
  paused?: boolean;
  /** Advance exactly one step; increment the number to fire it again. */
  stepTick?: number;
}

/**
 * Steps the physics engine once per frame (before bodies read positions).
 *
 * While paused the engine still renders, so the camera and selection stay live,
 * but time does not advance. A step request advances one frame's worth of
 * simulated time at the current speed, which is what a writer wants when
 * lining up a conjunction to describe.
 */
function SimStepper({
  sim,
  speed,
  paused,
  stepTick = 0,
}: {
  sim: SolarisSim;
  speed: number;
  paused: boolean;
  stepTick?: number;
}) {
  const lastTick = useRef(stepTick);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05) * speed;
    if (!paused) {
      sim.step(dt);
      return;
    }
    if (stepTick !== lastTick.current) {
      lastTick.current = stepTick;
      // A fixed slice, not the real frame delta: a single step should be
      // reproducible rather than depending on how long the frame took.
      sim.step((1 / 60) * speed);
    }
  });
  return null;
}

/** A single point light tracking the primary star (one light keeps software WebGL happy). */
function PrimaryLight({ sim }: { sim: SolarisSim }) {
  const ref = useRef<THREE.PointLight>(null);
  const intensity = Math.min(sim.stars.reduce((s, st) => s + st.lum, 0) * 1.4 + 0.6, 9);
  useFrame(() => {
    const s = sim.stars[0];
    if (ref.current && s) ref.current.position.set(auToScene(s.x), 0, auToScene(s.z));
  });
  return <pointLight ref={ref} intensity={intensity} color="#ffffff" distance={0} decay={2} />;
}

/** Eases OrbitControls' target toward the active camera-mode body. */
function CameraRig({ cameraMode, sim, controlsRef }: { cameraMode: CameraMode; sim: SolarisSim; controlsRef: ControlsRef }) {
  const target = useRef(new THREE.Vector3());
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls || cameraMode === "free") return;
    let tx = 0;
    let tz = 0;
    if (cameraMode.startsWith("planet-")) {
      const idx = parseInt(cameraMode.slice("planet-".length), 10);
      const p = sim.planets[idx];
      if (p) {
        tx = auToScene(p.x);
        tz = auToScene(p.z);
      }
    }
    target.current.set(tx, 0, tz);
    controls.target.lerp(target.current, 0.08);
    controls.update();
  });
  return null;
}

function SceneContents({
  system,
  showOrbitalPaths,
  showHabitableZone,
  showAsteroidBelts,
  showMoons,
  showLabels,
  onBodySelect,
  selectedBody,
  cameraMode,
  speedMultiplier,
  paused = false,
  stepTick = 0,
  controlsRef,
}: SolarisSceneProps & { controlsRef: ControlsRef }) {
  // Persistent engine: reconcile on edits (keeps orbits + time), rebuild only on remount (Generate).
  const simRef = useRef<SolarisSim | null>(null);
  if (!simRef.current) simRef.current = new SolarisSim(system);
  const sim = simRef.current;
  const lastSystemRef = useRef(system);
  if (lastSystemRef.current !== system) {
    sim.reconcile(system);
    lastSystemRef.current = system;
  }
  const starList = system.stars && system.stars.length ? system.stars : [system.star];

  const handleStarClick = useCallback(
    (i: number) => onBodySelect?.({ type: "star", name: starList[i].name, data: starList[i] }),
    [starList, onBodySelect]
  );
  const handlePlanetClick = useCallback(
    (index: number) => {
      const planet = system.planets[index];
      if (planet) onBodySelect?.({ type: "planet", name: planet.name, data: planet });
    },
    [system.planets, onBodySelect]
  );
  const handleBgClick = useCallback(() => onBodySelect?.(null), [onBodySelect]);

  return (
    <>
      <SimStepper sim={sim} speed={speedMultiplier} paused={paused} stepTick={stepTick} />
      <ambientLight intensity={0.06} />
      <hemisphereLight args={["#8ea6c8", "#0a0a12", 0.12]} />
      <PrimaryLight sim={sim} />
      <StarField />

      {starList.map((s, i) => (
        <StarObject key={s.name + i} star={s} sim={sim} index={i} onClick={() => handleStarClick(i)} />
      ))}

      <HabitableZone
        innerAU={system.star.habitableZoneInnerAU}
        outerAU={system.star.habitableZoneOuterAU}
        visible={showHabitableZone}
      />

      {system.planets.map((planet, i) => (
        <group key={planet.id ?? planet.name + i}>
          {showOrbitalPaths && (
            <OrbitalPath semiMajorAxisAU={planet.semiMajorAxisAU} eccentricity={planet.eccentricity} colorHex={planet.colorHex} />
          )}
          <PlanetObject
            planet={planet}
            sim={sim}
            index={i}
            onClick={() => handlePlanetClick(i)}
            selected={
              !!selectedBody &&
              selectedBody.type === "planet" &&
              (selectedBody.data as { id?: string }).id === planet.id
            }
            showMoons={showMoons}
            showLabel={showLabels}
          />
        </group>
      ))}

      {showAsteroidBelts && system.asteroidBelts.map((belt, i) => <AsteroidBeltObject key={`belt-${i}`} belt={belt} visible />)}

      <CameraRig cameraMode={cameraMode} sim={sim} controlsRef={controlsRef} />

      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={handleBgClick} visible={false}>
        <planeGeometry args={[6000, 6000]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}

/** Scene radius of the outermost feature, for framing the camera on load. */
function systemExtent(system: StarSystem): number {
  let maxAU = 1;
  for (const p of system.planets) maxAU = Math.max(maxAU, p.semiMajorAxisAU * (1 + Math.abs(p.eccentricity)));
  for (const b of system.asteroidBelts) maxAU = Math.max(maxAU, b.outerAU);
  const stars = system.stars ?? [system.star];
  for (const s of stars) maxAU = Math.max(maxAU, s.orbitRadiusAU ?? 0);
  return auToScene(maxAU);
}

export default function SolarisScene(props: SolarisSceneProps) {
  const controlsRef = useRef<ElementRef<typeof OrbitControls>>(null);
  const extent = systemExtent(props.system);
  const camPos: [number, number, number] = [0, extent * 0.75, extent * 1.35];

  return (
    <Canvas camera={{ position: camPos, fov: 45, near: 0.1, far: 50000 }} gl={{ antialias: true }} style={{ background: "#09090B" }}>
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
