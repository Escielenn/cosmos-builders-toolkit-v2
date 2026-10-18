import { describe, expect, it } from "vitest";
import { planWorkshopMigration, toStudioHtml, type LegacyEntry } from "@/lib/workshop-migration";

// Mirrors the seed used to exercise supabase/migrations/20261019_workshop_into_studio.sql
// (run twice in PGlite; same outputs as asserted here).
const U1 = "user-1";
const MINE = "world-mine";
const OTHERS = "world-others";

const worlds = [
  { id: MINE, user_id: U1, archived_at: null },
  { id: OTHERS, user_id: "user-2", archived_at: null },
  { id: "world-archived", user_id: U1, archived_at: "2026-05-01" },
];

function entry(p: Partial<LegacyEntry> & { id: string }): LegacyEntry {
  return {
    user_id: U1,
    world_id: null,
    prompt_id: null,
    title: "T",
    content: "<p>x</p>",
    tags: [],
    archived_at: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...p,
  };
}

const entries: LegacyEntry[] = [
  entry({ id: "e1", world_id: MINE, prompt_id: "p1", title: "In world", content: "<p>hi</p>", created_at: "2026-03-02T00:00:00Z", updated_at: "2026-03-05T00:00:00Z" }),
  entry({ id: "e2", world_id: MINE, title: "  ", content: "<p>older</p>", created_at: "2026-03-01T00:00:00Z" }),
  entry({ id: "e3", title: "Loose", content: "a & <b>\n\n\nsecond\r\nline" }),
  entry({ id: "e4", world_id: OTHERS, title: "Not my world", created_at: "2026-04-03T00:00:00Z" }),
  entry({ id: "e5", world_id: "world-archived", title: "Archived world", created_at: "2026-04-04T00:00:00Z" }),
  entry({ id: "e6", world_id: "world-gone", title: "Deleted world", created_at: "2026-04-05T00:00:00Z" }),
  entry({ id: "e7", user_id: "user-3", title: "Archived", archived_at: "2026-05-01" }),
];

describe("planWorkshopMigration", () => {
  const plan = planWorkshopMigration(entries, worlds);
  const byId = new Map(plan.documents.map((d) => [d.entryId, d]));

  it("skips archived entries (they stay in the archive)", () => {
    expect(byId.has("e7")).toBe(false);
    expect(plan.skippedArchived).toBe(1);
    expect(plan.documents).toHaveLength(6);
  });

  it("keeps an entry in its own live world", () => {
    expect(byId.get("e1")!.target).toEqual({ kind: "world", worldId: MINE });
  });

  it("routes world-less, foreign, archived-world and missing-world entries to the Workshop world", () => {
    for (const id of ["e3", "e4", "e5", "e6"]) {
      expect(byId.get(id)!.target).toEqual({ kind: "workshop", userId: U1 });
    }
    expect(plan.workshopWorldUsers).toEqual([U1]);
  });

  it("preserves dates, falls back on blank titles, records provenance", () => {
    const e1 = byId.get("e1")!;
    expect(e1.created_at).toBe("2026-03-02T00:00:00Z");
    expect(e1.updated_at).toBe("2026-03-05T00:00:00Z");
    expect(e1.metadata.workshop).toEqual({ entryId: "e1", promptId: "p1", migratedFrom: "writing_entries" });
    expect(byId.get("e2")!.title).toBe("Untitled entry");
  });

  it("orders oldest first per target folder, in steps of 10 from 0", () => {
    expect(byId.get("e2")!.sort_order).toBe(0);
    expect(byId.get("e1")!.sort_order).toBe(10);
    expect(["e3", "e4", "e5", "e6"].map((id) => byId.get(id)!.sort_order)).toEqual([0, 10, 20, 30]);
  });

  it("appends after existing folder children", () => {
    const p = planWorkshopMigration(entries, worlds, { folderMaxSort: new Map([[`w:${MINE}`, 40]]) });
    expect(p.documents.find((d) => d.entryId === "e2")!.sort_order).toBe(50);
  });

  it("is idempotent: already-copied entries are skipped", () => {
    const again = planWorkshopMigration(entries, worlds, {
      alreadyCopied: new Set(plan.documents.map((d) => d.entryId)),
    });
    expect(again.documents).toHaveLength(0);
    expect(again.skippedAlreadyCopied).toBe(6);
    expect(again.workshopWorldUsers).toEqual([]);
  });

  it("never alters HTML content", () => {
    expect(byId.get("e1")!.content).toBe("<p>hi</p>");
  });
});

describe("toStudioHtml", () => {
  it("escapes and paragraphs plain text exactly as the SQL does", () => {
    expect(toStudioHtml("a & <b>\n\n\nsecond\r\nline")).toBe("<p>a &amp; &lt;b&gt;</p><p>second<br>line</p>");
  });
  it("passes HTML through and keeps empty empty", () => {
    expect(toStudioHtml("  <p>x</p>")).toBe("  <p>x</p>");
    expect(toStudioHtml("   ")).toBe("");
    expect(toStudioHtml(null)).toBe("");
  });
});
