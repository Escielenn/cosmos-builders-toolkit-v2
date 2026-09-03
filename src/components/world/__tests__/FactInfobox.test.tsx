import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import FactInfobox from "@/components/world/FactInfobox";
import type { InfoboxRow } from "@/lib/codex-entity";

vi.mock("@/lib/worksheet-links-config", () => ({
  getToolDisplayName: (t: string) => (t === "planetary-profile" ? "Genesis" : t),
}));

const WORLD = "w1";
const rows: InfoboxRow[] = [
  {
    key: "surfaceGravity",
    label: "Surface Gravity (g)",
    value: "1.47",
    source: { worksheetId: "ws-a", worksheetTitle: "Kellis survey", toolType: "planetary-profile" },
    conflicts: [{ value: "0.9", source: { worksheetId: "ws-b", worksheetTitle: null, toolType: "planetary-profile" } }],
  },
];

function LocationEcho() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname + loc.search}</div>;
}

function mount(r: InfoboxRow[]) {
  return render(
    <MemoryRouter initialEntries={[`/worlds/${WORLD}/codex/e1`]}>
      <Routes>
        <Route path="/worlds/:worldId/codex/:entityId" element={<FactInfobox worldId={WORLD} rows={r} />} />
        <Route path="*" element={<LocationEcho />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(cleanup);

describe("FactInfobox", () => {
  it("renders a row with its value and a provenance chip naming the instrument", () => {
    mount(rows);
    expect(screen.getByText("Surface Gravity (g)")).toBeInTheDocument();
    expect(screen.getByText("1.47")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open Genesis — Kellis survey/ })).toBeInTheDocument();
  });

  it("surfaces a contradiction instead of hiding it", () => {
    mount(rows);
    expect(screen.getByText("// CONTRADICTED")).toBeInTheDocument();
    expect(screen.getByText("0.9")).toBeInTheDocument();
  });

  it("the chip opens the producing worksheet in its instrument", () => {
    mount(rows);
    fireEvent.click(screen.getByRole("button", { name: /Open Genesis — Kellis survey/ }));
    expect(screen.getByTestId("loc").textContent).toBe(`/worlds/${WORLD}/tools/planetary-profile?worksheetId=ws-a`);
  });

  it("says so when nothing is on file, in ship's voice", () => {
    mount([]);
    expect(screen.getByText(/NO INSTRUMENT HAS RECORDED THIS ENTITY YET/)).toBeInTheDocument();
    expect(screen.getByText(/GENERATED FROM NO INSTRUMENTS/)).toBeInTheDocument();
  });
});
