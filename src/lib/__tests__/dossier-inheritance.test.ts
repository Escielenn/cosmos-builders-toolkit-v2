import { describe, it, expect } from "vitest";
import {
  TRAIT_BY_KEY,
  TRAIT_SPECS,
  matchMythosForSpecies,
  matchSensoriumForSpecies,
  resolveTrait,
  resolveTraits,
  setOverride,
  snapshotTraits,
  type UpstreamSheet,
} from "@/lib/dossier/inheritance";
import { buildDramatisPersonae, buildDossierMarkdown, buildSnapshot, deriveBody } from "@/lib/dossier/snapshot";
import { planConnectionSync, relationshipLabel } from "@/lib/dossier/relationships";
import { createEmptyDossier, normalizeDossier, type DossierRelationship } from "@/lib/dossier/types";

// ── Fixtures: Kellis, the Verrid, House Adran ────────────────────────────

const kellis: UpstreamSheet = {
  id: "ws-kellis",
  title: "Kellis",
  toolType: "planetary-profile",
  data: {
    physicalCharacteristics: { surfaceGravity: "1.4g", dayLength: "31 hours" },
    stellarEnvironment: { orbitalPeriod: "182.625 days" },
  },
};

const verrid: UpstreamSheet = {
  id: "ws-verrid",
  title: "The Verrid",
  toolType: "evolutionary-biology",
  data: {
    speciesName: "Verrid",
    reproduction: { lifespan: "long" },
    bodyPlan: { sizeRange: { min: "1.2 m", max: "1.6 m" } },
  },
};

const verridSenses: UpstreamSheet = {
  id: "ws-sens",
  title: "Verrid senses",
  toolType: "sensorium",
  data: {
    speciesName: "verrid",
    finalSelection: [],
    perceptionProfile: { dominantSense: "Infrasound" },
    perceptionGapNotes: { speciesBlind: "<p>Colour</p>" },
  },
};

const verridMyth: UpstreamSheet = {
  id: "ws-myth",
  title: "The Deep Choir",
  toolType: "xenomythology-framework-builder",
  data: {
    _linkedWorksheets: { species: { worksheetId: "ws-verrid" } },
    deathPractices: { deathRituals: "<p>The body is given to the <strong>pressure trench</strong>.</p>" },
    divineConceptualization: { deities: [{ archetypeName: "The Listener" }, { archetypeName: "" }] },
  },
};

const sheets = { homeworld: kellis, species: verrid, sensorium: verridSenses, culture: verridMyth };

describe("resolveTrait", () => {
  it("inherits from the worksheet in the trait's slot", () => {
    const t = resolveTrait(TRAIT_BY_KEY.lifespan, verrid, undefined);
    expect(t.status).toBe("inherited");
    expect(t.value).toBe("Long (centuries)");
    expect(t.source).toEqual({ worksheetId: "ws-verrid", title: "The Verrid" });
  });

  it("reports missing, never a fabricated value, when nothing is linked", () => {
    const t = resolveTrait(TRAIT_BY_KEY.lifespan, null, undefined);
    expect(t.status).toBe("missing");
    expect(t.value).toBeNull();
    expect(t.source).toBeNull();
  });

  it("reports unrecorded when the worksheet exists but the field is blank", () => {
    const t = resolveTrait(TRAIT_BY_KEY.cognition, verrid, undefined);
    expect(t.status).toBe("unrecorded");
    expect(t.value).toBeNull();
  });

  it("marks an override over an inherited value as overridden, keeping the original", () => {
    const t = resolveTrait(TRAIT_BY_KEY.lifespan, verrid, "Cut short by the plague");
    expect(t.status).toBe("overridden");
    expect(t.value).toBe("Cut short by the plague");
    expect(t.inheritedValue).toBe("Long (centuries)");
  });

  it("marks an override with nothing upstream as manual", () => {
    const t = resolveTrait(TRAIT_BY_KEY.lifespan, null, "Ninety years");
    expect(t.status).toBe("manual");
    expect(t.value).toBe("Ninety years");
  });

  it("treats a whitespace override as no override", () => {
    expect(resolveTrait(TRAIT_BY_KEY.lifespan, verrid, "   ").status).toBe("inherited");
  });

  it("strips HTML from rich-text upstream fields", () => {
    const t = resolveTrait(TRAIT_BY_KEY.funeralCustoms, verridMyth, undefined);
    expect(t.value).toBe("The body is given to the pressure trench.");
    expect(resolveTrait(TRAIT_BY_KEY.blindTo, verridSenses, undefined).value).toBe("Colour");
  });

  it("derives native gravity from mass and radius when Genesis has no gravity", () => {
    const sheet: UpstreamSheet = {
      ...kellis,
      data: { physicalCharacteristics: { planetaryMass: "4", planetaryRadius: "2" } },
    };
    expect(resolveTrait(TRAIT_BY_KEY.gravityAdaptation, sheet, undefined).value).toBe("1 g");
  });

  it("skips blank deities rather than listing an empty name", () => {
    expect(resolveTrait(TRAIT_BY_KEY.deities, verridMyth, undefined).value).toBe("The Listener");
  });

  it("survives a reader throwing on malformed data", () => {
    const broken: UpstreamSheet = { ...verrid, data: null as unknown as Record<string, unknown> };
    expect(() => resolveTrait(TRAIT_BY_KEY.lifespan, broken, undefined)).not.toThrow();
  });
});

describe("the pitch: born on Kellis, Verrid, House Adran", () => {
  it("pre-populates lifespan, sensory range, gravity adaptation and funeral customs", () => {
    const traits = resolveTraits(sheets, {});
    const by = Object.fromEntries(traits.map((t) => [t.key, t]));
    expect(by.lifespan.value).toBe("Long (centuries)");
    expect(by.dominantSense.value).toBe("Infrasound");
    expect(by.gravityAdaptation.value).toBe("1.4 g");
    expect(by.funeralCustoms.value).toContain("pressure trench");
    // No language worksheet linked: phonology is honestly absent.
    expect(by.phonology.status).toBe("missing");
  });

  it("covers every slot in the catalogue", () => {
    const slots = new Set(TRAIT_SPECS.map((s) => s.slot));
    for (const s of ["homeworld", "species", "sensorium", "culture", "polity", "language"]) {
      expect(slots.has(s as never), s).toBe(true);
    }
  });
});

describe("setOverride", () => {
  it("sets, and clears on blank, without mutating", () => {
    const a = {};
    const b = setOverride(a, "lifespan", "Short");
    expect(a).toEqual({});
    expect(b).toEqual({ lifespan: "Short" });
    expect(setOverride(b, "lifespan", "  ")).toEqual({});
    expect(setOverride(b, "lifespan", null)).toEqual({});
  });
});

describe("snapshotTraits", () => {
  it("records the producing tool for inherited values and 'override' for overrides", () => {
    const traits = resolveTraits(sheets, { dominantSense: "Touch" });
    const { resolved, provenance } = snapshotTraits(traits);
    expect(resolved.lifespan).toBe("Long (centuries)");
    expect(provenance.lifespan).toBe("evolutionary-biology");
    expect(resolved.dominantSense).toBe("Touch");
    expect(provenance.dominantSense).toBe("override");
    // Missing traits never reach the snapshot as blanks.
    expect("phonology" in resolved).toBe(false);
  });
});

describe("auto-linking", () => {
  it("finds Sensorium by explicit link first, then by species name", () => {
    const linked: UpstreamSheet = {
      ...verridSenses,
      id: "ws-sens-linked",
      data: { _linkedWorksheets: { evoBio: { worksheetId: "ws-verrid" } } },
    };
    expect(matchSensoriumForSpecies([verridSenses, linked], verrid)?.id).toBe("ws-sens-linked");
    expect(matchSensoriumForSpecies([verridSenses], verrid)?.id).toBe("ws-sens");
    expect(matchSensoriumForSpecies([verridSenses], null)).toBeNull();
  });

  it("finds Mythos only by its explicit species link", () => {
    expect(matchMythosForSpecies([verridMyth], verrid)?.id).toBe("ws-myth");
    expect(matchMythosForSpecies([{ ...verridMyth, data: {} }], verrid)).toBeNull();
  });
});

describe("deriveBody and buildSnapshot", () => {
  it("derives weight at home and local age from the effective traits", () => {
    const state = createEmptyDossier();
    state.body = { heightCm: "158", massKg: "70", age: "30", ageUnit: "standard" };
    const traits = resolveTraits(sheets, {});
    const body = deriveBody(state, traits);
    expect(body.nativeG).toBe(1.4);
    expect(body.weightAtHome?.earthScaleKg).toBeCloseTo(98, 6);
    // Kellis' year is half a standard year: 30 standard = 60 local.
    expect(body.ageLocal).toBeCloseTo(60, 6);
  });

  it("lets an override of native gravity flow into the weight", () => {
    const state = createEmptyDossier();
    state.body.massKg = "70";
    const traits = resolveTraits(sheets, { gravityAdaptation: "1 g" });
    expect(deriveBody(state, traits).weightAtHome?.earthScaleKg).toBeCloseTo(70, 6);
  });

  it("snapshots origins, body and relationships for the fact extractor", () => {
    const state = createEmptyDossier();
    state.identity.name = "Kael";
    state.origins.homeworld = { worksheetId: "ws-kellis", name: "Kellis" };
    state.origins.species = { worksheetId: "ws-verrid", name: "Verrid" };
    state.origins.house = "House Adran";
    state.body.massKg = "70";
    state.relationships = [
      { id: "r1", type: "rival", customLabel: "", targetKind: "dossier", targetId: "ws-2", targetName: "Ilse", note: "", connectionId: null },
    ];
    const { resolved, provenance } = buildSnapshot(state, resolveTraits(sheets, {}));
    expect(resolved.homeworld).toBe("Kellis");
    expect(provenance.homeworld).toBe("planetary-profile");
    expect(resolved.weightAtHome).toContain("98 kg");
    expect(resolved.relationships).toBe("Rival: Ilse");
  });
});

describe("normalizeDossier", () => {
  it("fills every field of an empty or junk blob", () => {
    expect(normalizeDossier(null)).toEqual(createEmptyDossier());
    expect(normalizeDossier({ identity: { name: 4 } }).identity.name).toBe("");
  });
  it("drops malformed relationships and coerces unknown types to custom", () => {
    const d = normalizeDossier({
      relationships: [{ id: "a", targetId: "t", type: "nemesis" }, { nope: true }],
    });
    expect(d.relationships).toHaveLength(1);
    expect(d.relationships[0].type).toBe("custom");
  });
});

describe("relationships", () => {
  const rel = (over: Partial<DossierRelationship>): DossierRelationship => ({
    id: "r", type: "ally", customLabel: "", targetKind: "dossier", targetId: "t1",
    targetName: "Ilse", note: "", connectionId: null, ...over,
  });

  it("labels custom edges by their own text", () => {
    expect(relationshipLabel(rel({ type: "custom", customLabel: "Oath-sibling" }))).toBe("Oath-sibling");
    expect(relationshipLabel(rel({ type: "custom" }))).toBe("Custom");
    expect(relationshipLabel(rel({ type: "mentor" }))).toBe("Mentor");
  });

  it("plans creates, updates and removals against the saved list", () => {
    const saved = [
      rel({ id: "a", connectionId: "c-a" }),
      rel({ id: "b", connectionId: "c-b", targetId: "t2" }),
      rel({ id: "c", connectionId: "c-c", targetId: "t3" }),
    ];
    const current = [
      rel({ id: "a", connectionId: "c-a", note: "since the war" }), // update
      rel({ id: "b", connectionId: "c-b", targetId: "t9" }), // retarget → create (+ remove c-b)
      rel({ id: "d", targetId: "t4" }), // new
    ];
    const plan = planConnectionSync(current, saved);
    expect(plan.update.map((r) => r.id)).toEqual(["a"]);
    expect(plan.create.map((r) => r.id)).toEqual(["b", "d"]);
    expect(plan.remove.sort()).toEqual(["c-b", "c-c"]);
  });
});

describe("exports", () => {
  it("builds a dramatis personae list from named dossiers only", () => {
    const md = buildDramatisPersonae([
      { title: "Kael", data: { identity: { name: "Kael", aliases: "the Ash", role: "Protagonist" }, resolved: { species: "Verrid", homeworld: "Kellis" }, origins: { house: "House Adran" } } },
      { title: null, data: {} },
    ]);
    expect(md).toContain("## Dramatis Personae");
    expect(md).toContain("**Kael** (the Ash) — Protagonist. Verrid of Kellis House Adran.");
    expect(md.split("\n").filter((l) => l.startsWith("- "))).toHaveLength(1);
    expect(buildDramatisPersonae([])).toBe("");
  });

  it("writes the dossier as markdown, marking overrides", () => {
    const state = createEmptyDossier();
    state.identity.name = "Kael";
    state.voice.sampleLines = "Listen.\nNo, listen.";
    const md = buildDossierMarkdown(state, resolveTraits(sheets, { lifespan: "Short" }));
    expect(md.startsWith("# Kael")).toBe(true);
    expect(md).toContain("**Lifespan:** Short *(override)*");
    expect(md).toContain("> No, listen.");
  });
});
