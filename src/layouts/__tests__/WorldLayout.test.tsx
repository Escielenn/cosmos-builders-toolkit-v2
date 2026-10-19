import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { useWorldLayoutContext } from "@/contexts/WorldLayoutContext";

// 15-PAGE-CHROME §1: one frame on every world route. The heavy children
// (site header, Codex, entity sidebar) are stubbed; what is under test is
// which chrome WorldLayout draws on which route.
vi.mock("@/components/layout/Header", () => ({
  default: () => <header data-testid="site-header">SITE HEADER</header>,
}));
vi.mock("@/components/codex/Codex", () => ({ default: () => <div data-testid="codex" /> }));
vi.mock("@/components/world/EntitySidebar", () => ({ default: () => <div data-testid="entity-sidebar" /> }));
vi.mock("@/hooks/use-world", () => ({
  useWorld: () => ({ data: { id: "w1", name: "Kepler Reach", icon: "globe", theme: undefined }, isLoading: false, error: null }),
}));
vi.mock("@/hooks/use-subscription", () => ({ useSubscription: () => ({ isSubscribed: false }) }));
vi.mock("@/hooks/use-entity-graph", () => ({
  useDeleteEntity: () => ({ mutate: vi.fn() }),
  useEntities: () => ({ data: [] }),
}));
vi.mock("@/hooks/use-audio-player", () => ({ useAudioPlayer: () => ({ hasEverLoaded: false, minimized: false }) }));

import WorldLayout from "../WorldLayout";

afterEach(cleanup);

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

let focusSetter: ((hidden: boolean) => void) | undefined;
function ManuscriptStub() {
  const ctx = useWorldLayoutContext();
  useEffect(() => {
    focusSetter = ctx?.setChromeHidden;
  }, [ctx]);
  return <div data-testid="manuscript">MANUSCRIPT</div>;
}

function mountAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/worlds/:worldId" element={<WorldLayout />}>
          <Route index element={<div data-testid="bridge">BRIDGE</div>} />
          <Route path="write/:docId" element={<ManuscriptStub />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("WorldLayout frame", () => {
  it("renders the site header, the world nav and the world index on the Bridge", () => {
    mountAt("/worlds/w1");
    expect(screen.getByTestId("site-header")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "World" })).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "World index" })).toBeTruthy();
    expect(screen.getByTestId("bridge")).toBeTruthy();
  });

  it("keeps the site header and world nav on the Manuscript, and hides the world index", () => {
    mountAt("/worlds/w1/write/doc-1");
    expect(screen.getByTestId("site-header")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "World" })).toBeTruthy();
    expect(screen.queryByRole("complementary", { name: "World index" })).toBeNull();
    expect(screen.getByTestId("manuscript")).toBeTruthy();
  });

  it("hides header and nav only in focus mode", () => {
    mountAt("/worlds/w1/write/doc-1");
    act(() => focusSetter?.(true));
    expect(screen.queryByTestId("site-header")).toBeNull();
    expect(screen.queryByRole("navigation", { name: "World" })).toBeNull();
    expect(screen.getByTestId("manuscript")).toBeTruthy();
    act(() => focusSetter?.(false));
    expect(screen.getByTestId("site-header")).toBeTruthy();
  });
});
