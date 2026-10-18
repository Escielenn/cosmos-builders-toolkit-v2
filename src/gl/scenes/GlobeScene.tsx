// ---------------------------------------------------------------------------
// GlobeScene — the Planet level of forge-gl: a body's own map on a sphere.
//
// 14-RENDER-ENGINE §1 lists "Planet" among the scenes; this is its first
// home, the Surface Cartographer, and the Atlas's planet zoom is its second.
// One scene, so a world cannot look like two different places depending on
// which door you came through.
//
// Everything that moves comes from a GlobeBinding (bind/globe.ts): tilt, the
// lock, the atmosphere rim, the star's colour. The sheet is only a texture.
// A locked world never turns; it is posed so its substellar point faces the
// star, the terminator sits where canon says, and a marker shows the eye.
//
// Reduced motion and the Chart tier stop the spin. The pose stays honest.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  LinearFilter,
  Vector3,
  type Group,
} from "three";
import { createSheetSurfaceMaterial } from "../materials/SheetSurfaceMaterial";
import { createAtmosphereMaterial, atmosphereShellScale } from "../materials/AtmosphereMaterial";
import { surfaceUniforms } from "../materials/surface";
import { globeDirection, yawToFace, type GlobeBinding } from "../bind/globe";
import type { PlanetBinding } from "../bind";
import { useThemeColors } from "../engine/use-theme-uniforms";
import { useQualityTier } from "../engine/use-quality-tier";
import FrameBenchmark from "../engine/FrameBenchmark";

export interface GlobePin {
  id: string;
  lat: number;
  lon: number;
}

interface GlobeSceneProps {
  binding: GlobeBinding;
  /** An equirectangular 2:1 canvas: the sheet, or the generated map. */
  sheet: HTMLCanvasElement;
  /** Bumped by the caller when the canvas pixels change. */
  sheetVersion: number;
  pins: GlobePin[];
  selectedId?: string | null;
  onSelectPin?: (id: string) => void;
  reducedMotion?: boolean;
  className?: string;
}

const Z_AXIS = new Vector3(0, 0, 1);
/** Where the star sits for a turning world: front-right, so the camera sees mostly day. */
const FREE_SUN = new Vector3(1, 0.15, 0.9).normalize();

function Globe({
  binding,
  sheet,
  sheetVersion,
  pins,
  selectedId,
  onSelectPin,
  still,
}: Omit<GlobeSceneProps, "className" | "reducedMotion"> & { still: boolean }) {
  const theme = useThemeColors();
  const spin = useRef<Group>(null);
  const tilt = binding.tilt.value;
  const locked = binding.locked.value;

  const texture = useMemo(() => {
    const t = new CanvasTexture(sheet);
    t.minFilter = LinearFilter;
    t.generateMipmaps = false;
    return t;
    // sheetVersion: the same canvas element repainted is new pixels.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet, sheetVersion]);

  // The star's direction in world space. Locked: the substellar point is
  // turned to face +X (yawToFace), so the star is +X leaned by the tilt.
  const sun = useMemo(
    () => (locked ? new Vector3(1, 0, 0).applyAxisAngle(Z_AXIS, -tilt) : FREE_SUN.clone()),
    [locked, tilt],
  );

  const surface = useMemo(
    () =>
      createSheetSurfaceMaterial({
        map: texture,
        sun,
        softness: binding.atmosphere.terminatorSoftness,
        starColour: binding.starColour,
      }),
    [texture, sun, binding.atmosphere.terminatorSoftness, binding.starColour],
  );

  // AtmosphereMaterial reads only `.atmosphere`; the rest of a PlanetBinding
  // is filled with the honest unknowns so the type stays whole.
  const shellBinding = useMemo<PlanetBinding>(
    () => ({
      atmosphere: binding.atmosphere,
      surface: surfaceUniforms(null, null, locked),
      radius: { value: 1, derived: true, note: "Globe drawn at unit radius." },
      tidallyLocked: binding.locked,
    }),
    [binding.atmosphere, binding.locked, locked],
  );
  const shell = useMemo(() => createAtmosphereMaterial(shellBinding, sun), [shellBinding, sun]);

  useEffect(
    () => () => {
      texture.dispose();
      surface.dispose();
      shell.dispose();
    },
    [texture, surface, shell],
  );

  const startYaw = locked ? yawToFace(binding.substellarLon) : yawToFace(0) - 0.6;

  useFrame((_, delta) => {
    if (!spin.current) return;
    if (locked || still || binding.spinRate === 0) {
      spin.current.rotation.y = startYaw;
      return;
    }
    spin.current.rotation.y += binding.spinRate * Math.min(delta, 0.1);
  });

  const substellar = globeDirection(0, binding.substellarLon);

  return (
    <group rotation={[0, 0, -tilt]}>
      <group ref={spin} rotation={[0, startYaw, 0]}>
        <mesh>
          <sphereGeometry args={[1, 128, 64]} />
          <primitive object={surface} attach="material" />
        </mesh>

        {pins.map((p) => {
          const d = globeDirection(p.lat, p.lon);
          const selected = p.id === selectedId;
          return (
            <group key={p.id} position={[d[0] * 1.004, d[1] * 1.004, d[2] * 1.004]}>
              <mesh>
                <sphereGeometry args={[selected ? 0.026 : 0.016, 12, 12]} />
                {/* A place is something to select: a ROLE, so --sf-primary. */}
                <meshBasicMaterial color={theme["--sf-primary"]} />
              </mesh>
              {/* A forgiving hit area. The visible pin is too small to aim at. */}
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPin?.(p.id);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  document.body.style.cursor = "";
                }}
              >
                <sphereGeometry args={[0.055, 8, 8]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            </group>
          );
        })}

        {locked && (
          // The eye of a locked world: where the star stands at the zenith,
          // always. Amber, because it is a physics fact, not a selection.
          <mesh position={[substellar[0] * 1.006, substellar[1] * 1.006, substellar[2] * 1.006]}>
            <torusGeometry args={[0.05, 0.006, 8, 48]} />
            <meshBasicMaterial color={theme["--sf-amber"]} />
          </mesh>
        )}
      </group>

      {binding.atmosphere.present && (
        <mesh scale={atmosphereShellScale(shellBinding) * 1.02}>
          <sphereGeometry args={[1, 64, 48]} />
          <primitive object={shell} attach="material" />
        </mesh>
      )}

      {/* The axis, drawn faintly, so tilt reads as tilt and not as a crooked camera. */}
      <mesh>
        <cylinderGeometry args={[0.003, 0.003, 2.5, 6]} />
        <meshBasicMaterial
          color={theme["--sf-line"]}
          transparent
          opacity={0.6}
          blending={AdditiveBlending}
          side={BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function GlobeScene({ reducedMotion = false, className, ...rest }: GlobeSceneProps) {
  const tier = useQualityTier();
  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0, 3.3], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      dpr={tier.dpr}
    >
      <FrameBenchmark />
      <Globe {...rest} still={reducedMotion || tier.still} />
      <OrbitControls enablePan={false} minDistance={1.6} maxDistance={6} enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}

export default GlobeScene;
