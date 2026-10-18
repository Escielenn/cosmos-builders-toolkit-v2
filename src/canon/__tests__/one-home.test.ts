// 1.5 item 10: one home for each duplicated value.
import { describe, it, expect } from "vitest";
import { MANIFESTS, manifestById } from "@/canon/manifests";
import { validateManifest } from "@/canon/manifest";
import { SINGLE_HOME, ownerOf, ownerToolOf, producersByPredicate, sourceBrand, sourceHref } from "@/canon/ownership";
import {
  normalisePropulsionType,
  normaliseSpectralClass,
  propulsionCodec,
  spectralCodec,
  spectralLetter,
  scalarCodec,
  textCodec,
  valuesAgree,
} from "@/canon/codecs";
import {
  conflictsFrom,
  consumerState,
  emitSummary,
  isOwnPriorAssert,
  pickCanonField,
  planEmit,
} from "@/canon/field";
import { mergeCanonFacts } from "@/canon/merge";
import { checkContinuity, resolveCandidatesViaCanon } from "@/lib/continuity";
import { manifest as atlas } from "@/tools/atlas/manifest";
import { manifest as genesis } from "@/tools/genesis/manifest";
import { manifest as impulse } from "@/tools/impulse/manifest";
import { manifest as axiom } from "@/tools/axiom/manifest";
import { manifest as goldilocks } from "@/tools/goldilocks/manifest";
import { manifest as paradox } from "@/tools/paradox/manifest";
import type { CanonFact, CanonFactRow, ProjectedInput } from "@/canon/types";

// ── builders ───────────────────────────────────────────────────────────

function fact(p: Partial<CanonFact> & { predicate: string; valueText: string }): CanonFact {
  return {
    id: p.id ?? `${p.predicate}:${p.valueText}:${p.subjectId ?? ""}`,
    worldId: "w",
    subjectId: p.subjectId ?? null,
    label: p.label ?? p.predicate,
    value: p.value ?? null,
    unit: null,
    confidence: p.confidence ?? "projected",
    provenance: p.provenance ?? { kind: "worksheet", label: "x", href: null, ref: { tool: "planetary-profile" } },
    outranks: p.outranks ?? [],
    conflicted: false,
    ...p,
  } as CanonFact;
}

function row(p: Partial<CanonFactRow> & { predicate: string }): CanonFactRow {
  return {
    id: p.id ?? "r1",
    world_id: "w",
    subject_id: p.subject_id ?? null,
    predicate: p.predicate,
    value: p.value ?? { kind: "scalar", value: 1 },
    value_text: p.value_text ?? null,
    unit: null,
    confidence: p.confidence ?? "canon",
    source_kind: p.source_kind ?? "tool",
    source_ref: p.source_ref ?? {},
    asserted_by: null,
    created_at: "2026-10-18T00:00:00Z",
    updated_at: "2026-10-18T00:00:00Z",
    superseded_at: null,
  };
}

function projected(tool: string, factKey: string, insert: string, entityId: string | null = "p1"): ProjectedInput {
  return {
    ref: `${tool}:${factKey}:${insert}`,
    factKey,
    label: factKey,
    value: insert,
    insert,
    entityId,
    href: null,
    sourceKind: "worksheet",
    toolLabel: tool,
    sourceTitle: tool,
    tool,
  };
}

// ── ownership ──────────────────────────────────────────────────────────

describe("ownership map", () => {
  it("every wired manifest passes the validator", () => {
    for (const m of MANIFESTS) expect(validateManifest(m), m.id).toEqual([]);
  });

  it("has exactly one producer per predicate", () => {
    for (const [predicate, ids] of producersByPredicate()) expect(ids, predicate).toHaveLength(1);
  });

  it("gives each duplicated value one owner, and its consumers only consume it", () => {
    for (const home of SINGLE_HOME) {
      expect(ownerOf(home.predicate)?.id, home.predicate).toBe(home.owner);
      for (const id of home.consumers) {
        const m = manifestById(id);
        expect(m, id).toBeDefined();
        expect(m!.produces.some((p) => p.predicate === home.predicate), `${id} produces ${home.predicate}`).toBe(false);
        expect(m!.consumes.find((c) => c.predicate === home.predicate), `${id} consumes ${home.predicate}`).toMatchObject({
          onMissing: "link",
          producer: home.owner,
        });
      }
    }
  });

  it("covers the five review duplicates by their pipeline keys", () => {
    expect(ownerOf("starType")?.id).toBe("orrery");
    expect(ownerOf("mass")?.id).toBe("genesis");
    expect(ownerOf("radius")?.id).toBe("genesis");
    expect(ownerOf("propulsionType")?.id).toBe("impulse");
    expect(ownerOf("crewSize")?.id).toBe("vessel");
    expect(ownerOf("theOneBigLie")?.id).toBe("axiom");
    expect(ownerToolOf("planet.surface_gravity")).toBe("surface-gravity-calculator");
  });

  it("names and links a fact's source", () => {
    const f = fact({ predicate: "planet.mass", valueText: "1", provenance: { kind: "tool", label: "Tool", href: null, ref: { tool: "genesis", worksheetId: "ws1" } } });
    expect(sourceBrand(f)).toBe("GENESIS");
    expect(sourceHref(f, "w")).toBe("/tools/planetary-profile?worldId=w&worksheetId=ws1");
    expect(sourceBrand(fact({ predicate: "x", valueText: "1", provenance: { kind: "entity", label: "Codex", href: "/c", ref: { tool: "codex" } } }))).toBe("CODEX");
  });
});

// ── codecs ─────────────────────────────────────────────────────────────

describe("codecs", () => {
  it("reads every star tool's spelling as 08's spectral enum", () => {
    expect(normaliseSpectralClass("g-type")).toBe("g");
    expect(normaliseSpectralClass("G")).toBe("g");
    expect(normaliseSpectralClass("k-dwarf")).toBe("k");
    expect(normaliseSpectralClass("M-Dwarf")).toBe("m");
    expect(normaliseSpectralClass("G2V")).toBe("g2v");
    expect(normaliseSpectralClass("white-dwarf")).toBe("wd");
    expect(normaliseSpectralClass("binary")).toBeNull();
    expect(valuesAgree(spectralCodec.read("g-type"), spectralCodec.read("G"))).toBe(true);
    expect(spectralLetter({ kind: "enum", value: "g2v" })).toBe("g");
  });

  it("reads every propulsion spelling as Impulse's slug, and keeps custom drives in the writer's words", () => {
    expect(normalisePropulsionType("light-sail")).toBe("solar-sail");
    expect(normalisePropulsionType("Fusion drive")).toBe("fusion");
    expect(normalisePropulsionType("Light Sail (Laser-Pushed)")).toBe("solar-sail");
    expect(normalisePropulsionType("Epstein drive")).toBe("Epstein drive");
    expect(normalisePropulsionType("custom")).toBeNull();
    expect(propulsionCodec.text({ kind: "text", value: "fusion" })).toBe("Fusion drive");
  });

  it("compares numbers numerically and words without case", () => {
    expect(valuesAgree(scalarCodec("earth_masses").read("1.20 Earth masses"), { kind: "scalar", value: 1.2 })).toBe(true);
    expect(valuesAgree(scalarCodec().read("50 crew, 200 passengers"), { kind: "scalar", value: 50 })).toBe(true);
    expect(valuesAgree({ kind: "scalar", value: 1.2 }, { kind: "scalar", value: 1.3 })).toBe(false);
    expect(valuesAgree(textCodec.read("<p>FTL  is real</p>"), { kind: "text", value: "ftl is real" })).toBe(true);
    expect(valuesAgree(null, { kind: "text", value: "x" })).toBe(false);
  });
});

// ── consumer prefill ───────────────────────────────────────────────────

describe("pickCanonField", () => {
  const atlasSelf = { id: atlas.id, tool: atlas.tool };

  it("prefers this subject, then a world-level fact, then a value every subject agrees on", () => {
    const facts = [
      fact({ predicate: "planet.mass", valueText: "2", subjectId: "p2" }),
      fact({ predicate: "planet.mass", valueText: "1.2", subjectId: "p1" }),
    ];
    expect(pickCanonField(facts, "planet.mass", "p1").fact?.valueText).toBe("1.2");
    expect(pickCanonField(facts, "planet.mass", "p1").scope).toBe("subject");
    const ambiguous = pickCanonField(facts, "planet.mass", "p3");
    expect(ambiguous.ambiguous).toBe(true);
    expect(ambiguous.fact).toBeNull();

    const star = [fact({ predicate: "star.spectral_class", valueText: "g-type", subjectId: "sys" })];
    const p = pickCanonField(star, "star.spectral_class", "planet");
    expect(p.scope).toBe("unique");
    expect(p.value).toEqual({ kind: "enum", value: "g" });

    const world = [fact({ predicate: "world.axiom", valueText: "FTL exists." })];
    expect(pickCanonField(world, "world.axiom", "anything").scope).toBe("world");
  });

  it("never reads a consumer's own copy back as the owner's value", () => {
    const own = fact({
      predicate: "planet.mass",
      valueText: "3",
      subjectId: "p1",
      provenance: { kind: "worksheet", label: "Atlas", href: null, ref: { tool: "surface-gravity-calculator" } },
    });
    expect(pickCanonField([own], "planet.mass", "p1", atlasSelf).fact).toBeNull();
    const genesisFact = fact({ predicate: "planet.mass", valueText: "1.2", subjectId: "p1" });
    const winner = { ...own, outranks: [genesisFact] };
    expect(pickCanonField([winner], "planet.mass", "p1", atlasSelf).fact?.valueText).toBe("1.2");
  });

  it("resolves aliases to the predicate", () => {
    expect(pickCanonField([fact({ predicate: "planet.mass", valueText: "1" })], "mass", null).fact).not.toBeNull();
  });
});

describe("consumerState", () => {
  const pick = (valueText: string) => pickCanonField([fact({ predicate: "planet.mass", valueText, subjectId: "p1" })], "planet.mass", "p1");
  const mass = (n: number) => ({ kind: "scalar" as const, value: n });

  it("prefills an empty field or a field still at its default", () => {
    expect(consumerState(null, pick("1.2"))).toBe("prefill");
    expect(consumerState(mass(1), pick("1.2"), true)).toBe("prefill");
  });
  it("never replaces a value the writer set: it reports divergence", () => {
    expect(consumerState(mass(1), pick("1.2"))).toBe("diverged");
  });
  it("is in sync when the field agrees with canon", () => {
    expect(consumerState(mass(1.2), pick("1.2"), true)).toBe("in-sync");
  });
  it("reports missing and ambiguous", () => {
    expect(consumerState(mass(1), pickCanonField([], "planet.mass", "p1"))).toBe("missing");
    const amb = pickCanonField(
      [fact({ predicate: "planet.mass", valueText: "1", subjectId: "a" }), fact({ predicate: "planet.mass", valueText: "2", subjectId: "b" })],
      "planet.mass",
      "c",
    );
    expect(consumerState(null, amb)).toBe("ambiguous");
  });
});

// ── producer emit and conflicts ────────────────────────────────────────

describe("planEmit", () => {
  it("asserts the owner's field produces through the predicate codec", () => {
    const data = { physicalCharacteristics: { planetaryMass: "1.2 Earth masses", planetaryRadius: "", dayLength: "30", axialTilt: "23" } };
    const { asserts } = planEmit(genesis, data);
    expect(asserts.map((a) => a.predicate)).toEqual(["planet.mass", "planet.rotation_period", "planet.obliquity"]);
    expect(asserts[0].value).toEqual({ kind: "scalar", value: 1.2, unit: "earth_masses" });
  });

  it("asserts Atlas's derived gravity from the sheet's inputs", () => {
    const { asserts, withheld } = planEmit(atlas, {}, { inputs: { "planet.mass": 5.6, "planet.radius": 2 } });
    expect(withheld).toEqual([]);
    const g = asserts.find((a) => a.predicate === "planet.surface_gravity")!;
    expect(g.value.kind === "scalar" && g.value.value).toBeCloseTo(1.4, 6);
    expect(g.inputs).toEqual({ "planet.mass": 5.6, "planet.radius": 2 });
    expect(asserts.map((a) => a.predicate)).toEqual(["planet.surface_gravity", "planet.escape_velocity", "planet.density"]);
  });

  it("withholds derived values whose inputs disagree with canon", () => {
    const { asserts, withheld } = planEmit(atlas, {}, {
      inputs: { "planet.mass": 1, "planet.radius": 1 },
      canonInputs: { "planet.mass": { kind: "scalar", value: 1.2 } },
    });
    expect(asserts).toEqual([]);
    expect(withheld).toHaveLength(3);
    expect(withheld[0].reason).toBe("SURFACE GRAVITY WITHHELD. MASS ON THIS SHEET DIFFERS FROM CANON.");
  });

  it("takes tool overrides (Impulse's custom drive) and skips empty values", () => {
    expect(planEmit(impulse, { system: { type: "fusion" } }).asserts[0].value).toEqual({ kind: "text", value: "fusion" });
    expect(planEmit(impulse, { system: { type: "other" } }).asserts).toEqual([]);
    expect(
      planEmit(impulse, { system: { type: "other" } }, { overrides: { "propulsion.type": { kind: "text", value: "Epstein drive" } } })
        .asserts[0].valueText,
    ).toBe("Epstein drive");
  });

  it("stores the axiom as plain text and the habitable zone from luminosity", () => {
    expect(planEmit(axiom, { coreStatement: { statement: "<p>FTL exists.</p>" } }).asserts[0].value).toEqual({ kind: "text", value: "FTL exists." });
    const hz = planEmit(goldilocks, {}, { inputs: { "star.luminosity": 1 } }).asserts;
    expect(hz.map((a) => a.predicate)).toEqual(["system.hz_inner", "system.hz_outer"]);
    expect(hz[0].value.kind === "scalar" && hz[0].value.value).toBeCloseTo(0.9505, 3);
    expect(planEmit(paradox, {}, { inputs: { "propulsion.cruise_fraction_c": 2 } }).asserts).toEqual([]);
  });
});

describe("conflict prompt", () => {
  const planned = { predicate: "planet.surface_gravity", value: { kind: "scalar" as const, value: 1.1, unit: "g" }, valueText: "1.1", unit: "g" };

  it("lists only conflicting asserts, canon value against the sheet's", () => {
    const existing = row({ id: "c1", predicate: "planet.surface_gravity", value: { kind: "scalar", value: 1.4, unit: "g" }, value_text: "1.4 g" });
    const conflicts = conflictsFrom([
      { planned, result: { status: "conflict", existing } },
      { planned: { ...planned, predicate: "planet.density" }, result: { status: "created", fact: existing } },
    ]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({ existingId: "c1", canonText: "1.4 g", sheetText: "1.1", label: "Surface gravity" });
    expect(
      emitSummary(
        [
          { planned, result: { status: "conflict", existing } },
          { planned, result: { status: "created", fact: existing } },
        ],
        [],
      ),
    ).toBe("1 FACT ENTERED IN CANON. 1 CONFLICT WITH CANON. REVIEW REQUIRED.");
  });

  it("treats this sheet's own earlier assert as a revision, everything else as a conflict", () => {
    const mine = row({ predicate: "x", source_ref: { tool: "atlas", worksheetId: "ws1" } });
    expect(isOwnPriorAssert(mine, "atlas", "ws1")).toBe(true);
    expect(isOwnPriorAssert(mine, "atlas", "ws2")).toBe(false);
    expect(isOwnPriorAssert({ ...mine, source_kind: "prose" }, "atlas", "ws1")).toBe(false);
    expect(isOwnPriorAssert(mine, "genesis", "ws1")).toBe(false);
  });
});

// ── merge: the owner's projection ranks first ──────────────────────────

describe("merge owner preference", () => {
  it("ranks the owner's projection above a consumer's copy for the same slot", () => {
    const projections = [projected("surface-gravity-calculator", "mass", "3"), projected("planetary-profile", "mass", "1.2")];
    const [m] = mergeCanonFacts("w", [], projections, { preferTool: ownerToolOf });
    expect(m.valueText).toBe("1.2");
    expect(m.conflicted).toBe(true);
    // Without the owner rule, pipeline order decides.
    expect(mergeCanonFacts("w", [], projections)[0].valueText).toBe("3");
  });

  it("still lets stored canon outrank every projection", () => {
    const stored = row({ predicate: "planet.mass", subject_id: "p1", value: { kind: "scalar", value: 2 }, value_text: "2" });
    const [m] = mergeCanonFacts("w", [stored], [projected("planetary-profile", "mass", "1.2")], { preferTool: ownerToolOf });
    expect(m.confidence).toBe("canon");
  });
});

// ── continuity: one value per subject ──────────────────────────────────

describe("continuity through canon", () => {
  const pooled = [
    { key: "mass", label: "Mass (Earth masses)", value: "3", subject_id: "p1" },
    { key: "mass", label: "Mass (Earth masses)", value: "1.2", subject_id: "p1" },
  ];
  const canonFacts = [fact({ predicate: "planet.mass", valueText: "1.2 Earth masses", subjectId: "p1" })];

  it("replaces the copies of an owned predicate with canon's single value", () => {
    expect(resolveCandidatesViaCanon(["mass"], pooled, canonFacts)).toEqual([
      { key: "mass", label: "Mass (Earth masses)", value: "1.2 Earth masses", subject_id: "p1" },
    ]);
  });

  it("leaves unowned keys and empty canon on the pooled path", () => {
    expect(resolveCandidatesViaCanon(["population"], [], canonFacts)).toBeNull();
    expect(resolveCandidatesViaCanon(["mass"], pooled, [])).toBeNull();
    expect(resolveCandidatesViaCanon(["mass"], pooled, undefined)).toBeNull();
  });

  it("checks prose against the owner's value, not a consumer's stale copy", () => {
    const prose = "<p>A world of 3 earth-masses.</p>";
    // Pooled: one candidate agrees (3), so nothing fires.
    expect(checkContinuity(prose, pooled, "p1")).toEqual([]);
    // Through canon: the one value is 1.2, so the claim of 3 is a contradiction.
    const notes = checkContinuity(prose, pooled, "p1", canonFacts);
    expect(notes).toHaveLength(1);
    expect(notes[0].worldValue).toBe("1.2 Earth masses");
  });
});
