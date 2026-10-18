import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { WorldRefsPanel } from "@/components/writing/WorldRefsPanel";
import { StudioWorldProvider, type StudioWorld } from "@/components/writing/studio-world";
import { buildSceneContext } from "@/lib/writing/scene-context";
import { indexFacts, type WorldFact } from "@/lib/writing/world-index";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

function fact(p: Partial<WorldFact> & { ref: string; label: string }): WorldFact {
  return {
    factKey: p.ref,
    value: "1",
    insert: "1",
    tool: "planetary-profile",
    toolLabel: "Genesis",
    sourceKind: "worksheet",
    sourceId: "ws-1",
    sourceTitle: "Kellis Prime",
    entityId: null,
    href: "/tools/planetary-profile?worksheetId=ws-1",
    accent: "azure",
    ...p,
  };
}

const facts = [
  fact({ ref: "a", label: "Orbital Period", insert: "347 days", sourceId: "ws-2", sourceTitle: "Other World" }),
  fact({ ref: "b", label: "Surface Gravity (g)", insert: "1.4 g", entityId: "kellis" }),
];

function world(): StudioWorld {
  return {
    worldId: "w",
    loading: false,
    facts,
    factsByRef: indexFacts(facts),
    factsByEntity: new Map([["kellis", [facts[1]]]]),
    factsBySource: new Map([["ws-1", [facts[1]]], ["ws-2", [facts[0]]]]),
    entities: [],
    entityById: new Map(),
    connections: [],
    worksheets: [],
    simulations: [],
    subjects: {},
    branches: [],
    scene: buildSceneContext({
      html: '<p><entity-mention data-id="kellis">Kellis</entity-mention></p>',
      connections: [],
    }),
    focus: false,
  };
}

beforeEach(cleanup);

function mount(pins = [] as Parameters<typeof WorldRefsPanel>[0]["pins"]) {
  const props = { pins, onUnpin: vi.fn(), onPinSource: vi.fn(), onCite: vi.fn(), onInsertPlain: vi.fn() };
  render(
    <MemoryRouter>
      <StudioWorldProvider value={world()}>
        <WorldRefsPanel {...props} />
      </StudioWorldProvider>
    </MemoryRouter>,
  );
  return props;
}

describe("WorldRefsPanel", () => {
  it("lifts what the scene mentions and says why", () => {
    mount();
    const scene = screen.getByRole("region", { name: "For this scene" });
    expect(within(scene).getByText("1.4 g")).toBeInTheDocument();
    expect(within(scene).getByText("IN THIS SCENE")).toBeInTheDocument();
    expect(within(scene).queryByText("347 days")).not.toBeInTheDocument();
  });

  it("cites by default and inserts plain text on the secondary button", () => {
    const p = mount();
    fireEvent.click(screen.getByRole("button", { name: "Cite Surface Gravity (g) at the cursor" }));
    expect(p.onCite).toHaveBeenCalledWith(facts[1]);
    fireEvent.click(screen.getByRole("button", { name: "Insert Surface Gravity (g) as plain text" }));
    expect(p.onInsertPlain).toHaveBeenCalledWith(facts[1]);
  });

  it("folds the rest of the world by source", () => {
    mount();
    const toggle = screen
      .getAllByRole("button", { name: /Genesis · Other World/ })
      .find((b) => b.hasAttribute("aria-expanded"))!;
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("347 days")).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByText("347 days")).toBeInTheDocument();
  });

  it("shows pins with their key values, and unpins", () => {
    const pin = { id: "ws-1", type: "worksheet" as const, title: "Genesis · Kellis Prime", content: "", pinnedAt: "" };
    const p = mount([pin]);
    const pinned = screen.getByRole("region", { name: "Pinned" });
    expect(within(pinned).getByText("1.4 g")).toBeInTheDocument();
    fireEvent.click(within(pinned).getByRole("button", { name: "Unpin Genesis · Kellis Prime" }));
    expect(p.onUnpin).toHaveBeenCalledWith(pin);
  });
});
