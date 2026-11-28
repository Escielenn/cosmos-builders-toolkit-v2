// ---------------------------------------------------------------------------
// The planet rig: a binding and its painted maps, as a three.js group.
//
// Imperative and React-free on purpose. Every geometry, material and texture
// goes through one DisposalRegistry, so "did we clean up?" is answered by a
// unit test (planet-rig.test.ts) rather than by watching a GPU memory graph,
// which 14 §3 calls the norm for three.js leaks. PlanetScene.tsx mounts it
// with <primitive> and disposes it on change and unmount.
//
//   root
//    ├ starfield            Points, black-body colours, × --sf-ambient
//    ├ star                 photosphere at its true angular size (R★/a),
//    │                      HDR core that keeps its hue under bloom
//    └ tilt (obliquity)
//       ├ spin              planet surface (turns, unless locked)
//       ├ clouds            own rotation, drifting against the surface
//       ├ atmosphere shell  scattering colours
//       └ rings             in the equatorial plane, shadowed by the planet
//
// The star direction is fixed in the scene. A locked world is yawed so its
// substellar point (lon 0) faces it, permanently; that is the whole pose.
// ---------------------------------------------------------------------------

import {
  BufferGeometry,
  DataTexture,
  Float32BufferAttribute,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  NoColorSpace,
  Points,
  RepeatWrapping,
  RGBAFormat,
  RingGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type Material,
  type ShaderMaterial,
} from "three";
import { DisposalRegistry, type DisposalStats } from "../engine/disposal";
import type { ThemeUniforms } from "../engine/theme-uniforms";
import type { PlanetSceneBinding } from "../bind/planet-scene";
import { cloudReflectance, type SurfaceMaps } from "../materials/terrain";
import { RING_REFLECTANCE } from "@/lib/palettes/planet-surface";
import { blackbodyHue, coronaAmplitude, kelvinToRGB } from "../materials/blackbody";
import { createStarCoronaMaterial, createStarSurfaceMaterial } from "../materials/StarMaterial";
import type { StarBinding } from "../bind";
import {
  createChartDiscMaterial,
  createChartLimbMaterial,
  createChartPlanetMaterial,
  createChartRingMaterial,
  createChartStarfieldMaterial,
  createCloudMaterial,
  createPlanetSurfaceMaterial,
  createRingMaterial,
  createScatterShellMaterial,
  createStarfieldMaterial,
  type ChartInk,
  type RingShadowUniforms,
} from "../materials/PlanetSceneMaterials";

/** Where the star sits: to the right, barely toward the camera, so every world shows its terminator. */
export const SUN_DIRECTION = new Vector3(1, 0.14, 0.12).normalize();
/** Scene distance of the star. Its radius follows from its true angular size. */
export const STAR_DISTANCE = 60;
const STARFIELD_RADIUS = 90;
/** The shell is drawn at twice its physical height so it reads at preview size. The same factor for every world. */
export const SHELL_EXAGGERATION = 2;
/** HDR gain into starCoreRadiance: well past the bloom threshold, hue kept. */
export const STAR_HDR_GAIN = 6;

export type RigMode = "lit" | "chart";

export interface PlanetRigOptions {
  binding: PlanetSceneBinding;
  maps: SurfaceMaps;
  mode: RigMode;
  theme: ThemeUniforms;
  starCount: number;
  pixelRatio: number;
}

export interface PlanetRig {
  root: Group;
  /** Raycast targets for click-to-canon. */
  planet: Mesh;
  star: Mesh;
  registry: DisposalRegistry;
  /** Advance the animation. `still` freezes every motion at its rest pose. */
  update: (elapsedSeconds: number, still: boolean) => void;
  setHover: (target: "planet" | "star" | null) => void;
  /**
   * Where the camera starts looking from (unit vector). Turned partway
   * toward the star so the terminator is in view; further for a locked
   * world, whose substellar point (its eye, its liquid band) is the subject.
   */
  viewDirection: Vector3;
  /** The camera distance that frames the planet and its rings at this vertical/horizontal half-FOV. */
  framingDistance: (halfFovRad: number) => number;
  dispose: () => DisposalStats;
}

/** Seeded PRNG (mulberry32), so a world's starfield is the same every visit. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dataTexture(data: Uint8Array, w: number, h: number, srgb: boolean, registry: DisposalRegistry): DataTexture {
  const t = registry.track(new DataTexture(data, w, h, RGBAFormat));
  t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  t.wrapS = RepeatWrapping;
  t.magFilter = LinearFilter;
  t.minFilter = LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

function chartInk(theme: ThemeUniforms): ChartInk {
  const c = theme.colours;
  return {
    paper: c["--sf-surface"],
    ink: c["--sf-line-emphasis"],
    fine: c["--sf-line"],
    physics: c["--sf-amber"],
    selection: c["--sf-primary"],
  };
}

export function createPlanetRig(o: PlanetRigOptions): PlanetRig {
  const { binding: b, maps, mode, theme } = o;
  const registry = new DisposalRegistry();
  const track = <T extends { dispose: () => void }>(x: T) => registry.track(x);
  const chart = mode === "chart";
  const ink = chartInk(theme);
  const sun = SUN_DIRECTION.clone();
  const light = b.star.light;
  const sc = b.atmosphere.scattering;

  const root = new Group();
  root.name = "planet-rig";

  // -- Starfield ----------------------------------------------------------
  {
    const rand = rng(b.seed * 7919 + 13);
    const n = Math.max(0, Math.round(o.starCount));
    const pos = new Float32Array(n * 3);
    const colour = new Float32Array(n * 3);
    const size = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const z = rand() * 2 - 1;
      const phi = rand() * Math.PI * 2;
      const r = Math.sqrt(1 - z * z);
      pos.set([r * Math.cos(phi) * STARFIELD_RADIUS, z * STARFIELD_RADIUS, r * Math.sin(phi) * STARFIELD_RADIUS], i * 3);
      // Apparent magnitudes: many faint, few bright (counts rise ~×3 per
      // magnitude). Temperatures: naked-eye stars skew hot, since luminous
      // A/B stars are seen from further away.
      const mag = -Math.log(1 - rand() * 0.999) / Math.log(3);
      const brightness = Math.max(0.05, Math.pow(10, -0.4 * mag * 1.2));
      const teff = 3200 + Math.pow(rand(), 1.6) * 12000;
      const hue = blackbodyHue(teff);
      colour.set([hue.r * brightness, hue.g * brightness, hue.b * brightness], i * 3);
      size[i] = 1 + 2.4 * brightness;
    }
    const geo = track(new BufferGeometry());
    geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new Float32BufferAttribute(colour, 3));
    geo.setAttribute("aSize", new Float32BufferAttribute(size, 1));
    const mat = track(
      chart
        ? createChartStarfieldMaterial(ink.fine, o.pixelRatio)
        : createStarfieldMaterial(theme.ambient, o.pixelRatio),
    );
    const points = new Points(geo, mat);
    points.name = "starfield";
    points.frustumCulled = false;
    // Not clickable: Points raycast with a pixel threshold and would steal
    // clicks meant for the planet.
    points.raycast = () => undefined;
    root.add(points);
  }

  // -- Star -----------------------------------------------------------------
  const starRadius = Math.max(STAR_DISTANCE * Math.tan(b.star.angularRadius), 0.05);
  const starGeo = track(new SphereGeometry(1, 48, 32));
  const starBinding: StarBinding = {
    temperature: { value: b.star.teffK, derived: false },
    colour: kelvinToRGB(b.star.teffK),
    limbDarkening: b.star.limbDarkening,
    coronaAmplitude: { value: coronaAmplitude(null), derived: true },
    spectralClass: b.star.spectralClass,
  };
  const starMat: ShaderMaterial = track(
    chart ? createChartDiscMaterial(ink) : createStarSurfaceMaterial(starBinding, { hdrGain: STAR_HDR_GAIN, colourManaged: true }),
  );
  const star = new Mesh(starGeo, starMat);
  star.name = "star";
  star.scale.setScalar(starRadius);
  star.position.copy(sun).multiplyScalar(STAR_DISTANCE);
  root.add(star);
  let corona: ShaderMaterial | null = null;
  if (!chart) {
    corona = track(createStarCoronaMaterial(starBinding));
    const halo = new Mesh(starGeo, corona);
    halo.scale.setScalar(starRadius * 1.6);
    halo.position.copy(star.position);
    halo.raycast = () => undefined;
    root.add(halo);
  }

  // -- Planet frame ---------------------------------------------------------
  const tilt = new Group();
  tilt.rotation.z = -b.tilt;
  root.add(tilt);
  const yaw = b.tidallyLocked ? Math.atan2(-sun.z, sun.x) : -0.4;
  const spin = new Group();
  spin.rotation.y = yaw;
  tilt.add(spin);

  const ringShadow: RingShadowUniforms | null = b.rings
    ? {
        normal: new Vector3(0, 1, 0).applyAxisAngle(new Vector3(0, 0, 1), -b.tilt),
        inner: b.rings.inner,
        outer: b.rings.outer,
        opacity: 0.85,
      }
    : null;

  const albedoTex = dataTexture(maps.albedo, maps.width, maps.height, true, registry);
  const propsTex = dataTexture(maps.props, maps.width, maps.height, false, registry);
  const emissionTex = dataTexture(maps.emission, maps.width, maps.height, true, registry);

  const sphere = track(new SphereGeometry(1, 160, 96));
  const surface: ShaderMaterial = track(
    chart
      ? createChartPlanetMaterial({
          ink,
          props: propsTex,
          seaLevel: maps.seaLevel,
          sun,
          locked: b.tidallyLocked,
          bands: b.kind === "rocky" ? 0 : Math.min(14, Math.max(3, 7 * Math.sqrt(10 / Math.max(b.rotationHours, 1)))),
        })
      : createPlanetSurfaceMaterial({
          albedo: albedoTex,
          props: propsTex,
          emission: emissionTex,
          sun,
          light,
          softness: b.atmosphere.terminatorSoftness,
          scatter: sc.scatter,
          sunset: sc.sunset,
          sunsetStrength: sc.sunsetStrength,
          density: sc.density,
          selection: theme.colours["--sf-primary"],
          texel: new Vector2(1 / maps.width, 1 / maps.height),
          relief: b.kind === "rocky" ? 3.2 : 0,
          rings: ringShadow,
        }),
  );
  const planet = new Mesh(sphere, surface);
  planet.name = "planet";
  spin.add(planet);

  // Clouds: their own group, so they turn at their own rate.
  const cloudSpin = new Group();
  cloudSpin.rotation.y = yaw;
  tilt.add(cloudSpin);
  if (!chart && b.clouds.coverage > 0) {
    const cloudTex = dataTexture(maps.clouds, maps.width, maps.height, false, registry);
    const cloudGeo = track(new SphereGeometry(1, 128, 72));
    const cloudMat = track(
      createCloudMaterial({ map: cloudTex, sun, light, colour: cloudReflectance(b), softness: b.atmosphere.terminatorSoftness, rings: ringShadow }),
    );
    const clouds = new Mesh(cloudGeo, cloudMat);
    clouds.name = "clouds";
    clouds.scale.setScalar(1.006);
    clouds.raycast = () => undefined;
    cloudSpin.add(clouds);
  }

  // Atmosphere: a scattering shell, or on the chart a thin coloured line.
  if (b.atmosphere.present) {
    const shellScale = 1 + Math.max(b.atmosphere.thickness, 0.004) * SHELL_EXAGGERATION;
    const shellGeo = track(new SphereGeometry(1, 96, 64));
    const shellMat = track(
      chart
        ? createChartLimbMaterial(sc.scatter, 1.4)
        : createScatterShellMaterial({
            sun,
            scatter: sc.scatter,
            sunset: sc.sunset,
            sunsetStrength: sc.sunsetStrength,
            density: Math.max(sc.density, 0.12),
            softness: b.atmosphere.terminatorSoftness,
            light,
            shellScale,
          }),
    );
    const shell = new Mesh(shellGeo, shellMat);
    shell.name = "atmosphere";
    shell.scale.setScalar(shellScale);
    shell.raycast = () => undefined;
    tilt.add(shell);
  }

  // Rings.
  if (b.rings) {
    const ringGeo = track(new RingGeometry(b.rings.inner, b.rings.outer, 256, 1));
    const ringMat = track(
      chart
        ? createChartRingMaterial({ inner: b.rings.inner, outer: b.rings.outer, ink, sun, seed: b.seed })
        : createRingMaterial({
            inner: b.rings.inner,
            outer: b.rings.outer,
            colour: RING_REFLECTANCE[b.rings.material],
            light,
            sun,
            seed: b.seed,
          }),
    );
    const ring = new Mesh(ringGeo, ringMat);
    ring.name = "rings";
    ring.rotation.x = -Math.PI / 2;
    ring.raycast = () => undefined;
    tilt.add(ring);
  }

  const hoverables: Array<[Material, "planet" | "star"]> = [
    [surface, "planet"],
    [starMat, "star"],
  ];

  const extent = b.rings ? b.rings.outer : 1 + (b.atmosphere.present ? b.atmosphere.thickness * SHELL_EXAGGERATION : 0);

  return {
    root,
    planet,
    star,
    registry,
    viewDirection: new Vector3(0, 0.22, 1).normalize().lerp(sun, b.tidallyLocked && b.atmosphere.present ? 0.5 : 0.3).normalize(),
    update: (t, still) => {
      const time = still ? 0 : t;
      spin.rotation.y = yaw + time * b.spinRate;
      cloudSpin.rotation.y = yaw + time * (b.spinRate + b.clouds.driftRate);
      if (!chart) {
        (starMat.uniforms.uTime as { value: number }).value = time;
        if (corona) (corona.uniforms.uTime as { value: number }).value = time;
      }
    },
    setHover: (target) => {
      for (const [mat, id] of hoverables) {
        const u = (mat as ShaderMaterial).uniforms?.uHover;
        if (u) u.value = target === id ? 1 : 0;
      }
    },
    // The body fills about 60% of the shorter side, with room for the readouts.
    framingDistance: (halfFov) => (extent * 1.7) / Math.sin(Math.max(halfFov, 0.05)),
    dispose: () => registry.disposeAll(),
  };
}
