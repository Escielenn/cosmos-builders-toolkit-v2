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

  it("reports the newly mapped tools as mapped, where before they were dark", () => {
    for (const slug of [
      "propulsion-consequences-map",
      "one-big-lie",
      "lexdrift",
      "gravitas",
      "space-expansion-modeler",
    ]) {
      expect(hasFactMapping(slug), slug).toBe(true);
    }
  });

  it("gravitas surfaces how a ship makes its gravity", () => {
    const byKey = Object.fromEntries(
      extractWorksheetFacts("gravitas", {
        activeMode: "spin",
        spin: { radius_m: 500, rotation_rpm: 1.34 },
        thrust: { acceleration_g: 0.3 },
        artificial: { desired_g: 1, failure_mode: "gradual" },
      }).map((f) => [f.key, f.value]),
    );
    expect(byKey.gravityMethod).toBe("spin");
    expect(byKey.spinRadius).toBe("500");
    expect(byKey.rotationRpm).toBe("1.34");
    expect(byKey.thrustAcceleration).toBe("0.3");
    expect(byKey.gravityFailureMode).toBe("gradual");
  });

  it("space-expansion-modeler surfaces the synthesis a writer draws on", () => {
    const byKey = Object.fromEntries(
      extractWorksheetFacts("space-expansion-modeler", {
        foundation: {
          expansionName: "The Long Reach",
          originCivilization: "Terran Compact",
          startYear: "2189",
          oneBigLie: "Jump drives need a living navigator",
        },
        synthesis: {
          dominantForce: "Resource scarcity",
          overallTrajectory: "Overextension",
          biggestTensionPoint: "The colonies out-produce the core",
          narrativeTheme: "The frontier stops needing home",
          storyHooks: "A supply convoy simply stops arriving",
        },
      }).map((f) => [f.key, f.value]),
    );
    expect(byKey.expansionName).toBe("The Long Reach");
    expect(byKey.originCivilization).toBe("Terran Compact");
    expect(byKey.dominantForce).toBe("Resource scarcity");
    expect(byKey.narrativeTheme).toContain("frontier");
    expect(byKey.storyHooks).toContain("supply convoy");
  });

  it("lets either tool supply the premise, since both record it", () => {
    // The same field carries paths for both tools, so whichever the writer
    // filled in reaches their prose.
    const fromLie = extractWorksheetFacts("one-big-lie", {
      coreStatement: { statement: "A" },
    }).find((f) => f.key === "theOneBigLie");
    const fromExpansion = extractWorksheetFacts("space-expansion-modeler", {
      foundation: { oneBigLie: "B" },
    }).find((f) => f.key === "theOneBigLie");
    expect(fromLie?.value).toBe("A");
    expect(fromExpansion?.value).toBe("B");
    expect(fromLie?.label).toBe(fromExpansion?.label);
  });

  it("returns nothing for an empty worksheet rather than blank facts", () => {
    expect(extractWorksheetFacts("one-big-lie", { coreStatement: { statement: "" } })).toEqual([]);
    expect(extractWorksheetFacts("lexdrift", {})).toEqual([]);
  });
});

describe("coverage across the catalogue", () => {
  it("reports honestly which tools can reach the writing surface", () => {
    // Ask the predicate the product actually uses, not the worksheetPaths table
    // underneath it. Timeline reaches the surface through a bespoke extractor,
    // and a path-only measure reports it dark while the panel renders its
    // events: a shadow of the thing rather than the thing.
    const reaching = allTools.filter((t) => hasFactMapping(t));
    const dark = allTools.filter((t) => !hasFactMapping(t));

    // A floor, not a target: this must not regress. Raise it as tools are mapped.
    expect(reaching.length).toBeGreaterThanOrEqual(20);

    // Named so the list stays visible rather than becoming a silent number.
    // All three remaining are exceptions rather than gaps:
    //   environmental-chain-reaction records qualitative cascade conditions,
    //     read through useWorldParameters and the Tier 2 continuity rules.
    //   stellar-cartographer writes straight to world_entries via Publish, so
    //     its data is entity metadata and never becomes a worksheet.
    //   writing-workshop persists nothing at all. It is a prompt browser that
    //     reads worlds, so it has no data of its own to contribute.
    expect(dark).toEqual(
      expect.arrayContaining([
        "environmental-chain-reaction",
        "stellar-cartographer",
        "writing-workshop",
      ]),
    );
    // The two fixed most recently, named so a regression is loud.
    for (const slug of ["sensorium", "timeline"]) {
      expect(hasFactMapping(slug), slug).toBe(true);
    }
    // Named so a regression is loud: these were mapped and must stay mapped.
    for (const slug of ["gravitas", "space-expansion-modeler"]) {
      expect(hasFactMapping(slug), slug).toBe(true);
    }
  });

  it("has no mapping for a tool that is not in the catalogue", () => {
    // A typo'd slug would map a path to nothing forever and never be noticed.
    const known = new Set([...allTools, ...SIMULATOR_TOOL_IDS, "writing-workshop"]);
    for (const slug of mappedTools()) {
      expect(known.has(slug), `unknown tool slug in worksheetPaths: ${slug}`).toBe(true);
    }
  });
});
