// ---------------------------------------------------------------------------
// GalaxyScene (G4) — the real sky, with the writer's worlds on it.
//
// The owner's decision, 2026-09-08: allow BOTH. Real stars and invented ones,
// one chart.
//
// So the whole design of this file is the separation. Catalogue stars are
// drawn as POINTS — a field, unlabelled, unclickable, the sky as it is. The
// writer's systems are drawn as RINGS with names, and they are the only thing
// you can click. You can always tell, at a glance and without a legend, which
// dots someone measured and which ones you chose.
//
// The catalogue is the 178 named Hipparcos stars already shipped for ExoSky.
// One star list, not two (bind/starfield.ts explains why).
// ---------------------------------------------------------------------------

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Vector3,
  type Points,
} from "three";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import type { CatalogStar, GalaxyField, WorldSystem } from "../bind/starfield";
import type { Lane } from "../bind/routes";
import type { Territory } from "../bind/territory";
import { useThemeColors } from "../engine/use-theme-uniforms";
import { useQualityTier } from "../engine/use-quality-tier";
import FrameBenchmark from "../engine/FrameBenchmark";

interface GalaxySceneProps {
  field: GalaxyField;
  /**
   * Routes between anchored systems, from bind/routes. Each one is an edge the
   * writer drew in the Web view — nothing here is generated.
   */
  lanes?: Lane[];
  /** Who holds what, from bind/territory. Counted from `governs` / `rules`. */
  territories?: Territory[];
  onSelectSystem?: (id: string) => void;
  /**
   * Force the scene still. The quality tier already forces it under reduced
   * motion; this is for callers with a reason of their own.
   */
  reducedMotion?: boolean;
  className?: string;
}

/** Parsecs → scene units. Log-compressed so the near field is not a single dot. */
function toScene(position: readonly number[]): [number, number, number] {
  const [x, y, z] = position;
  const r = Math.hypot(x, y, z);
  if (r <= 0) return [0, 0, 0];
  // 1 pc → ~1 unit; 200 pc → ~11. Keeps Sirius and Betelgeuse in one frame.
  const scaled = 4 * Math.log10(1 + r);
  const k = scaled / r;
  return [x * k, y * k, z * k];
}

/**
 * The catalogue, as a point cloud. Each star carries its own black-body
 * colour, so the field is not a grey dust — the sky's real colour is
 * information a writer can read.
 */
function StarField({ stars }: { stars: CatalogStar[] }) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colours: number[] = [];
    for (const star of stars) {
      const [x, y, z] = toScene(star.position);
      positions.push(x, y, z);
      colours.push(star.colour.r, star.colour.g, star.colour.b);
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new Float32BufferAttribute(colours, 3));
    return geo;
  }, [stars]);

  return (
    <points>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial
        attach="material"
        size={0.13}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.95}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * One of the writer's systems, anchored to a real position.
 *
 * A ring, not a point. The shape is the tell: nothing in the catalogue is
 * ever drawn as a ring, so a reader never has to ask which is which.
 */
function SystemMarker({
  system,
  colour,
  onSelect,
}: {
  system: WorldSystem;
  colour: Color;
  onSelect?: (id: string) => void;
}) {
  if (!system.position) return null;
  const [x, y, z] = toScene(system.position);

  return (
    <group position={[x, y, z]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(system.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        {/* A ring the writer's eye can find, and a hit target big enough to
            click at this scale. */}
        <ringGeometry args={[0.18, 0.26, 32]} />
        <meshBasicMaterial color={colour} transparent opacity={0.95} side={2} />
      </mesh>
      <mesh visible={false}>
        <sphereGeometry args={[0.35, 8, 8]} />
      </mesh>
    </group>
  );
}

/**
 * The lane layer — the writer's routes, drawn between anchored systems.
 *
 * One geometry for the whole network rather than a line per lane: a route map
 * is read as a shape, and a hundred draw calls to say the same thing would
 * cost a tier the engine has to keep.
 *
 * Drawn in the stellar token, not the primary one, so lanes never read as
 * another kind of system marker. Under the rings in weight, over the field.
 */
function LaneField({ lanes, colour }: { lanes: Lane[]; colour: Color }) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    for (const lane of lanes) {
      if (!lane.from.position || !lane.to.position) continue;
      positions.push(...toScene(lane.from.position));
      positions.push(...toScene(lane.to.position));
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geo;
  }, [lanes]);

  if (lanes.length === 0) return null;

  return (
    <lineSegments>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial
        attach="material"
        color={colour}
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </lineSegments>
  );
}

/**
 * One polity's holdings, drawn as the CONVEX HULL of the systems it governs.
 *
 * The hull is chosen because it is the only region the data supports: the
 * smallest convex volume containing the holdings, asserting nothing about
 * what lies outside it. A sphere around the centroid would have swallowed
 * systems the polity does not hold. A hand-drawn border would have been a
 * claim nobody made.
 *
 * Three points ARE a hull — a triangle — so they get a face. Two points, or a
 * coplanar set the volume builder rejects, fall back to the edges between the
 * holdings, which says exactly as much as is known and no more.
 */
function TerritoryHull({
  territory,
  fallback,
}: {
  territory: Territory;
  fallback: Color;
}) {
  const colour = useMemo(() => {
    // The writer's own colour when they set one; otherwise the theme's, so a
    // polity without a colour is still legible in all 70 themes.
    if (!territory.colour) return fallback;
    try {
      return new Color(territory.colour);
    } catch {
      return fallback;
    }
  }, [territory.colour, fallback]);

  const { hull, edges } = useMemo(() => {
    const points = territory.systems
      .filter((s) => s.position)
      .map((s) => new Vector3(...toScene(s.position!)));

    let solid: BufferGeometry | null = null;
    if (points.length === 3) {
      // The convex hull of three points is the triangle they span. Drawing it
      // is not an assumption; refusing to would have under-stated the claim.
      solid = new BufferGeometry();
      solid.setAttribute(
        "position",
        new Float32BufferAttribute(
          points.flatMap((p) => [p.x, p.y, p.z]),
          3,
        ),
      );
    } else if (points.length >= 4) {
      try {
        solid = new ConvexGeometry(points);
        // A degenerate (coplanar) set yields an empty geometry rather than
        // throwing. Treat that as "no volume" too.
        if (!solid.getAttribute("position")?.count) solid = null;
      } catch {
        solid = null;
      }
    }

    // Every pair, so a flat or thin holding still reads as one shape.
    const segments: number[] = [];
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        segments.push(points[i].x, points[i].y, points[i].z);
        segments.push(points[j].x, points[j].y, points[j].z);
      }
    }
    const line = new BufferGeometry();
    line.setAttribute("position", new Float32BufferAttribute(segments, 3));
    return { hull: solid, edges: line };
  }, [territory.systems]);

  return (
    <group>
      {hull ? (
        <mesh>
          <primitive object={hull} attach="geometry" />
          <meshBasicMaterial
            color={colour}
            transparent
            // Low enough that the starfield reads through it: a territory is
            // a claim over space, not a lid on it.
            opacity={0.1}
            depthWrite={false}
            side={DoubleSide}
          />
        </mesh>
      ) : null}
      <lineSegments>
        <primitive object={edges} attach="geometry" />
        <lineBasicMaterial
          color={colour}
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

/** Sol, at the origin, because every distance on this chart is from here. */
function SolMarker({ colour }: { colour: Color }) {
  return (
    <mesh>
      <sphereGeometry args={[0.09, 16, 16]} />
      <meshBasicMaterial color={colour} />
    </mesh>
  );
}

function Contents({
  field,
  lanes,
  territories,
  onSelectSystem,
  reducedMotion,
}: {
  field: GalaxyField;
  lanes: Lane[];
  territories: Territory[];
  onSelectSystem?: (id: string) => void;
  reducedMotion: boolean;
}) {
  const theme = useThemeColors();
  const group = useRef<Points>(null);

  // A very slow drift, so the field reads as depth rather than wallpaper.
  // Off entirely under reduced motion.
  useFrame(({ clock }) => {
    if (!group.current || reducedMotion) return;
    group.current.rotation.y = clock.getElapsedTime() * 0.012;
  });

  return (
    <group ref={group as never}>
      <StarField stars={field.stars} />
      {/* Territory sits under the lanes and the rings: a border is context
          for the things on it, never the thing you read first. */}
      {territories.map((territory) => (
        <TerritoryHull
          key={territory.id}
          territory={territory}
          fallback={theme["--sf-violet"]}
        />
      ))}
      <LaneField lanes={lanes} colour={theme["--sf-stellar"]} />
      <SolMarker colour={theme["--sf-amber"]} />
      {field.systems.map((system) => (
        <SystemMarker
          key={system.id}
          system={system}
          colour={theme["--sf-primary"]}
          onSelect={onSelectSystem}
        />
      ))}
    </group>
  );
}

export function GalaxyScene({
  field,
  lanes = [],
  territories = [],
  onSelectSystem,
  reducedMotion = false,
  className,
}: GalaxySceneProps) {
  const tier = useQualityTier();
  return (
    <Canvas
      className={className}
      camera={{ position: [0, 6, 16], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      dpr={tier.dpr}
    >
      <FrameBenchmark />
      <Contents
        field={field}
        lanes={lanes}
        territories={territories}
        onSelectSystem={onSelectSystem}
        reducedMotion={reducedMotion || tier.still}
      />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={40}
        autoRotate={false}
      />
    </Canvas>
  );
}

export default GalaxyScene;
