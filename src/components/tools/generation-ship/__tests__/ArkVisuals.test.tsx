import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  DeckPlan,
  GenerationsStrip,
  HabitatSchematic,
  InbreedingCurve,
  MvpScale,
} from "@/components/tools/generation-ship/ArkVisuals";
import { NumberField, ProvenanceChip, WarningList } from "@/components/tools/generation-ship/ArkFields";
import { INITIAL_GENSHIP_STATE, computeGenShip, normalizeGenShipState } from "@/lib/generation-ship/calculations";
import { buildDriftEvents } from "@/lib/generation-ship/drift-events";

afterEach(cleanup);

const form = normalizeGenShipState(JSON.parse(JSON.stringify(INITIAL_GENSHIP_STATE)));
const results = computeGenShip(form);
const events = buildDriftEvents(form, results);

describe("Ark visuals", () => {
  it("render every drift event as a focusable pin and report the selection", () => {
    let picked = "";
    render(
      <GenerationsStrip
        totalYears={results.voyage.shipYears}
        generationYears={form.population.generationYears}
        events={events}
        selectedId={null}
        onSelect={(id) => { picked = id; }}
      />,
    );
    const pins = screen.getAllByRole("button");
    expect(pins).toHaveLength(events.length);
    fireEvent.click(pins[0]);
    expect(picked).toBe("launch");
  });

  it("render the curve, scale, schematic and deck plan without crashing", () => {
    const { container } = render(
      <>
        <InbreedingCurve fSeries={results.genetics.fSeries} generations={results.genetics.generations} />
        <MvpScale founding={form.population.founding} ne={results.genetics.eff.ne} />
        <HabitatSchematic form={form} results={results} />
        <DeckPlan results={results} />
      </>,
    );
    expect(screen.getByText("ARRIVAL")).toBeTruthy();
    expect(screen.getByText("Deck 1")).toBeTruthy();
    expect(container.querySelector('[aria-label="Deck area allocation"]')).toBeTruthy();
    // No raw hex: every colour is a token class.
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{6}/);
  });

  it("shows warnings with an icon and a spoken level, never colour alone", () => {
    render(<WarningList warnings={[{ id: "x", level: "danger", section: "genetics", message: "F ABOVE 0.1." }]} />);
    expect(screen.getByRole("alert").textContent).toContain("Danger:");
  });

  it("links a provenance chip to its source worksheet", () => {
    render(
      <MemoryRouter>
        <ProvenanceChip provenance={{ tool: "time-dilation", worksheetId: "ws1", worksheetTitle: "Tau Ceti" }} worldId="w1" />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/tools/time-dilation?worldId=w1&worksheetId=ws1");
    expect(link.textContent).toContain("// FROM PARADOX");
  });

  it("number field commits parseable values and tolerates partial input", () => {
    const seen: number[] = [];
    render(<NumberField label="Cruise speed" value={0.01} onChange={(n) => seen.push(n)} unit="c" worldId={null} />);
    const input = screen.getByLabelText("Cruise speed");
    fireEvent.change(input, { target: { value: "0.05" } });
    expect(seen).toEqual([0.05]);
  });
});
