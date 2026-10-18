import { describe, expect, it } from "vitest";
import { planFolderTrash } from "@/lib/folder-trash";

const row = (id: string, entry_type: "folder" | "document", parent_id: string | null, sort_order: number) => ({
  id,
  entry_type,
  parent_id,
  sort_order,
  title: id,
});

// root: A(folder,0) [a1, B(folder) [b1]], doc1(0, legacy collision), doc2(20), C(folder,30)
const entries = [
  row("A", "folder", null, 0),
  row("a1", "document", "A", 0),
  row("B", "folder", "A", 10),
  row("b1", "document", "B", 0),
  row("doc1", "document", null, 0),
  row("doc2", "document", null, 20),
  row("C", "folder", null, 30),
];

describe("planFolderTrash", () => {
  const plan = planFolderTrash(entries, "A")!;

  it("trashes everything inside, at any depth, remembering old parents", () => {
    expect([...plan.inside].sort((x, y) => (x.id < y.id ? -1 : 1))).toEqual([
      { id: "B", formerParentId: "A", isFolder: true },
      { id: "a1", formerParentId: "A", isFolder: false },
      { id: "b1", formerParentId: "B", isFolder: false },
    ]);
  });

  it("snapshots every document inside", () => {
    expect(plan.documentIds.sort()).toEqual(["a1", "b1"]);
  });

  it("renumbers the surviving siblings in on-screen order", () => {
    // doc1 shared sort_order 0 with folder A (legacy shape: folders first),
    // so the order on screen was A, C, doc1, doc2. Without A: C, doc1, doc2.
    expect(plan.siblingOrder).toEqual(["C", "doc1", "doc2"]);
  });

  it("nested folder: siblings are the folder's own level", () => {
    const p = planFolderTrash(entries, "B")!;
    expect(p.inside.map((r) => r.id)).toEqual(["b1"]);
    expect(p.siblingOrder).toEqual(["a1"]);
  });

  it("refuses a document id or a missing id", () => {
    expect(planFolderTrash(entries, "doc1")).toBeNull();
    expect(planFolderTrash(entries, "nope")).toBeNull();
  });

  it("an empty folder trashes only itself", () => {
    const p = planFolderTrash(entries, "C")!;
    expect(p.inside).toEqual([]);
    expect(p.documentIds).toEqual([]);
  });
});
