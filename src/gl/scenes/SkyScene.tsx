// ---------------------------------------------------------------------------
// SkyScene (G5) — the night sky from one of the writer's worlds.
//
// The camera sits at the observer and looks out. Every point is a real
// catalogue star at its real direction and its real brightness FROM THERE,
// computed in bind/sky.ts — so the constellations are wrong on purpose. They
// deform because the geometry changed.
//
// Magnitude drives point size through a shader rather than a bucket, because
// magnitude is a continuous, logarithmic quantity and rounding it into three
// sizes would throw away the only thing the sky is telling the writer: which
// of these is the bright one.
// ---------------------------------------------------------------------------

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  ShaderMaterial,
  type Group,
} from "three";
import type { SkyStar, SkyView } from "../bind/sky";
import { useThemeColors } from "../engine/use-theme-uniforms";
import { useQualityTier } from "../engine/use-quality-tier";
import FrameBenchmark from "../engine/FrameBenchmark";

interface SkySceneProps {
  sky: SkyView;
  /** Highlighted by name — the pole star, or whatever the panel is naming. */
  markedName?: string | null;
  reducedMotion?: boolean;
  className?: string;
}

/** The dome radius. Everything is direction-only, so this is arbitrary. */
const DOME = 60;

/**
 * Apparent magnitude → point size in pixels.
 *
 * Magnitude is logarithmic and inverted: each step of 1 is ~2.512× the flux,
 * and smaller is brighter. Mapping flux directly would make Sirius a disc and
 * everything else invisible, so this is the conventional astronomical
 * compromise — size falls off with magnitude, clamped at both ends so a
 * magnitude 6.4 star is still one pixel rather than nothing.
 */
function magToSize(mag: number): number {
  return Math.max(1.1, Math.min(9, 7.2 - 1.05 * mag));
}

function StarDome({ stars }: { stars: SkyStar[] }) {
  // Point size is in device pixels, so without this every star is half the
  // intended size on a retina display and the magnitude scale reads flat.
  const pixelRatio = useThree((state) => state.gl.getPixelRatio());
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colours: number[] = [];
    const sizes: number[] = [];
    for (const star of stars) {
      const [x, y, z] = star.direction;
      positions.push(x * DOME, y * DOME, z * DOME);
      colours.push(star.colour.r, star.colour.g, star.colour.b);
      sizes.push(magToSize(star.appMag));
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new Float32BufferAttribute(colours, 3));
    geo.setAttribute("aSize", new Float32BufferAttribute(sizes, 1));
    return geo;
  }, [stars]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uPixelRatio: { value: pixelRatio } },
        vertexShader: /* glsl */ `
          attribute float aSize;
          varying vec3 vColour;
          uniform float uPixelRatio;
          void main() {
            vColour = color;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            // No distance attenuation: every star is on the same dome, and a
            // star's size here means brightness, never nearness.
            gl_PointSize = aSize * uPixelRatio;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec3 vColour;
          void main() {
            // A soft round point. A square star is the tell of a lazy sky.
            vec2 d = gl_PointCoord - vec2(0.5);
            float r = length(d) * 2.0;
            float alpha = 1.0 - smoothstep(0.35, 1.0, r);
            if (alpha <= 0.001) discard;
            gl_FragColor = vec4(vColour, alpha);
          }
        `,
        vertexColors: true,
      }),
    [pixelRatio],
  );

  return (
    <points>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </points>
  );
}

/**
 * A ring around one named star. Used for the pole star, so the claim in the
 * panel ("Polaris, 0.7° off the pole") can be found in the sky it describes.
 */
function Marker({ star, colour }: { star: SkyStar; colour: Color }) {
  const [x, y, z] = star.direction;
  return (
    <mesh position={[x * DOME * 0.985, y * DOME * 0.985, z * DOME * 0.985]}>
      <ringGeometry args={[1.6, 2.1, 32]} />
      <meshBasicMaterial color={colour} transparent opacity={0.85} side={2} />
    </mesh>
  );
}

function Contents({
  sky,
  markedName,
  reducedMotion,
}: {
  sky: SkyView;
  markedName?: string | null;
  reducedMotion: boolean;
}) {
  const theme = useThemeColors();
  const group = useRef<Group>(null);
  const marked = useMemo(
    () => (markedName ? sky.stars.find((s) => s.name === markedName) : null),
    [sky.stars, markedName],
  );

  // The slow turn of a world under its own sky. Off under reduced motion, and
  // slow enough at any rate to read as rotation rather than animation.
  useFrame(({ clock }) => {
    if (!group.current || reducedMotion) return;
    group.current.rotation.y = clock.getElapsedTime() * 0.008;
  });

  return (
    <group ref={group}>
      <StarDome stars={sky.stars} />
      {marked ? <Marker star={marked} colour={theme["--sf-primary"]} /> : null}
    </group>
  );
}

export function SkyScene({
  sky,
  markedName = null,
  reducedMotion = false,
  className,
}: SkySceneProps) {
  // Open facing the star the panel names, so the claim and the sky agree on
  // first sight. The camera sits a hair off the origin and looks back through
  // it, which is how you look around from inside a dome.
  const tier = useQualityTier();
  const start = useMemo<[number, number, number]>(() => {
    const d = sky.brightest?.direction;
    if (!d) return [0, 0, 0.1];
    return [-d[0] * 0.1, -d[1] * 0.1, -d[2] * 0.1];
  }, [sky.brightest]);

  return (
    <Canvas
      className={className}
      // Inside the dome, looking out. A narrow field, because a wide one makes
      // every constellation look like a fisheye photograph.
      camera={{ position: start, fov: 55 }}
      gl={{ antialias: true, alpha: true }}
      dpr={tier.dpr}
    >
      <FrameBenchmark />
      <Contents
        sky={sky}
        markedName={markedName}
        reducedMotion={reducedMotion || tier.still}
      />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        // Rotating the camera in place is how you look around a sky.
        rotateSpeed={-0.32}
      />
    </Canvas>
  );
}

export default SkyScene;
