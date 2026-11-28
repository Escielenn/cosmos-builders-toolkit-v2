import { describe, it, expect } from "vitest";
import type { CanonFact } from "@/canon/types";
import { validateManifest } from "@/canon/manifest";
import { isKnownPredicate } from "@/canon/vocabulary";
import { manifest } from "@/tools/exosky/manifest";
import {
  canonSkyContext,
  constellationEntityInput,
  constellationFacts,
  galacticPositionFact,
  poleFacts,
  skyReadoutFacts,
} from "@/lib/simulators/exosky-canon";
import { readGalacticPosition, resolveVantage, atmoFromPlanetType } from "@/lib/simulators/exosky-vantage";
import { presetByKey } from "@/lib/simulators/exosky-systems";
import { skyConditionsBrief } from "@/lib/simulators/exosky-brief";
import { poleDriftDeg } from "@/lib/simulators/exosky-sky";

const fact = (subjectId: string, predicate: string, value: CanonFact["value"], valueText = ""): CanonFact => ({
  id: `${subjectId}:${predicate}`, worldId: "w", subjectId, predicate, label: predicate, value, valueText, unit: null,
  confidence: "canon", provenance: { kind: "tool", label: "t", href: null, ref: {} }, outranks: [], conflicted: false,
});

const entities = [
  { id: "star", name: "Kellis", entity_type: "star", parent_entity_id: null },
  { id: "p1", name: "Kellis Prime", entity_type: "planet", parent_entity_id: "star" },
  { id: "p2", name: "Kellis Secundus", entity_type: "planet", parent_entity_id: "star" },
  { id: "m1", name: "Lantern", entity_type: "moon", parent_entity_id: "p1" },
  { id: "c1", name: "The Drowned Man", entity_type: "custom", parent_entity_id: "p1", metadata: { kind: "constellation", seenFrom: "p1" } },
];
const facts: CanonFact[] = [
  fact("star", "star.luminosity", { kind: "scalar", value: 0.4, unit: "solar_lum" }),
  fact("star", "star.galactic_position", { kind: "struct", schema: "galactic_position", value: { l_deg: 120, b_deg: -5, distance_pc: 18 } }),
  fact("p1", "orbit.semi_major_axis", { kind: "scalar", value: 0.62, unit: "au" }),
  fact("p1", "planet.rotation_period", null, "31.5 h"),
  fact("p1", "planet.obliquity", { kind: "scalar", value: 12, unit: "deg" }),
  fact("p2", "orbit.semi_major_axis", { kind: "scalar", value: 1.4, unit: "au" }),
  fact("p2", "planet.radius", { kind: "scalar", value: 2, unit: "earth_radii" }),
  fact("m1", "orbit.semi_major_axis", { kind: "scalar", value: 0.002, unit: "au" }),
  fact("c1", "constellation.stars[]", { kind: "text[]", values: ["HIP 1", "HIP 2"] }),
  fact("c1", "constellation.epoch", { kind: "scalar", value: -500, unit: "yr" }),
];

describe("ExoSky on the canon graph (E10 / E11 / N4 / N8)", () => {
  it("has a manifest that passes the /sf-audit rules", () => {
    expect(validateManifest(manifest)).toEqual([]);
  });

  it("reads the planet, its star, siblings, moons and constellations from canon", () => {
    const c = canonSkyContext(entities, facts, "p1")!;
    expect(c.star?.id).toBe("star");
    expect(c.planet["orbit.semi_major_axis"]).toBe(0.62);
    expect(c.planet["planet.rotation_period"]).toBe("31.5 h");
    expect(c.siblings.map((s) => s.name)).toEqual(["Kellis Secundus"]);
    expect(c.moons.map((m) => m.name)).toEqual(["Lantern"]);
    expect(c.constellations[0]).toMatchObject({ stars: ["HIP 1", "HIP 2"], epoch: -500 });
  });

  it("resolves a vantage from canon with provenance, and places it from star.galactic_position", () => {
    const c = canonSkyContext(entities, facts, "p1")!;
    const placement = readGalacticPosition(c.starFacts["star.galactic_position"]);
    expect(placement).toMatchObject({ l: 120, b: -5, distPc: 18 });
    const v = resolveVantage({
      catalogue: null,
      canon: { label: c.label, planet: c.planet, star: c.starFacts, siblings: c.siblings, moons: c.moons },
      placement: { ...placement!, source: "canon" },
    });
    expect(v.position?.source).toBe("canon");
    expect(v.host.lumSolar).toMatchObject({ value: 0.4, source: "canon" });
    expect(v.planet.rotationHours).toMatchObject({ value: 31.5, source: "canon" });
    expect(v.planet.pole.source).toBe("default");
  });

  it("leaves a Solaris handoff unplaced instead of inventing a position (E10)", () => {
    const v = resolveVantage({
      catalogue: null,
      handoff: { from: "solaris", starType: "orange", starMassLum: 0.42, planetAU: 0.7, planetName: "Vesh", planetType: "tidallocked" },
    });
    expect(v.position).toBeNull();
    expect(v.planet.tidallyLocked).toMatchObject({ value: true, source: "handoff" });
    expect(v.host.lumSolar).toMatchObject({ value: 0.42, source: "handoff" });
    expect(v.atmo.source).toBe("handoff");
    expect(atmoFromPlanetType("gasgiant")).toBe("gas_giant");
  });

  it("puts the writer's choice above canon", () => {
    const c = canonSkyContext(entities, facts, "p1")!;
    const v = resolveVantage({ catalogue: null, canon: { label: c.label, planet: c.planet, star: c.starFacts, siblings: [], moons: [] }, overrides: { obliquityDeg: 40 } });
    expect(v.planet.obliquityDeg).toMatchObject({ value: 40, source: "writer" });
  });

  it("writes only registered predicates, with ids for constellation stars", () => {
    const writes = [
      ...poleFacts("p1", { ra: 10, dec: 70 }, 30000),
      galacticPositionFact("star", { l: 1, b: 2, distPc: 3, catalogueId: "HIP 8102" }),
      ...skyReadoutFacts("p1", { poleStar: null, nakedEye: 4200, epochYears: 0 }),
      ...constellationFacts("c9", { name: "Lantern Road", starIds: ["HIP 32349", "HIP 30438"], epochYears: 100 }, "p1", ["The Drowned Man", "Lantern Road"]),
    ];
    for (const w of writes) expect(isKnownPredicate(w.predicate), w.predicate).toBe(true);
    expect(writes.find((w) => w.predicate === "constellation.stars[]")?.value).toEqual({ kind: "text[]", values: ["HIP 32349", "HIP 30438"] });
    expect(writes.every((w) => w.sourceKind === "sim")).toBe(true);
    expect(constellationEntityInput({ name: "Lantern Road", starIds: [], epochYears: 0 }, { id: "p1", name: "Kellis Prime" })).toMatchObject({
      entity_type: "custom", custom_type_label: "Constellation", parent_entity_id: "p1", metadata: { kind: "constellation" },
    });
  });

  it("carries the corrected statuses (E8)", () => {
    expect(presetByKey("barnard-b")?.status).toBe("confirmed");
    expect(presetByKey("kapteyn")?.status).toBe("refuted");
    expect(presetByKey("tau-ceti-e")?.status).toBe("candidate");
    expect(presetByKey("kepler-452b")?.status).toBe("disputed");
  });
});

describe("sky drift uses the planet's own precession (N5)", () => {
  it("moves Earth's pole ~2 × 23.4° over half a cycle", () => {
    expect(poleDriftDeg(23.44, 25772, 0, 12886)).toBeCloseTo(46.9, 0);
  });
  it("does not move a pole with no tilt", () => {
    expect(poleDriftDeg(0, 1000, 0, 500)).toBe(0);
  });
});

describe("the scene brief (N7)", () => {
  const b = skyConditionsBrief({
    place: "Kellis Prime", epochYears: 0, latitude: 30,
    host: { name: "Kellis", sizeDeg: 0.8, mag: -26, altDeg: 20 }, locked: false, solarDayHours: 31.5, orbitDays: 200,
    poleStar: null, nakedEye: 4200, catalogueComplete: true, brightestNight: { name: "Sirius", mag: -1.4 },
    moons: [{ name: "Lantern", phase: 0.5, sizeDeg: 0.3 }], sol: { mag: 4.1, visible: true }, extinctionAtHorizon: 7.6, atmoName: "Earth-like",
  });
  it("is labelled as conditions, not canon and not prose", () => {
    expect(b.label).toBe("// CONDITIONS BRIEF · DERIVED · NOT CANON, NOT PROSE");
  });
  it("cites a value on every line", () => {
    for (const l of b.lines) expect(l.cites.length).toBeGreaterThan(0);
  });
  it("never addresses the reader or narrates a character", () => {
    for (const l of b.lines) expect(l.text).not.toMatch(/\b(you|your|she|he|her|his)\b/i);
  });
});
