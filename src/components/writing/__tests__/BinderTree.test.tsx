import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { BinderTree } from "@/components/writing/BinderTree";
import { buildBinderTree } from "@/lib/binder-tree";
import { rollUpCanonCounts } from "@/lib/writing/canon-changes";
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
  row("Part One", "folder", null, 0),
  row("Chapter 1", "folder", "Part One", 0),
  row("Scene A", "document", "Chapter 1", 0, {
    metadata: { status: "draft", labelId: "l1" },
  }),
  row("Scene B", "document", "Chapter 1", 10),
  row("Prologue", "document", null, 10),
];

function mount(overrides: Partial<Parameters<typeof BinderTree>[0]> = {}) {
  const props = {
    worldId: `w-${Math.random()}`,
    tree: buildBinderTree(entries),
    entries,
    activeDocId: "Scene B",
    labels: [{ id: "l1", name: "Flashback", hue: "violet" as const }],
    onOpen: vi.fn(),
    onMove: vi.fn(),
    onTrash: vi.fn(),
    onCreateDoc: vi.fn(),
    onCreateFolder: vi.fn(),
    onRename: vi.fn(),
    onDeleteFolder: vi.fn(),
    ...overrides,
  };
  render(<BinderTree {...props} />);
  return props;
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
});

describe("BinderTree", () => {
  it("renders nested folders with their levels", () => {
    mount();
    const items = screen.getAllByRole("treeitem");
    expect(items.map((i) => i.getAttribute("aria-level"))).toEqual(["1", "2", "3", "3", "1"]);
  });

  it("collapses a folder and remembers it", () => {
    const props = mount();
    fireEvent.click(screen.getByRole("button", { name: "Collapse Chapter 1" }));
    expect(screen.queryByText("Scene B")).toBeNull();
    cleanup();
    render(<BinderTree {...props} activeDocId={undefined} />);
    expect(screen.queryByText("Scene A")).toBeNull();
  });

  it("shows status initial, and the label in the row hint", () => {
    mount();
    expect(screen.getByLabelText("Status Draft")).toHaveTextContent("D");
    const sceneA = screen.getByText("Scene A").closest("button")!;
    expect(sceneA.getAttribute("title")).toContain("Flashback");
    expect(sceneA.getAttribute("title")).toContain("3 words");
  });

  it("opens documents on click and toggles folders", () => {
    const props = mount();
    fireEvent.click(screen.getByText("Prologue"));
    expect(props.onOpen).toHaveBeenCalledWith("Prologue");
  });

  it("Cmd/Ctrl-click adds to the selection instead of opening", () => {
    const props = mount({ onSelectionChange: vi.fn(), selection: [] });
    fireEvent.click(screen.getByText("Prologue"), { metaKey: true });
    expect(props.onOpen).not.toHaveBeenCalled();
    // Starts from the open document, so the pick is "this one too".
    expect(props.onSelectionChange).toHaveBeenCalledWith(["Scene B", "Prologue"]);
  });

  it("Shift-click selects the visible range of documents", () => {
    const props = mount({ onSelectionChange: vi.fn(), selection: [], activeDocId: "Scene A" });
    fireEvent.click(screen.getByText("Prologue"), { shiftKey: true });
    expect(props.onSelectionChange).toHaveBeenCalledWith(["Scene A", "Scene B", "Prologue"]);
  });

  it("a plain click clears the selection and opens", () => {
    const props = mount({ onSelectionChange: vi.fn(), selection: ["Scene A", "Prologue"] });
    fireEvent.click(screen.getByText("Scene B"));
    expect(props.onSelectionChange).toHaveBeenCalledWith([]);
    expect(props.onOpen).toHaveBeenCalledWith("Scene B");
  });

  it("moves a row with Alt+Arrow (keyboard alternative to dragging)", () => {
    const props = mount();
    fireEvent.keyDown(screen.getByText("Scene A").closest("button")!, { key: "ArrowDown", altKey: true });
    expect(props.onMove).toHaveBeenCalledWith({
      id: "Scene A",
      parentId: "Chapter 1",
      orderedIds: ["Scene B", "Scene A"],
    });
  });
});

describe("BinderTree canon-changed badges", () => {
  it("tags affected documents and rolled-up folders with //N and the words", () => {
    const counts = rollUpCanonCounts(
      entries,
      new Map([
        ["Scene A", { facts: 3, names: 1 }],
        ["Prologue", { facts: 0, names: 1 }],
      ]),
    );
    mount({ canonCounts: counts });
    const badges = screen.getAllByTestId("canon-badge");
    const four = "//4" + "3 CITED VALUES CHANGED · 1 NAME CHANGED";
    // Part One, Chapter 1, Scene A (rolled up), then Prologue.
    expect(badges.map((b) => b.textContent)).toEqual([four, four, four, "//1" + "1 NAME CHANGED"]);
    expect(badges[2].getAttribute("title")).toBe("3 CITED VALUES CHANGED · 1 NAME CHANGED");
  });

  it("shows no badge without counts", () => {
    mount();
    expect(screen.queryByTestId("canon-badge")).toBeNull();
  });

  it("expandAll opens collapsed folders without forgetting the stored state", () => {
    const worldId = "w-collapse";
    localStorage.setItem(`sf-binder-collapsed:${worldId}`, JSON.stringify(["Part One"]));
    mount({ worldId, activeDocId: undefined });
    expect(screen.queryByText("Scene A")).toBeNull();
    cleanup();
    mount({ worldId, activeDocId: undefined, expandAll: true });
    expect(screen.getByText("Scene A")).toBeTruthy();
    expect(localStorage.getItem(`sf-binder-collapsed:${worldId}`)).toBe(JSON.stringify(["Part One"]));
  });
});
