import { describe, it, expect } from "vitest";
import {
  buildFactInfobox,
  entityAliases,
  parseAliases,
  entityEpochRange,
  formatEpochRange,
  type AttachedWorksheet,
} from "@/lib/codex-entity";

const ENTITY = "00000000-0000-4000-8000-000000000001";

const profile = (over: Partial<AttachedWorksheet> & { gravity: string; title?: string }): AttachedWorksheet => ({
  worksheetId: over.worksheetId ?? `ws-${over.gravity}`,
  worksheetTitle: over.title ?? `Profile ${over.gravity}`,
  toolType: "planetary-profile",
  isPrimary: over.isPrimary ?? false,
  updatedAt: over.updatedAt ?? null,
  data: { physicalCharacteristics: { surfaceGravity: over.gravity } },
});

describe("buildFactInfobox", () => {
  it("returns one row per fact, each carrying its producer", () => {
    const rows = buildFactInfobox([profile({ gravity: "1.47", isPrimary: true })], ENTITY);
    const g = rows.find((r) => r.key === "surfaceGravity");
    expect(g).toBeDefined();
    expect(g!.value).toBe("1.47");
    expect(g!.source).toEqual({ worksheetId: "ws-1.47", worksheetTitle: "Profile 1.47", toolType: "planetary-profile" });
    expect(g!.conflicts).toEqual([]);
  });

  it("the primary link wins a tie, and the other value is surfaced as a conflict, not hidden", () => {
    const rows = buildFactInfobox(
      [profile({ gravity: "0.9", updatedAt: "2026-09-01T00:00:00Z" }), profile({ gravity: "1.47", isPrimary: true, updatedAt: "2026-01-01T00:00:00Z" })],
      ENTITY,
    );
    const g = rows.find((r) => r.key === "surfaceGravity")!;
    expect(g.value).toBe("1.47");
    expect(g.conflicts).toHaveLength(1);
    expect(g.conflicts[0]).toMatchObject({ value: "0.9", source: { worksheetId: "ws-0.9" } });
  });

  it("with no primary, the most recently updated worksheet wins", () => {
    const rows = buildFactInfobox(
      [profile({ gravity: "0.9", updatedAt: "2026-01-01T00:00:00Z" }), profile({ gravity: "1.1", updatedAt: "2026-08-01T00:00:00Z" })],
      ENTITY,
    );
    expect(rows.find((r) => r.key === "surfaceGravity")!.value).toBe("1.1");
  });

  it("identical values from two instruments collapse to one row with no conflict", () => {
    const rows = buildFactInfobox([profile({ gravity: "1.0", worksheetId: "a" }), profile({ gravity: "1.0", worksheetId: "b" })], ENTITY);
    const g = rows.find((r) => r.key === "surfaceGravity")!;
    expect(g.conflicts).toEqual([]);
  });

  it("a malformed blob or an unmapped tool contributes nothing and throws nothing", () => {
    const rows = buildFactInfobox(
      [
        { worksheetId: "x", worksheetTitle: null, toolType: "not-a-tool", isPrimary: false, data: { a: 1 } },
        { worksheetId: "y", worksheetTitle: null, toolType: "planetary-profile", isPrimary: false, data: "garbage" },
        profile({ gravity: "1.2" }),
      ],
      ENTITY,
    );
    expect(rows.map((r) => r.key)).toEqual(["surfaceGravity"]);
  });

  it("returns [] for an entity with nothing attached", () => {
    expect(buildFactInfobox([], ENTITY)).toEqual([]);
  });
});

describe("aliases and epoch range", () => {
  it("reads aliases from metadata, trimming, deduping and ignoring junk", () => {
    expect(entityAliases({ aliases: [" Kellis ", "Kellis", 3, "", "The Drowned"] })).toEqual(["Kellis", "The Drowned"]);
    expect(entityAliases(null)).toEqual([]);
    expect(entityAliases({ aliases: "not-a-list" })).toEqual([]);
  });

  it("parses the header's alias field on commas and newlines", () => {
    expect(parseAliases("Kellis, The Drowned\nHomeworld")).toEqual(["Kellis", "The Drowned", "Homeworld"]);
  });

  it("formats an epoch range in ship's voice", () => {
    expect(formatEpochRange(entityEpochRange({}))).toBeNull();
    expect(formatEpochRange(entityEpochRange({ epoch_from: "412 AE" }))).toBe("FROM 412 AE");
    expect(formatEpochRange(entityEpochRange({ epoch_to: "1201 AE" }))).toBe("UNTIL 1201 AE");
    expect(formatEpochRange(entityEpochRange({ epoch_from: "412 AE", epoch_to: "1201 AE" }))).toBe("412 AE — 1201 AE");
  });
});
