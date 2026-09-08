// ---------------------------------------------------------------------------
// SystemScene (Brief G3) — a star and what orbits it, drawn from canon.
//
// 14-RENDER-ENGINE §5: this is the Atlas's middle level AND the Orrery's
// renderer. One scene, two homes, so a system cannot look like two different
// places depending on which door you came through.
//
// Every position here is a FACT: a planet sits where orbit.semi_major_axis
// says. Nothing is dragged and nothing is invented — a body with no distance
// on file is not drawn at all, and bind/system.ts hands it back as unplaced
// for the caller to name.
//
// Reduced motion stops the orbits. A slow drift is pleasant; it is also
// exactly what that setting exists to switch off.
// ---------------------------------------------------------------------------

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  Color,
  EllipseCurve,
  Float32BufferAttribute,
  Vector3,
  type Mesh,
} from "three";
import {
  createAtmosphereMaterial,
  createSurfaceMaterial,
  atmosphereShellScale,
} from "../materials/AtmosphereMaterial";
import {
  createStarCoronaMaterial,
  createStarSurfaceMaterial,
} from "../materials/StarMaterial";
import { orbitPosition, type BoundBody, type BoundSystem } from "../bind/system";
import { useThemeColors } from "../engine/use-theme-uniforms";

interface SystemSceneProps {
  system: BoundSystem;
  onSelectBody?: (id: string) => void;
  selectedId?: string | null;
  /** Honour the reader's setting: no drift, no churn. */
  reducedMotion?: boolean;
  className?: string;
}

/** The ring a body travels. Drawn from the same numbers that place the body. */
function OrbitRing({ body, colour }: { body: BoundBody; colour: Color }) {
  const geometry = useMemo(() => {
    const a = body.displayOrbit;
    const e = body.orbit.eccentricity;
    const b = a * Math.sqrt(1 - e * e);
    const curve = new EllipseCurve(-a * e, 0, a, b, 0, Math.PI * 2, false, 0);
    const points = curve.getPoints(128);
    const geo = new BufferGeometry();
    geo.setAttribute(
      "position",
      new Float32BufferAttribute(
        points.flatMap((p) => [p.x, 0, p.y]),
        3,
      ),
    );
    return geo;
  }, [body.displayOrbit, body.orbit.eccentricity]);

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      {/* --sf-line: the chart rule, so the ring follows the theme. */}
      <lineBasicMaterial
        attach="material"
        color={colour}
        transparent
        opacity={0.55}
      />
    </line>
  );
}

function Body({
  body,
  phase,
  onSelect,
  selected,
  selectionColour,
  reducedMotion,
}: {
  body: BoundBody;
  /** Stable starting angle, so a still system is not all one stack. */
  phase: number;
  onSelect?: (id: string) => void;
  selected: boolean;
  selectionColour: Color;
  reducedMotion: boolean;
}) {
  // The star is at the origin, so the direction to it depends on where the
  // body IS. A constant light direction lit only the planets that happened to
  // be on one side and left the rest in shadow.
  const sun = useMemo(() => new Vector3(1, 0, 0), []);
  const group = useRef<Mesh>(null);
  const surface = useMemo(() => createSurfaceMaterial(body.planet, sun), [body.planet, sun]);
  const shell = useMemo(() => createAtmosphereMaterial(body.planet, sun), [body.planet, sun]);

  // Angular rate: inner bodies move faster, which is Kepler's third law read
  // qualitatively. Never used to state a period — only to make the picture
  // move in the right direction.
  const rate = useMemo(
    () => 0.25 / Math.max(0.4, body.orbit.semiMajorAxisAU ** 1.5),
    [body.orbit.semiMajorAxisAU],
  );

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = phase + (reducedMotion ? 0 : clock.getElapsedTime() * rate);
    const p = orbitPosition(body.displayOrbit, body.orbit.eccentricity, t);
    group.current.position.set(p.x, 0, p.z);

    // Light this body from the star it actually orbits.
    sun.set(-p.x, 0, -p.z).normalize();
    surface.uniforms.uSun.value = sun;
    shell.uniforms.uSun.value = sun;

    // A locked world does not turn. surface.spin is exactly 0 for one.
    surface.uniforms.uTime.value = reducedMotion ? 0 : clock.getElapsedTime();
  });

  return (
    <mesh
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(body.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <sphereGeometry args={[body.displayRadius, 48, 48]} />
      <primitive object={surface} attach="material" />

      {body.planet.atmosphere.present && (
        <mesh scale={atmosphereShellScale(body.planet) * 1.04}>
          <sphereGeometry args={[body.displayRadius, 32, 32]} />
          <primitive object={shell} attach="material" />
        </mesh>
      )}

      {selected && (
        <mesh scale={1.9}>
          <sphereGeometry args={[body.displayRadius, 24, 24]} />
          {/* Selection is a ROLE, so it reads --sf-primary — the accent the
              writer chose, never a fixed hue. */}
          <meshBasicMaterial
            color={selectionColour}
            transparent
            opacity={0.18}
            side={BackSide}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </mesh>
  );
}

function Star({
  system,
  reducedMotion,
}: {
  system: BoundSystem;
  reducedMotion: boolean;
}) {
  const surface = useMemo(
    () => createStarSurfaceMaterial(system.star),
    [system.star],
  );
  const corona = useMemo(
    () => createStarCoronaMaterial(system.star),
    [system.star],
  );

  useFrame(({ clock }) => {
    const t = reducedMotion ? 0 : clock.getElapsedTime();
    surface.uniforms.uTime.value = t;
    corona.uniforms.uTime.value = t;
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[system.starDisplayRadius, 64, 64]} />
        <primitive object={surface} attach="material" />
      </mesh>
      <mesh scale={1.6}>
        <sphereGeometry args={[system.starDisplayRadius, 32, 32]} />
        <primitive object={corona} attach="material" />
      </mesh>
      {/* The star lights the system. One light, from the one source. */}
      <pointLight
        position={[0, 0, 0]}
        intensity={40}
        color={
          new Color(
            system.star.colour.r,
            system.star.colour.g,
            system.star.colour.b,
          )
        }
      />
    </group>
  );
}

export function SystemScene({
  system,
  onSelectBody,
  selectedId = null,
  reducedMotion = false,
  className,
}: SystemSceneProps) {
  // Frame the whole system: far enough back that the outermost ring fits.
  const outermost = system.bodies.length
    ? system.bodies[system.bodies.length - 1].displayOrbit
    : 6;
  const distance = Math.max(9, outermost * 2.1);

  return (
    <Canvas
      className={className}
      camera={{ position: [0, distance * 0.55, distance], fov: 42 }}
      // The engine's tone mapping; the scene inherits the app's colour space.
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.06} />
      <SceneContents
        system={system}
        onSelectBody={onSelectBody}
        selectedId={selectedId}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}

/** Inside the Canvas, so the theme hook and useFrame share one tree. */
function SceneContents({
  system,
  onSelectBody,
  selectedId,
  reducedMotion,
}: {
  system: BoundSystem;
  onSelectBody?: (id: string) => void;
  selectedId: string | null;
  reducedMotion: boolean;
}) {
  const theme = useThemeColors();
  return (
    <>
      <Star system={system} reducedMotion={reducedMotion} />
      {system.bodies.map((body, i) => (
        <group key={body.id}>
          <OrbitRing body={body} colour={theme["--sf-line"]} />
          <Body
            body={body}
            // Golden-angle spacing: deterministic, and never lines bodies up
            // even when motion is off. A reader with reduced motion should see
            // a system, not a row of planets stacked on one side.
            phase={i * 2.39996}
            onSelect={onSelectBody}
            selected={selectedId === body.id}
            selectionColour={theme["--sf-primary"]}
            reducedMotion={reducedMotion}
          />
        </group>
      ))}
    </>
  );
}

export default SystemScene;
