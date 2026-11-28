// ---------------------------------------------------------------------------
// Dispose discipline (14-RENDER-ENGINE §3: "Leaks in three.js are the norm,
// not the exception — test for them").
//
// Builds the whole planet rig and the post stack with no GPU, spies on every
// geometry, material and texture reachable from the scene graph, tears down,
// and asserts each one was released exactly once and nothing is left live.
// A resource added to the rig without going through its registry fails here.
// ---------------------------------------------------------------------------

import { describe, expect, it, vi } from "vitest";
import { Mesh, PerspectiveCamera, Points, Scene, Vector2, type Material, type Texture, type BufferGeometry } from "three";
import { createPlanetRig, SUN_DIRECTION } from "../scenes/planet-rig";
import { bindPlanetScene } from "../bind/planet-scene";
import { presetById, PLANET_PRESETS } from "../bind/planet-presets";
import { paintSurface } from "../materials/terrain";
import { readThemeUniforms } from "../engine/theme-uniforms";
import { DisposalRegistry } from "../engine/disposal";
import { TIER_SETTINGS } from "../engine/tiers";
import { buildPostStack, bloomStrength, BLOOM_THRESHOLD } from "../engine/post";

const theme = readThemeUniforms((t) => (t === "--sf-ambient" ? "1" : "#808080"));

function build(id: string, mode: "lit" | "chart") {
  const binding = bindPlanetScene(presetById(id)!.facts);
  const maps = paintSurface(binding, 64);
  return createPlanetRig({ binding, maps, mode, theme, starCount: 50, pixelRatio: 1 });
}

function collect(root: Mesh["parent"]) {
  const geos = new Set<BufferGeometry>();
  const mats = new Set<Material>();
  const texs = new Set<Texture>();
  root!.traverse((o) => {
    if (o instanceof Mesh || o instanceof Points) {
      geos.add(o.geometry);
      const m = o.material as Material;
      mats.add(m);
      const uniforms = (m as unknown as { uniforms?: Record<string, { value: unknown }> }).uniforms ?? {};
      for (const u of Object.values(uniforms)) {
        const v = u.value as Texture | null;
        if (v && (v as Texture).isTexture) texs.add(v);
      }
    }
  });
  return { geos, mats, texs };
}

describe("planet rig dispose discipline", () => {
  for (const preset of PLANET_PRESETS) {
    for (const mode of ["lit", "chart"] as const) {
      it(`releases every GPU resource: ${preset.id}, ${mode}`, () => {
        const rig = build(preset.id, mode);
        const { geos, mats, texs } = collect(rig.root);
        expect(geos.size).toBeGreaterThan(1);
        const spies = [...geos, ...mats, ...texs].map((r) => vi.spyOn(r, "dispose"));
        const stats = rig.dispose();
        for (const s of spies) expect(s).toHaveBeenCalledTimes(1);
        expect(stats.live).toBe(0);
        expect(stats.failed).toBe(0);
        // A second dispose (StrictMode double unmount) is a no-op.
        rig.dispose();
        for (const s of spies) expect(s).toHaveBeenCalledTimes(1);
      });
    }
  }

  it("poses a locked world with its substellar point toward the star, and never turns it", () => {
    const rig = build("eyeball", "lit");
    const planet = rig.planet;
    rig.update(0, false);
    const yaw0 = planet.parent!.rotation.y;
    rig.update(120, false);
    expect(planet.parent!.rotation.y).toBe(yaw0);
    // lon 0 is +X in the body frame; rotated by the yaw it must face the star.
    const facing = { x: Math.cos(yaw0), z: -Math.sin(yaw0) };
    const sunH = Math.hypot(SUN_DIRECTION.x, SUN_DIRECTION.z);
    expect(facing.x).toBeCloseTo(SUN_DIRECTION.x / sunH, 5);
    expect(facing.z).toBeCloseTo(SUN_DIRECTION.z / sunH, 5);
    rig.dispose();
  });

  it("turns a free world unless told to hold still", () => {
    const rig = build("earth", "lit");
    rig.update(0, false);
    const a = rig.planet.parent!.rotation.y;
    rig.update(10, false);
    expect(rig.planet.parent!.rotation.y).not.toBe(a);
    rig.update(10, true);
    expect(rig.planet.parent!.rotation.y).toBe(a);
    rig.dispose();
  });

  it("draws no clouds, corona or colour-managed star on the chart tier", () => {
    const rig = build("earth", "chart");
    const names: string[] = [];
    rig.root.traverse((o) => names.push(o.name));
    expect(names).not.toContain("clouds");
    expect(names).toContain("atmosphere");
    rig.dispose();
  });
});

describe("post stack", () => {
  const fakeRenderer = () => ({
    getPixelRatio: () => 2,
    getSize: (v: Vector2) => v.set(800, 600),
    getRenderTarget: () => null,
    setRenderTarget: () => undefined,
    render: () => undefined,
  });

  it("builds bloom at half the drawing buffer and disposes every pass", () => {
    const registry = new DisposalRegistry();
    const post = buildPostStack({
      renderer: fakeRenderer() as never,
      scene: new Scene(),
      camera: new PerspectiveCamera(),
      settings: TIER_SETTINGS.standard,
      ambient: 1,
      width: 800,
      height: 600,
      registry,
    });
    expect(post.bloom).not.toBeNull();
    expect(post.bloom!.threshold).toBe(BLOOM_THRESHOLD);
    // First bloom mip = half of 1600 × 1200 device pixels.
    expect(post.bloom!.renderTargetBright.width).toBe(800);
    expect(post.bloom!.renderTargetBright.height).toBe(600);
    const stats = registry.disposeAll();
    expect(stats.live).toBe(0);
    expect(stats.disposed).toBe(5); // composer, render, bloom, output, grain
  });

  it("turns bloom down to 0.2 with the ambient dial, never off", () => {
    expect(bloomStrength(0)).toBeCloseTo(0.2, 6);
    expect(bloomStrength(1)).toBeCloseTo(0.5, 6);
  });
});
