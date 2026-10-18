import { describe, expect, it } from "vitest";
import {
  BODY_PLAN_PRESETS,
  FIRST_DOCUMENT_TITLE,
  PLANET_TYPE_PRESETS,
  SEED_SOURCE,
  STAR_CLASS_PRESETS,
  buildSeedPayload,
  derivePlanet,
  deriveStar,
  surpriseBodyPlan,
  surprisePlanet,
  surpriseSpeciesName,
  surpriseStar,
  type SurveyChoices,
} from "@/lib/onboarding/survey-seed";
import { calcHZBoundaries } from "@/lib/habitable-zone/calculations";
import { calcSurfaceGravity } from "@/lib/surface-gravity/calculations";
import { ALL_RELATIONSHIP_TYPES, ENTITY_TYPES } from "@/services/entity-graph-types";
import { ENTITY_MASTER_FIELDS } from "@/lib/entity-config";

/** Deterministic rng cycling through fixed values. */
function seq(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

const FULL: SurveyChoices = {
  worldName: "  Kellis  ",
  star: { classId: "G2", name: "" },
  planet: { presetId: "earth-like", name: "Kellis Prime" },
  species: { name: "Vethari", bodyPlanId: "radial", line: "  They sing in tides.  " },
};

describe("star presets", () => {
  it("covers O through M including common K/G/M subtypes", () => {
    const classes = new Set(STAR_CLASS_PRESETS.map((s) => s.spectralClass));
    for (const c of ["O", "B", "A", "F", "G", "K", "M"]) expect(classes.has(c)).toBe(true);
    expect(STAR_CLASS_PRESETS.filter((s) => s.common).map((s) => s.spectralClass)).toEqual(
      expect.arrayContaining(["G", "K", "M"]),
    );
    expect(new Set(STAR_CLASS_PRESETS.map((s) => s.id)).size).toBe(STAR_CLASS_PRESETS.length);
  });

  it("derives the habitable zone from the existing calculator", () => {
    const star = deriveStar("G2")!;
    expect(star.designation).toBe("G2V");
    expect(star.hz).toEqual(calcHZBoundaries(1.0));
    expect(deriveStar("nope")).toBeNull();
  });
});

describe("planet derivation", () => {
  it("uses the surface-gravity engine for g", () => {
    const p = derivePlanet("super-earth", null)!;
    expect(p.gravity).toBeCloseTo(calcSurfaceGravity(p.mass, p.radius).gRatio, 10);
    expect(p.gravity).toBeGreaterThan(1);
    expect(p.orbit).toBeNull();
  });

  it("places an Earth-like world at 1 AU from a Sol analogue, inside the HZ", () => {
    const p = derivePlanet("earth-like", deriveStar("G2"))!;
    expect(p.orbit!.distanceAU).toBeCloseTo(1, 6);
    expect(p.orbit!.inHabitableZone).toBe(true);
    expect(p.orbit!.inConservativeZone).toBe(true);
    expect(p.orbit!.periodDays).toBeCloseTo(365.25, 1);
    expect(p.gravity).toBeCloseTo(1, 6);
  });

  it("keeps every preset inside the optimistic HZ for every main-sequence star", () => {
    for (const s of STAR_CLASS_PRESETS) {
      for (const pp of PLANET_TYPE_PRESETS) {
        const p = derivePlanet(pp.id, deriveStar(s.id))!;
        expect(p.orbit!.inHabitableZone, `${pp.id} @ ${s.id}`).toBe(true);
      }
    }
  });

  it("flags a tidally locked preset around a star it does not suit", () => {
    expect(derivePlanet("tidally-locked", deriveStar("G2"))!.starMismatch).toBe(true);
    expect(derivePlanet("tidally-locked", deriveStar("M5"))!.starMismatch).toBe(false);
    expect(derivePlanet("tidally-locked", null)!.starMismatch).toBe(false);
  });
});

describe("buildSeedPayload", () => {
  it("builds star, planet and species with connections and a prose-free first document", () => {
    const p = buildSeedPayload(FULL);
    expect(p.worldName).toBe("Kellis");
    expect(p.entities.map((e) => e.key)).toEqual(["star", "planet", "species"]);
    for (const e of p.entities) {
      expect(ENTITY_TYPES).toContain(e.entity_type);
      expect(e.metadata.seededBy).toBe(SEED_SOURCE);
    }

    const [star, planet, species] = p.entities;
    expect(star.name).toBe("Kellis Primary");
    expect(star.description).toBe("");
    expect(star.metadata).toMatchObject({ spectralClass: "G", spectralType: "G2V", luminosity: 1, temperature: 5778 });

    expect(planet.name).toBe("Kellis Prime");
    expect(planet.description).toBe("");
    expect(planet.metadata).toMatchObject({
      mass: 1,
      radius: 1,
      surfaceGravity: 1,
      orbitalDistance: 1,
      starType: "G2V",
      stellarLuminosity: 1,
      inHabitableZone: true,
      composition: "rocky",
    });

    // The writer's line is kept verbatim (trimmed), never authored.
    expect(species.description).toBe("They sing in tides.");
    expect(species.metadata).toMatchObject({ speciesName: "Vethari", bodyPlan: "radial" });

    expect(p.connections).toEqual([
      { source: "planet", target: "star", relationship_type: "orbits", cascade_stage: "physics" },
      { source: "species", target: "planet", relationship_type: "inhabits", cascade_stage: "biology" },
    ]);
    for (const c of p.connections) expect(ALL_RELATIONSHIP_TYPES).toContain(c.relationship_type);

    expect(p.document).toEqual({ title: FIRST_DOCUMENT_TITLE, setInPlace: "planet", subject: "planet" });
  });

  it("writes planet values under the keys the planet infobox reads", () => {
    const keys = new Set(ENTITY_MASTER_FIELDS.planet.map((f) => f.key));
    const planet = buildSeedPayload(FULL).entities.find((e) => e.key === "planet")!;
    for (const k of ["mass", "radius", "surfaceGravity", "orbitalDistance", "stellarLuminosity", "starType", "composition", "surfaceTemperature"]) {
      expect(keys.has(k), k).toBe(true);
      expect(planet.metadata[k], k).toBeDefined();
    }
    const speciesKeys = new Set(ENTITY_MASTER_FIELDS.species.map((f) => f.key));
    expect(speciesKeys.has("bodyPlan")).toBe(true);
    expect(speciesKeys.has("speciesName")).toBe(true);
  });

  it("adds a tidal-lock edge for the tidally locked preset", () => {
    const p = buildSeedPayload({ ...FULL, star: { classId: "M5", name: "" }, planet: { presetId: "tidally-locked", name: "" } });
    expect(p.connections.map((c) => c.relationship_type)).toEqual(["orbits", "tidally_locked_to", "inhabits"]);
    expect(p.entities.find((e) => e.key === "planet")!.metadata.tidallyLocked).toBe(true);
    expect(p.entities.find((e) => e.key === "planet")!.name).toBe("Kellis");
  });

  it("skipping the star leaves the planet without orbital values or an orbit edge", () => {
    const p = buildSeedPayload({ ...FULL, star: null });
    expect(p.entities.map((e) => e.key)).toEqual(["planet", "species"]);
    const planet = p.entities[0];
    expect(planet.metadata.orbitalDistance).toBeUndefined();
    expect(planet.metadata.starType).toBeUndefined();
    expect(planet.metadata.surfaceGravity).toBe(1);
    expect(p.connections).toEqual([
      { source: "species", target: "planet", relationship_type: "inhabits", cascade_stage: "biology" },
    ]);
  });

  it("skipping the planet drops both edges and points the document at the star", () => {
    const p = buildSeedPayload({ ...FULL, planet: null });
    expect(p.entities.map((e) => e.key)).toEqual(["star", "species"]);
    expect(p.connections).toEqual([]);
    expect(p.document).toEqual({ title: FIRST_DOCUMENT_TITLE, setInPlace: null, subject: "star" });
  });

  it("skipping everything still yields a world and an empty first document", () => {
    const p = buildSeedPayload({ worldName: "", star: null, planet: null, species: null });
    expect(p.worldName).toBe("Unnamed World");
    expect(p.entities).toEqual([]);
    expect(p.connections).toEqual([]);
    expect(p.document).toEqual({ title: FIRST_DOCUMENT_TITLE, setInPlace: null, subject: null });
  });

  it("treats a species with neither name nor body plan as skipped", () => {
    const p = buildSeedPayload({ ...FULL, species: { name: " ", bodyPlanId: "", line: "x" } });
    expect(p.entities.some((e) => e.key === "species")).toBe(false);
  });

  it("ignores unknown preset ids rather than inventing values", () => {
    const p = buildSeedPayload({ ...FULL, star: { classId: "Z9", name: "" }, planet: { presetId: "nope", name: "" } });
    expect(p.entities.map((e) => e.key)).toEqual(["species"]);
  });
});

describe("surprise me", () => {
  it("is deterministic for a given rng and returns known ids", () => {
    expect(surpriseStar(seq(0))).toBe(surpriseStar(seq(0)));
    expect(STAR_CLASS_PRESETS.map((s) => s.id)).toContain(surpriseStar(seq(0.99)));
    expect(BODY_PLAN_PRESETS.map((b) => b.id)).toContain(surpriseBodyPlan(seq(0.5)));
  });

  it("never picks a planet preset that does not suit the star", () => {
    for (let x = 0; x < 1; x += 0.05) {
      expect(surprisePlanet(seq(x), "G2")).not.toBe("tidally-locked");
    }
    const mPicks = new Set<string>();
    for (let x = 0; x < 1; x += 0.05) mPicks.add(surprisePlanet(seq(x), "M5"));
    expect(mPicks.has("tidally-locked")).toBe(true);
  });

  it("makes a capitalised single-word species name", () => {
    const name = surpriseSpeciesName(seq(0.1, 0.7, 0.3, 0.9, 0.5));
    expect(name).toMatch(/^[A-Z][a-z]+$/);
  });
});
