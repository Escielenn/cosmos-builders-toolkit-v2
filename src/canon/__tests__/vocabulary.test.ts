import { describe, it, expect } from "vitest";
import { ENTITY_MASTER_FIELDS } from "@/lib/entity-config";
import { extractTimelineFacts } from "@/lib/timeline-facts";
import { PREDICATE_ALIASES } from "@/lib/simulators/published-facts";
import {
  LEGACY_PREFIX,
  VOCABULARY,
  isKnownPredicate,
  predicateDef,
  predicateLabel,
  predicateSpellingsFor,
  resolvePredicate,
} from "@/canon/vocabulary";

/** Every key extractWorksheetFacts can emit through a worksheetPaths mapping. */
const MAPPED_KEYS = [
  ...new Set(
    Object.values(ENTITY_MASTER_FIELDS)
      .flat()
      .filter((f) => f.worksheetPaths && Object.keys(f.worksheetPaths).length > 0)
      .map((f) => f.key),
  ),
];

/** Keys the bespoke extractors and simulation readers emit (static parts). */
const BESPOKE_KEYS = [
  "timeline.span",
  "timeline.eventCount",
  "surfaceMap.body",
  "surfaceMap.placeCount",
  "surfaceMap.place.abc-123",
  "system.name",
  "system.stars",
  "system.habitableZone",
  "system.planetCount",
  "system.planet.kellis-prime",
  "system.moons.kellis-prime",
  "sky.vantage",
  "sky.hostStar",
  "sky.distance",
  "sky.region",
  "sky.sky",
  "sky.constellation.the-drowned-man",
  "encounter.system",
  "encounter.outcome",
  "encounter.intruder",
  "encounter.approach",
  "encounter.elapsed",
  "encounter.held",
  "encounter.ejected.kellis",
  "event.date",
  "branch.name",
];

describe("vocabulary: alias coverage", () => {
  it("finds the pipeline keys it is meant to cover", () => {
    // Guard against the fixture silently going empty.
    expect(MAPPED_KEYS.length).toBeGreaterThan(100);
    expect(MAPPED_KEYS).toContain("surfaceGravity");
  });

  it.each(MAPPED_KEYS)("worksheet key %s resolves to a known predicate", (key) => {
    const r = resolvePredicate(key);
    expect(isKnownPredicate(r.predicate)).toBe(true);
    expect(r.via === "alias" || r.via === "legacy").toBe(true);
    if (r.via === "legacy") expect(r.predicate).toBe(`${LEGACY_PREFIX}${key}`);
  });

  it.each(BESPOKE_KEYS)("bespoke / simulator key %s resolves (never orphaned)", (key) => {
    expect(isKnownPredicate(resolvePredicate(key).predicate)).toBe(true);
  });

  it("timeline's real keys resolve", () => {
    const facts = extractTimelineFacts({ events: [{ id: "e", title: "Landing", date: "1200" }] });
    for (const f of facts) expect(isKnownPredicate(resolvePredicate(f.key).predicate)).toBe(true);
  });

  it("maps the physics keys onto 08-VOCABULARY predicates", () => {
    expect(resolvePredicate("surfaceGravity").predicate).toBe("planet.surface_gravity");
    expect(resolvePredicate("mass").predicate).toBe("planet.mass");
    expect(resolvePredicate("radius").predicate).toBe("planet.radius");
    expect(resolvePredicate("starType").predicate).toBe("star.spectral_class");
    expect(resolvePredicate("primaryStarClass").predicate).toBe("star.spectral_class");
    expect(resolvePredicate("orbitalDistance").predicate).toBe("orbit.semi_major_axis");
    expect(resolvePredicate("theOneBigLie").predicate).toBe("world.axiom");
    expect(resolvePredicate("propulsionType").predicate).toBe("propulsion.type");
    expect(resolvePredicate("crewSize").predicate).toBe("vessel.crew_size");
  });

  it("keeps entity names out of the predicate namespace", () => {
    for (const k of ["systemName", "speciesName", "characterName"]) {
      expect(resolvePredicate(k).via).toBe("legacy");
    }
  });

  it("every declared alias is a key the pipeline actually emits", () => {
    const emitted = new Set([...MAPPED_KEYS, ...BESPOKE_KEYS]);
    for (const d of VOCABULARY) for (const a of d.aliases ?? []) expect(emitted.has(a), a).toBe(true);
  });

  it("aliases always land on a canonical, non-deprecated predicate", () => {
    for (const d of VOCABULARY) {
      if (!d.aliases?.length) continue;
      expect(d.deprecated).toBeUndefined();
      expect(d.provisional).toBeUndefined();
    }
  });
});

describe("vocabulary: naming rules (08)", () => {
  it("is <domain>.<attribute>, snake_case, unique", () => {
    const seen = new Set<string>();
    for (const d of VOCABULARY) {
      expect(seen.has(d.predicate), d.predicate).toBe(false);
      seen.add(d.predicate);
      expect(d.predicate).toMatch(/^[a-z]+(\.[a-z][a-z0-9_]*(\[\])?)+$/);
    }
  });

  it("never names a tool in a non-deprecated predicate", () => {
    const tools = ["genesis", "atlas", "orrery", "solaris", "exosky", "tidelock", "rogue", "phylo", "mythos"];
    for (const d of VOCABULARY) {
      if (d.deprecated) continue;
      for (const t of tools) expect(d.predicate.split(".")[0]).not.toBe(t);
    }
  });

  it("deprecated spellings point at real predicates and resolve through them", () => {
    for (const d of VOCABULARY.filter((x) => x.deprecated)) {
      expect(predicateDef(d.aliasOf!)).toBeDefined();
      expect(resolvePredicate(d.predicate)).toMatchObject({ predicate: d.aliasOf, via: "deprecated" });
    }
    expect(predicateSpellingsFor("planet.mass")).toEqual(["planet.mass", "planet.mass_earths"]);
    expect(predicateSpellingsFor("planet.mass_earths")[0]).toBe("planet.mass");
  });

  it("agrees with published-facts' alias table (one fix reaches every reader)", () => {
    for (const [canonical, aliases] of Object.entries(PREDICATE_ALIASES)) {
      for (const a of aliases) expect(resolvePredicate(a).predicate).toBe(canonical);
    }
  });

  it("an exact predicate always outranks an alias", () => {
    // "configuration" is both a key and a predicate attribute; the predicate
    // name itself resolves exactly.
    expect(resolvePredicate("system.configuration").via).toBe("exact");
    expect(resolvePredicate("configuration").via).toBe("alias");
  });

  it("labels legacy predicates by their key", () => {
    expect(predicateLabel("legacy.timeline.span")).toBe("timeline.span");
    expect(predicateLabel("planet.surface_gravity")).toBe("Surface gravity");
  });
});
