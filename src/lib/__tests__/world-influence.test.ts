import { describe, it, expect } from "vitest";
import { buildWorldInfluence, influenceHeading, MAX_INFLUENCE_ROWS } from "@/lib/writing/world-influence";
import { buildPlaceChoices, buildPovChoices, resolveSceneWorld } from "@/lib/writing/scene-world";
import { createEmptyDossier } from "@/lib/dossier/types";
import type { BodyFacts } from "@/lib/surface-cartographer/body";
import type { Entity } from "@/services/entity-graph-types";

const SRC = { kind: "worksheet" as const, label: "Genesis · Kellis", href: "/tools/planetary-profile?worksheetId=p" };

function body(p: Partial<BodyFacts>): BodyFacts {
  return {
    name: "Kellis",
    radiusEarth: null,
    surfaceGravityG: null,
    tiltDeg: null,
    dayLengthHours: null,
    tidallyLocked: null,
    meanTempC: null,
    oceanFraction: null,
    atmoPressureBar: null,
    atmoComposition: null,
    starClass: null,
    habitablePercent: null,
    ...p,
  };
}

function entity(p: Partial<Entity> & { id: string; name: string }): Entity {
  return {
    world_id: "w", user_id: "u", entity_type: "custom", custom_type_label: null, cascade_stage: "culture",
    color: null, icon: null, summary: null, image_url: null, description: null, notes: null,
    parent_entity_id: null, sort_order: 0, tags: [], graph_x: null, graph_y: null, pinned: false,
    metadata: {}, created_at: "", updated_at: "", ...p,
  };
}

describe("buildWorldInfluence", () => {
  it("narrates gravity as felt by the POV, using Dossier's own sentence", () => {
    const rows = buildWorldInfluence({
      body: body({ surfaceGravityG: { value: 1.4, source: SRC } }),
      place: null,
      pov: { name: "Kael", resolved: { gravityAdaptation: "1.0 g" }, source: "Dossier · Kael", href: null },
      epoch: null,
    });
    const g = rows.find((r) => r.key === "gravity")!;
    expect(g.value).toBe("1.4 g");
    expect(g.narrative).toBe("FELT AS 1.4× HOME. HEAVY. STAIRS ARE A HAZARD. FATIGUE BY MIDDAY.");
    expect(g.source).toBe("Genesis · Kellis");
    expect(rows.find((r) => r.key === "pov.gravity")?.narrative).toContain("GREW UP AT ROUGHLY EARTH WEIGHT");
  });

  it("falls back to Gravitas's movement table without a POV", () => {
    const rows = buildWorldInfluence({ body: body({ surfaceGravityG: { value: 1.4, source: SRC } }), place: null, pov: null, epoch: null });
    expect(rows[0].narrative).toBe("Walking: labored. Running: exhausting.");
  });

  it("reads the sky over the scene's place from the Surface Cartographer", () => {
    const rows = buildWorldInfluence({
      body: body({ tidallyLocked: { value: true, source: SRC } }),
      place: { name: "Vel Haran", at: { lat: 0, lon: 0 } },
      substellarLon: 0,
      pov: null,
      epoch: null,
    });
    const light = rows.find((r) => r.key === "daylight")!;
    expect(light.value).toBe("——");
    expect(light.narrative).toMatch(/^PERMANENT DAY\./);
  });

  it("invents no prose: rows without a tool narrative are value only", () => {
    const rows = buildWorldInfluence({
      body: body({ atmoPressureBar: { value: 0.6, source: SRC }, starClass: { value: "M4V", source: SRC } }),
      place: null,
      pov: null,
      epoch: { when: "2340", branchName: null },
    });
    expect(rows.map((r) => [r.label, r.value, r.narrative])).toEqual([
      ["ATMOSPHERE", "0.6 bar", null],
      ["STAR", "M4V", null],
      ["WHEN", "2340", null],
    ]);
  });

  it("is empty when the scene declares nothing, and never exceeds ten rows", () => {
    expect(buildWorldInfluence({ body: null, place: null, pov: null, epoch: null })).toEqual([]);
    const full = buildWorldInfluence({
      body: body({
        surfaceGravityG: { value: 1.4, source: SRC },
        dayLengthHours: { value: 30, source: SRC },
        tiltDeg: { value: 20, source: SRC },
        atmoPressureBar: { value: 1, source: SRC },
        meanTempC: { value: 4, source: SRC },
        starClass: { value: "K2V", source: SRC },
      }),
      place: { name: "Vel Haran", at: { lat: 40, lon: 10 } },
      pov: {
        name: "Kael",
        resolved: { gravityAdaptation: "0.8", blindTo: "red", dominantSense: "smell", ageStandard: "30", ageLocal: "60" },
        source: "Dossier · Kael",
        href: null,
      },
      epoch: { when: "2340", branchName: "The Long Night" },
    });
    expect(full.length).toBe(MAX_INFLUENCE_ROWS);
  });

  it("heads the block with epoch, branch and place", () => {
    expect(
      influenceHeading({ body: null, place: { name: "Kellis Band", at: null }, epoch: { when: "2340", branchName: null } }),
    ).toBe("// WORLD INFLUENCE · EPOCH 2340 · KELLIS BAND");
  });
});

describe("resolveSceneWorld", () => {
  const planet = entity({ id: "kellis", name: "Kellis", entity_type: "planet" });
  const place = entity({
    id: "vel",
    name: "Vel Haran",
    entity_type: "location",
    parent_entity_id: "kellis",
    metadata: { lat: 12, lon: 30, bodyEntityId: "kellis" },
  });
  const dossier = createEmptyDossier();
  dossier.identity.name = "Kael";
  dossier.origins.homeworld = { worksheetId: "profile", name: "Kellis" };
  dossier.resolved = { gravityAdaptation: "1.0 g" };
  const worksheets = [
    { id: "profile", tool_type: "planetary-profile", title: "Kellis", data: { physicalCharacteristics: { surfaceGravity: "1.4", dayLength: "30" } } },
    { id: "dos", tool_type: "dossier", title: "Kael", data: dossier },
  ];
  const subjects = { profile: "kellis", dos: "kael-entity" };

  it("follows SET IN to the body and its Genesis profile, and POV to the Dossier", () => {
    const sw = resolveSceneWorld({
      worldId: "w",
      meta: { povDossierId: "dos", setInPlaceId: "vel", subjectEntityId: "", when: "2340", branchId: "b" },
      entities: [planet, place],
      worksheets,
      simulations: [],
      subjects,
      branches: [{ id: "b", name: "The Long Night" }],
    });
    expect(sw.povEntityId).toBe("kael-entity");
    expect(sw.povOriginSheetIds).toEqual(["profile"]);
    expect(sw.bodyEntityId).toBe("kellis");
    expect(sw.influence.body?.surfaceGravityG?.value).toBe(1.4);
    expect(sw.influence.place).toEqual({ name: "Vel Haran", at: { lat: 12, lon: 30 } });
    expect(sw.influence.epoch).toEqual({ when: "2340", branchName: "The Long Night" });
    expect(sw.influence.pov?.name).toBe("Kael");
  });

  it("a free-text POV is not an identity", () => {
    const sw = resolveSceneWorld({
      worldId: "w",
      meta: { setInPlaceId: "", subjectEntityId: "", when: "" },
      entities: [],
      worksheets,
      simulations: [],
      subjects,
      branches: [],
    });
    expect(sw.povEntityId).toBeNull();
    expect(sw.influence.pov).toBeNull();
    expect(sw.influence.body).toBeNull();
    expect(sw.influence.epoch).toBeNull();
  });

  it("offers Dossiers and uncovered characters as POVs, placed places first", () => {
    const pov = buildPovChoices(worksheets, subjects, [
      entity({ id: "kael-entity", name: "Kael (entity)", entity_type: "character" }),
      entity({ id: "ix", name: "Ix", entity_type: "character" }),
    ]);
    expect(pov.map((p) => [p.name, p.sub, p.dossierId ?? null, p.entityId ?? null])).toEqual([
      ["Ix", "CODEX", null, "ix"],
      ["Kael", "DOSSIER", "dos", "kael-entity"],
    ]);
    const places = buildPlaceChoices([planet, entity({ id: "u", name: "Aardvark", entity_type: "location" }), place]);
    expect(places.map((p) => p.name)).toEqual(["Vel Haran", "Aardvark"]);
    expect(places[0].sub).toBe("Kellis · 12.0°N 30.0°E");
    expect(places[1].sub).toBe("UNPLACED");
  });
});
