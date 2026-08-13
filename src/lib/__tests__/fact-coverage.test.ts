import { describe, it, expect } from "vitest";
import { ENTITY_MASTER_FIELDS } from "@/lib/entity-config";
import { extractWorksheetFacts, hasFactMapping } from "@/lib/worksheet-facts";
import { FREE_TOOL_IDS, PRO_TOOL_IDS, SIMULATOR_TOOL_IDS } from "@/lib/tools-config";

// ---------------------------------------------------------------------------
// A mapping that points at a path nothing writes is dead weight: it looks like
// coverage and delivers nothing. Three of the continuity engine's first five
// checks were dead exactly that way. These tests assert the mappings against
// the shapes the tools actually persist.
// ---------------------------------------------------------------------------

const allTools = [...FREE_TOOL_IDS, ...PRO_TOOL_IDS].filter(
  (t) => !SIMULATOR_TOOL_IDS.includes(t),
);

/** Every tool slug that appears in any worksheetPaths entry. */
function mappedTools(): Set<string> {
  const out = new Set<string>();
  for (const fields of Object.values(ENTITY_MASTER_FIELDS)) {
    for (const f of fields) {
      for (const slug of Object.keys(f.worksheetPaths ?? {})) out.add(slug);
    }
  }
  return out;
}

describe("mapping hygiene", () => {
  it("gives every mapped field a label and a key", () => {
    for (const [entityType, fields] of Object.entries(ENTITY_MASTER_FIELDS)) {
      for (const f of fields) {
        expect(f.label, `${entityType} field label`).toBeTruthy();
        expect(f.key, `${entityType} ${f.label} key`).toBeTruthy();
      }
    }
  });

  it("never maps two different fields to the same key with different labels", () => {
    // extractWorksheetFacts dedupes by key and takes the first label it sees, so
    // a duplicate key with a different label makes the surfaced label arbitrary.
    const labelByKey = new Map<string, string>();
    for (const fields of Object.values(ENTITY_MASTER_FIELDS)) {
      for (const f of fields) {
        const seen = labelByKey.get(f.key);
        if (seen) expect(f.label, `key ${f.key}`).toBe(seen);
        else labelByKey.set(f.key, f.label);
      }
    }
  });

  it("uses dot paths, never a leading or trailing dot", () => {
    for (const fields of Object.values(ENTITY_MASTER_FIELDS)) {
      for (const f of fields) {
        for (const [slug, path] of Object.entries(f.worksheetPaths ?? {})) {
          expect(path, `${slug} on ${f.key}`).not.toMatch(/^\.|\.$|\.\./);
          expect(path.length, `${slug} on ${f.key}`).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("newly mapped tools actually surface their values", () => {
  // Each fixture mirrors the tool's own initialFormState shape. If a tool's
  // shape changes and a path goes stale, the matching case here fails.

  it("propulsion-consequences-map surfaces the drive and its travel times", () => {
    const facts = extractWorksheetFacts("propulsion-consequences-map", {
      system: {
        type: "Fusion torch",
        maxVelocity: "0.08c",
        acceleration: "0.3 g",
        energySource: "Deuterium-helium-3",
      },
      benchmarks: {
        earthMars: "9 days",
        earthJupiter: "6 weeks",
        solAlphaCentauri: "54 years",
      },
      costs: { crewCapacity: "180", cargoCapacity: "4,000 t", serviceLife: "40 years" },
    });
    const byKey = Object.fromEntries(facts.map((f) => [f.key, f.value]));

    expect(byKey.propulsionType).toBe("Fusion torch");
    expect(byKey.topSpeed).toBe("0.08c");
    expect(byKey.acceleration).toBe("0.3 g");
    expect(byKey.energySource).toBe("Deuterium-helium-3");
    expect(byKey.travelEarthMars).toBe("9 days");
    expect(byKey.travelSolAlphaCentauri).toBe("54 years");
    expect(byKey.cargoCapacity).toBe("4,000 t");
    expect(byKey.serviceLife).toBe("40 years");
    expect(byKey.crewSize).toBe("180");
  });

  it("does not put a free-text speed into the fraction-of-c field", () => {
    // "0.08c" in a field labelled "Cruise Velocity (fraction of c)" would hand
    // the continuity engine 0.08 in the wrong unit, or a string it cannot parse.
    const facts = extractWorksheetFacts("propulsion-consequences-map", {
      system: { maxVelocity: "0.08c" },
    });
    expect(facts.find((f) => f.key === "cruiseVelocity")).toBeUndefined();
  });

  it("one-big-lie surfaces the premise itself", () => {
    const facts = extractWorksheetFacts("one-big-lie", {
      coreStatement: {
        statement: "Minds can be copied, but never twice from the same person.",
        scienceBroken: "No-cloning theorem",
      },
      justification: {
        whatBecomesPossible: "A single resurrection per lifetime",
        whatBecomesImpossible: "Armies of identical copies",
      },
      testability: { inWorldTest: "The second copy always fails to boot" },
    });
    const byKey = Object.fromEntries(facts.map((f) => [f.key, f.value]));

    expect(byKey.theOneBigLie).toContain("Minds can be copied");
    expect(byKey.scienceBroken).toBe("No-cloning theorem");
    expect(byKey.becomesPossible).toBe("A single resurrection per lifetime");
    expect(byKey.becomesImpossible).toBe("Armies of identical copies");
    expect(byKey.inWorldTest).toContain("fails to boot");
  });

  it("lexdrift surfaces the language and how far it has drifted", () => {
    const facts = extractWorksheetFacts("lexdrift", {
      mission: { duration: 200, population: 2500, isolation: "high" },
      linguistic: { linguaFranca: "Shipboard Anglic", liturgicalLanguage: "Old Terran" },
      social: { educationPolicy: "moderate" },
      storyNotes: {
        linguisticIdentity: "They call themselves the Spoken",
        generationalShift: "The third generation stops using Earth idioms",
      },
    });
    const byKey = Object.fromEntries(facts.map((f) => [f.key, f.value]));

    expect(byKey.linguaFranca).toBe("Shipboard Anglic");
    expect(byKey.driftDuration).toBe("200");
    expect(byKey.speakerPopulation).toBe("2500");
    expect(byKey.isolation).toBe("high");
    expect(byKey.liturgicalLanguage).toBe("Old Terran");
    expect(byKey.linguisticIdentity).toContain("the Spoken");
    expect(byKey.generationalShift).toContain("third generation");
  });

  it("reports the three as mapped, where before they were dark", () => {
    for (const slug of ["propulsion-consequences-map", "one-big-lie", "lexdrift"]) {
      expect(hasFactMapping(slug), slug).toBe(true);
    }
  });

  it("returns nothing for an empty worksheet rather than blank facts", () => {
    expect(extractWorksheetFacts("one-big-lie", { coreStatement: { statement: "" } })).toEqual([]);
    expect(extractWorksheetFacts("lexdrift", {})).toEqual([]);
  });
});

describe("coverage across the catalogue", () => {
  it("reports honestly which tools can reach the writing surface", () => {
    const mapped = mappedTools();
    const reaching = allTools.filter((t) => mapped.has(t));
    const dark = allTools.filter((t) => !mapped.has(t));

    // A floor, not a target: this must not regress. Raise it as tools are mapped.
    expect(reaching.length).toBeGreaterThanOrEqual(16);

    // Named so the list stays visible rather than becoming a silent number.
    // environmental-chain-reaction is a deliberate exception: it records
    // qualitative cascade conditions read through useWorldParameters and the
    // Tier 2 continuity rules, not numeric worksheet facts.
    expect(dark).toEqual(
      expect.arrayContaining([
        "environmental-chain-reaction",
        "gravitas",
        "sensorium",
        "space-expansion-modeler",
        "stellar-cartographer",
        "timeline",
      ]),
    );
  });

  it("has no mapping for a tool that is not in the catalogue", () => {
    // A typo'd slug would map a path to nothing forever and never be noticed.
    const known = new Set([...allTools, ...SIMULATOR_TOOL_IDS, "writing-workshop"]);
    for (const slug of mappedTools()) {
      expect(known.has(slug), `unknown tool slug in worksheetPaths: ${slug}`).toBe(true);
    }
  });
});
