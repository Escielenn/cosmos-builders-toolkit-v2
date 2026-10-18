import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCanonChanges } from "@/hooks/use-canon-changes";
import { factRefId, factRefToHtml, type FactRefAttrs } from "@/lib/writing/fact-ref";

const G: FactRefAttrs = {
  factKey: "surfaceGravity",
  value: "1.4 g",
  tool: "planetary-profile",
  worksheetId: "ws-1",
  sourceKind: "worksheet",
  entityId: "planet-1",
  label: "Surface Gravity (g)",
};

const doc = (id: string, parent: string | null, content: string, type = "document") => ({
  id,
  parent_id: parent,
  entry_type: type,
  sort_order: 0,
  title: id,
  content,
});

const ENTRIES = [
  doc("f", null, "", "folder"),
  doc("a", "f", `<p>${factRefToHtml(G)}</p>`),
  doc("b", "f", "<p>Plain.</p>"),
  doc("c", null, `<p><entity-mention data-id="e1" data-label="Old">Old</entity-mention></p>`),
];

const WORLD = {
  loading: false,
  factsByRef: new Map([[factRefId(G), { insert: "1.6 g" }]]),
  entities: [{ id: "e1", name: "New" }],
};

describe("useCanonChanges", () => {
  it("finds affected documents and rolls counts into folders", () => {
    const { result } = renderHook(() => useCanonChanges(ENTRIES, WORLD));
    expect([...result.current.affected].sort()).toEqual(["a", "c"]);
    expect(result.current.counts.get("f")).toEqual({ facts: 1, names: 0 });
    expect(result.current.counts.get("c")).toEqual({ facts: 0, names: 1 });
    expect(result.current.counts.has("b")).toBe(false);
  });

  it("reports nothing while the world is loading or absent", () => {
    const loading = renderHook(() => useCanonChanges(ENTRIES, { ...WORLD, loading: true }));
    expect(loading.result.current.affected.size).toBe(0);
    const none = renderHook(() => useCanonChanges(ENTRIES, null));
    expect(none.result.current.affected.size).toBe(0);
  });

  it("reuses a document's result while its content and the index are unchanged", () => {
    const { result, rerender } = renderHook(({ entries }) => useCanonChanges(entries, WORLD), {
      initialProps: { entries: ENTRIES },
    });
    const before = result.current.byDoc.get("a");
    // A new array (another document edited), same content for "a".
    rerender({ entries: ENTRIES.map((e) => (e.id === "b" ? { ...e, content: "<p>Edited.</p>" } : e)) });
    expect(result.current.byDoc.get("a")).toBe(before);
  });
});
