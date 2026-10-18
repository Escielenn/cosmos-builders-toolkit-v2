import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { Outliner } from "@/components/writing/Outliner";
import { buildBinderTree } from "@/lib/binder-tree";
import type { WorldEntry } from "@/services/world-data";

const row = (
  id: string,
  type: "folder" | "document",
  parent: string | null,
  sort: number,
  extra: Partial<WorldEntry> = {},
): WorldEntry => ({
  id,
  world_id: "w1",
  entry_type: type,
  title: id,
  content: type === "document" ? "<p>one two three</p>" : "",
  metadata: {},
  sort_order: sort,
  parent_id: parent,
  icon: null,
  color: null,
  tool_source: null,
  tool_data_id: null,
  layer: null,
  cover_image_url: null,
  tags: [],
  created_by: "u1",
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  ...extra,
});

const entries = [
  row("Chapter 1", "folder", null, 0),
  row("Scene A", "document", "Chapter 1", 0, {
    metadata: { status: "draft", synopsis: "Ix lands.", target: 6 },
  }),
  row("Scene B", "document", "Chapter 1", 10),
  row("Prologue", "document", null, 10),
];

function mount() {
  const props = {
    worldId: `w-${Math.random()}`,
    tree: buildBinderTree(entries),
    labels: [],
    activeDocId: "Scene B",
    onOpen: vi.fn(),
    onChangeMeta: vi.fn(),
  };
  render(<Outliner {...props} />);
  return props;
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
});

describe("Outliner", () => {
  it("lists folders and documents in reading order with a totals row", () => {
    mount();
    const rows = screen.getAllByRole("row");
    // header + 4 rows + totals
    expect(rows).toHaveLength(6);
    expect(within(rows[1]).getByText(/Chapter 1/)).toBeInTheDocument();
    expect(within(rows[2]).getByText("Scene A")).toBeInTheDocument();
    expect(within(rows[5]).getByText(/Total · 3 documents/)).toBeInTheDocument();
    expect(within(rows[5]).getByText("9")).toBeInTheDocument();
  });

  it("opens a document on click and with Enter; arrows move between rows", () => {
    const props = mount();
    fireEvent.click(screen.getByText("Prologue"));
    expect(props.onOpen).toHaveBeenCalledWith("Prologue");
    const sceneB = screen.getByText("Scene B").closest("tr")!;
    sceneB.focus();
    fireEvent.keyDown(sceneB, { key: "ArrowDown" });
    const prologue = screen.getByText("Prologue").closest("tr")!;
    expect(document.activeElement).toBe(prologue);
    fireEvent.keyDown(prologue, { key: "Enter" });
    expect(props.onOpen).toHaveBeenLastCalledWith("Prologue");
  });

  it("collapses a folder from the keyboard but keeps its totals", () => {
    mount();
    const folder = screen.getByText(/Chapter 1/).closest("tr")!;
    folder.focus();
    fireEvent.keyDown(folder, { key: "ArrowLeft" });
    expect(screen.queryByText("Scene A")).toBeNull();
    // Words (6) and target (6) of the hidden scenes still sum on the folder.
    expect(within(folder).getAllByText("6")).toHaveLength(2);
  });

  it("edits a synopsis in place through the metadata queue", () => {
    const props = mount();
    fireEvent.click(screen.getByRole("button", { name: "Edit synopsis for Scene A" }));
    const box = screen.getByRole("textbox", { name: "Synopsis for Scene A" });
    fireEvent.change(box, { target: { value: "Ix lands hard." } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(props.onChangeMeta).toHaveBeenCalledWith("Scene A", { synopsis: "Ix lands hard." });
    expect(props.onOpen).not.toHaveBeenCalled();
  });
});
