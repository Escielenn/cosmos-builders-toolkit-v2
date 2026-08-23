import { describe, it, expect } from "vitest";
import type { HandoffPayload } from "../handoff";
import {
  solarisPlanetPublishFacts,
  formatPublishedFact,
  publishedFactsSummary,
  buildPublishedMetadata,
  readPublishedFacts,
  readPublishedFact,
  readTidelockSeed,
  reconstructSolarisHandoff,
} from "../published-facts";
import type { WorldEntry } from "@/services/world-data";

const payload: HandoffPayload = {
  from: "solaris",
  starType: "orange",
  starMassLum: 0.42,
  planetAU: 0.55,
  planetName: "Kepler-442b",
  planetType: "waterworld",
  systemName: "Kepler-442",
};

function entryWithFacts(facts: ReturnType<typeof solarisPlanetPublishFacts>): WorldEntry {
  return {
    id: "e1",
    world_id: "w1",
    entry_type: "planet",
    title: "Kepler-442b",
    content: null,
    // WorldEntry.metadata is Json at the DB boundary; buildPublishedMetadata
    // returns the wider Record<string, unknown> for the same reason (see its
    // own doc comment) — cast here exactly like a real fetched row would be.
    metadata: buildPublishedMetadata(facts, "solaris") as unknown as WorldEntry["metadata"],
    sort_order: 0,
    parent_id: null,
    icon: null,
    color: null,
    tool_source: null,
    tool_data_id: null,
    layer: null,
    cover_image_url: null,
    tags: [],
    created_by: "u1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("solarisPlanetPublishFacts", () => {
  const facts = solarisPlanetPublishFacts(payload);

  it("emits every real value from the handoff payload", () => {
    expect(facts.find((f) => f.predicate === "planet.name")?.value).toBe("Kepler-442b");
    expect(facts.find((f) => f.predicate === "planet.orbital_distance_au")?.value).toBe(0.55);
    expect(facts.find((f) => f.predicate === "star.spectral_class")?.value).toBe("orange");
    expect(facts.find((f) => f.predicate === "star.luminosity_lsun")?.value).toBe(0.42);
    expect(facts.find((f) => f.predicate === "system.name")?.value).toBe("Kepler-442");
  });

  it("stores the raw planet type key, not the humanized label", () => {
    expect(facts.find((f) => f.predicate === "planet.type")?.value).toBe("waterworld");
  });

  it("omits system.name when the payload doesn't carry one", () => {
    const noSystem = solarisPlanetPublishFacts({ ...payload, systemName: undefined });
    expect(noSystem.find((f) => f.predicate === "system.name")).toBeUndefined();
  });
});

describe("formatPublishedFact", () => {
  it("humanizes planet.type for display only", () => {
    const fact = solarisPlanetPublishFacts(payload).find((f) => f.predicate === "planet.type")!;
    expect(formatPublishedFact(fact)).toBe("water world");
  });

  it("appends the unit for a measured value", () => {
    const fact = solarisPlanetPublishFacts(payload).find((f) => f.predicate === "planet.orbital_distance_au")!;
    expect(formatPublishedFact(fact)).toBe("0.55 AU");
  });
});

describe("publishedFactsSummary", () => {
  it("joins every fact into one readable line", () => {
    const summary = publishedFactsSummary(solarisPlanetPublishFacts(payload));
    expect(summary).toContain("Kepler-442b");
    expect(summary).toContain("0.55 AU");
    expect(summary.startsWith("<p>")).toBe(true);
  });
});

describe("read round-trip", () => {
  const facts = solarisPlanetPublishFacts(payload);
  const entry = entryWithFacts(facts);

  it("reads every fact back", () => {
    expect(readPublishedFacts(entry)).toHaveLength(facts.length);
  });

  it("reads one fact by predicate", () => {
    expect(readPublishedFact(entry, "star.spectral_class")?.value).toBe("orange");
  });

  it("returns [] for an entry with no published facts", () => {
    expect(readPublishedFacts({ ...entry, metadata: {} })).toEqual([]);
  });

  it("returns [] for null/undefined", () => {
    expect(readPublishedFacts(null)).toEqual([]);
    expect(readPublishedFacts(undefined)).toEqual([]);
  });
});

describe("readTidelockSeed", () => {
  it("computes auFraction from the star's habitable-zone midpoint", () => {
    const entry = entryWithFacts(solarisPlanetPublishFacts(payload));
    const seed = readTidelockSeed(entry);
    expect(seed).not.toBeNull();
    // orange HZ mid = (0.8+1.7)/2 = 1.25; 0.55/1.25 = 0.44
    expect(seed!.auFraction).toBeCloseTo(0.44, 5);
    expect(seed!.starLuminosity).toBe(0.42);
  });

  it("returns null when a required predicate is missing", () => {
    const partial = solarisPlanetPublishFacts(payload).filter((f) => f.predicate !== "star.luminosity_lsun");
    expect(readTidelockSeed(entryWithFacts(partial))).toBeNull();
  });

  it("returns null for an entry that was never published through this module", () => {
    expect(readTidelockSeed(entryWithFacts([]))).toBeNull();
  });
});

describe("reconstructSolarisHandoff", () => {
  it("rebuilds an equivalent HandoffPayload from published facts", () => {
    const entry = entryWithFacts(solarisPlanetPublishFacts(payload));
    const rebuilt = reconstructSolarisHandoff(entry);
    expect(rebuilt).toEqual({
      from: "solaris",
      starType: "orange",
      starMassLum: 0.42,
      planetAU: 0.55,
      planetName: "Kepler-442b",
      planetType: "waterworld",
    });
  });

  it("returns null when the entry is missing a required predicate", () => {
    const partial = solarisPlanetPublishFacts(payload).filter((f) => f.predicate !== "planet.name");
    expect(reconstructSolarisHandoff(entryWithFacts(partial))).toBeNull();
  });

  it("returns null for a star type outside the known habitable-zone table", () => {
    const bad = solarisPlanetPublishFacts(payload).map((f) =>
      f.predicate === "star.spectral_class" ? { ...f, value: "purple" } : f,
    );
    expect(reconstructSolarisHandoff(entryWithFacts(bad))).toBeNull();
  });
});
