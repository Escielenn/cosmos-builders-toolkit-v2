// ---------------------------------------------------------------------------
// bind/planet-scene-canon: canon first, then what a simulator published;
// civilisation and life only when canon says so.
// ---------------------------------------------------------------------------
import { describe, expect, it } from "vitest";
import type { CanonFact } from "@/canon/types";
import type { WorldEntry } from "@/services/world-data";
import { planetSceneFactsFromCanon, seedFromId } from "../bind/planet-scene-canon";
import { bindPlanetScene } from "../bind/planet-scene";

const entry = (metadata: Record<string, unknown>): WorldEntry =>
  ({ id: "p1", world_id: "w1", entry_type: "planet", title: "Kellis Prime", metadata, parent_id: "s1" }) as unknown as WorldEntry;

const fact = (predicate: string, value: unknown, subjectId = "p1", valueText = String(value)): CanonFact =>
  ({ id: `${subjectId}:${predicate}`, worldId: "w1", subjectId, predicate, label: predicate, value, valueText, unit: null }) as unknown as CanonFact;

const published = {
  _published_facts: [
    { predicate: "star.spectral_class", label: "Star", value: "K3V" },
    { predicate: "planet.atmo_pressure", label: "Pressure", value: 0.6 },
    { predicate: "planet.orbital_distance_au", label: "Orbit", value: 0.4 },
    { predicate: "orbit.tidally_locked", label: "Locked", value: "true" },
  ],
};

describe("planetSceneFactsFromCanon", () => {
  it("reads what a simulator published, through predicate aliases", () => {
    const f = planetSceneFactsFromCanon({ entry: entry(published), facts: [] });
    expect(f.spectralClass).toBe("K3V");
    expect(f.pressureBar).toBe(0.6);
    expect(f.aAU).toBe(0.4);
    expect(f.tidallyLocked).toBe(true);
  });

  it("lets canon outrank a published value: the G2 test, 0.6 → 1.4 bar", () => {
    const before = bindPlanetScene(planetSceneFactsFromCanon({ entry: entry(published), facts: [] }));
    const f = planetSceneFactsFromCanon({
      entry: entry(published),
      facts: [fact("planet.atmo_pressure", { kind: "scalar", value: 1.4, unit: "bar" })],
    });
    expect(f.pressureBar).toBe(1.4);
    const after = bindPlanetScene(f);
    expect(after.atmosphere.thickness).toBeGreaterThan(before.atmosphere.thickness);
    expect(after.atmosphere.scattering.density).toBeGreaterThan(before.atmosphere.scattering.density);
  });

  it("ignores facts about other subjects", () => {
    const f = planetSceneFactsFromCanon({ entry: entry({}), facts: [fact("planet.atmo_pressure", 50, "other")] });
    expect(f.pressureBar).toBeNull();
  });

  it("lights cities for a population on the planet or a polity claiming it, never otherwise", () => {
    expect(planetSceneFactsFromCanon({ entry: entry({}), facts: [] }).civilisation).toBeNull();
    expect(planetSceneFactsFromCanon({ entry: entry({}), facts: [fact("place.population", { kind: "scalar", value: 2e6 })] }).civilisation).toBe(true);
    const claim = fact("polity.territory[]", { kind: "ref[]", entity_ids: ["p1"] }, "polity-9", "Kellis Prime");
    expect(planetSceneFactsFromCanon({ entry: entry({}), facts: [claim] }).civilisation).toBe(true);
  });

  it("accepts a hydrosphere typed as a percentage", () => {
    const f = planetSceneFactsFromCanon({ entry: entry({}), facts: [fact("planet.hydrosphere_fraction", 40)] });
    expect(f.hydrosphere).toBeCloseTo(0.4, 6);
  });

  it("seeds terrain from the entity id, so a world keeps its coastlines", () => {
    expect(seedFromId("p1")).toBe(seedFromId("p1"));
    expect(seedFromId("p1")).not.toBe(seedFromId("p2"));
    expect(planetSceneFactsFromCanon({ entry: entry({}), facts: [] }).seed).toBe(seedFromId("p1"));
  });
});
