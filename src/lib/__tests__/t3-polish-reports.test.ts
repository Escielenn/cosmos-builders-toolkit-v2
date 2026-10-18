import { describe, it, expect } from "vitest";
import { buildGazetteerReport } from "@/lib/surface-cartographer/places";
import { buildDossierFullReport, sourceLabel } from "@/lib/dossier/full-report";
import { createEmptyDossier } from "@/lib/dossier/types";
import {
  createYearMapper,
  fitAllEvents,
  trackHeaderWidth,
  visibleTickLabels,
  xToYear,
  yearToX,
} from "@/lib/timeline/utils";
import {
  COMPACT_TIMELINE_WIDTH,
  TRACK_HEADER_WIDTH,
  TRACK_HEADER_WIDTH_COMPACT,
} from "@/lib/timeline/constants";
import type { TimelineEvent } from "@/lib/timeline/types";

// ---------------------------------------------------------------------------
// Surface Cartographer: structured gazetteer for the PDF map sheet
// ---------------------------------------------------------------------------

describe("buildGazetteerReport", () => {
  const places = [
    { id: "a", name: "Vel Haran", placeType: "city" as const, description: "Salt city.\nOld.", at: { lat: 10, lon: 20 } },
    { id: "b", name: "Spire", placeType: "landmark" as const, description: "", at: { lat: -5, lon: 100 } },
    { id: "c", name: "Ossery", placeType: "city" as const, description: "", at: { lat: 0, lon: 0 } },
    { id: "d", name: "The Glass", placeType: "hazard" as const, description: "", at: null },
  ];

  it("numbers placed entries in reading order, grouped by type, matching the markdown", () => {
    const r = buildGazetteerReport("Kellis", places.map((p) => ({ place: p, band: "Tropical" })), {
      radiusKm: 7000,
      locked: false,
      substellarLon: 0,
    });
    expect(r.title).toBe("Kellis Gazetteer");
    expect(r.subtitle).toBe("Radius 7,000 km · Free rotation");
    expect(r.groups.map((g) => g.label)).toEqual(["City", "Landmark"]);
    const all = r.groups.flatMap((g) => g.entries);
    expect(all.map((e) => [e.n, e.name])).toEqual([
      [1, "Vel Haran"],
      [2, "Ossery"],
      [3, "Spire"],
    ]);
    expect(all[0].coords).toBe("10.0°N 20.0°E");
    expect(all[0].meta).toBe("Tropical");
    expect(all[0].description).toBe("Salt city. Old.");
    expect(r.unplaced).toEqual(["The Glass"]);
  });

  it("names an unnamed body and a locked world", () => {
    const r = buildGazetteerReport("", [], { radiusKm: null, locked: true, substellarLon: 0 });
    expect(r.title).toBe("Unnamed body Gazetteer");
    expect(r.subtitle).toContain("Tidally locked");
    expect(r.groups).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Dossier full report
// ---------------------------------------------------------------------------

describe("buildDossierFullReport", () => {
  it("prints every value with where it came from", () => {
    const d = createEmptyDossier();
    d.identity.name = "Ilse Varo";
    d.origins.homeworld = { worksheetId: "ws1", name: "Kellis" };
    d.origins.house = "Varo";
    d.resolved = { homeworld: "Kellis", lifespan: "140 years", cosmology: "The Turning Wheel" };
    d.provenance = { homeworld: "planetary-profile", lifespan: "evolutionary-biology", cosmology: "override" };
    d.overrides = { cosmology: "The Turning Wheel" };
    d.voice.sampleLines = "<p>We do not count the dead.</p>";
    d.generalNotes = "<p>Left-handed.</p>";
    d.relationships = [
      { id: "r1", type: "rival", customLabel: "", targetKind: "entry", targetId: "x", targetName: "Ondre", note: "since the flood", connectionId: null },
    ];
    d.arc = [{ id: "b1", eventId: "ev1", eventLabel: "The Flood", note: "loses the house" }];

    const r = buildDossierFullReport(d);
    expect(r.name).toBe("Ilse Varo");
    expect(r.origins).toContainEqual({ label: "Homeworld", value: "Kellis", source: expect.stringMatching(/^Inherited from /) });
    expect(r.origins).toContainEqual({ label: "House", value: "Varo" });
    const body = r.traits.find((g) => g.title === "Body & Biology");
    expect(body?.rows).toContainEqual({ label: "Lifespan", value: "140 years", source: expect.stringMatching(/^Inherited from /) });
    const beliefs = r.traits.find((g) => g.title === "Beliefs, Polity & Language");
    expect(beliefs?.rows).toContainEqual({ label: "Cosmology", value: "The Turning Wheel", source: "Writer override" });
    expect(r.overrides).toEqual([{ label: "Cosmology", value: "The Turning Wheel" }]);
    expect(r.sampleLines).toBe("We do not count the dead.");
    expect(r.generalNotes).toBe("Left-handed.");
    expect(r.relationships[0]).toMatchObject({ value: "Ondre: since the flood", source: "Codex entry" });
    expect(r.arc[0]).toEqual({ label: "Beat 1", value: "The Flood: loses the house", source: "Timeline event" });
  });

  it("drops empty groups and names the unnamed", () => {
    const r = buildDossierFullReport(createEmptyDossier());
    expect(r.name).toBe("Unnamed Character");
    expect(r.traits).toEqual([]);
    expect(r.identity).toEqual([]);
  });

  it("labels provenance tags", () => {
    expect(sourceLabel(undefined)).toBe("");
    expect(sourceLabel("override")).toBe("Writer override");
    expect(sourceLabel("dossier")).toBe("Dossier");
  });
});

// ---------------------------------------------------------------------------
// Timeline: compact track header at phone width
// ---------------------------------------------------------------------------

describe("trackHeaderWidth", () => {
  it("uses the compact header below the breakpoint", () => {
    expect(trackHeaderWidth(343)).toBe(TRACK_HEADER_WIDTH_COMPACT);
    expect(trackHeaderWidth(COMPACT_TIMELINE_WIDTH - 1)).toBe(TRACK_HEADER_WIDTH_COMPACT);
    expect(trackHeaderWidth(COMPACT_TIMELINE_WIDTH)).toBe(TRACK_HEADER_WIDTH);
    expect(trackHeaderWidth(1000)).toBe(TRACK_HEADER_WIDTH);
  });

  it("keeps desktop geometry unchanged", () => {
    // centre year sits at the centre of the lane area, after a 200px header
    expect(yearToX(2000, 2000, 10, 1000)).toBe(200 + 400);
  });

  it("keeps the axis, the lanes and hit-testing on one header at phone width", () => {
    const vw = 343;
    const x = yearToX(2100, 2000, 1, vw);
    expect(x).toBe(TRACK_HEADER_WIDTH_COMPACT + (vw - TRACK_HEADER_WIDTH_COMPACT) / 2 + 100);
    expect(xToYear(x, 2000, 1, vw)).toBeCloseTo(2100);
    const m = createYearMapper(2000, 1, vw, []);
    expect(m.headerWidth).toBe(TRACK_HEADER_WIDTH_COMPACT);
    expect(m.yearToX(2100)).toBe(x);
  });

  it("fits all events into the wider phone lane area", () => {
    const ev = (y: number) => ({ id: String(y), startYear: y }) as unknown as TimelineEvent;
    const phone = fitAllEvents([ev(0), ev(100)], 343);
    const contentWidth = 343 - TRACK_HEADER_WIDTH_COMPACT;
    expect(phone?.pixelsPerYear).toBeCloseTo(contentWidth / 120);
  });
});

describe("visibleTickLabels", () => {
  it("keeps majors first, then fills minors where they fit", () => {
    const ticks = [
      { x: 0, isMajor: true },
      { x: 10, isMajor: false },
      { x: 30, isMajor: false },
      { x: 50, isMajor: true },
      { x: 100, isMajor: false },
    ];
    expect([...visibleTickLabels(ticks, 48)].sort((a, b) => a - b)).toEqual([0, 3, 4]);
  });

  it("keeps everything when there is room", () => {
    const ticks = [0, 100, 200].map((x) => ({ x, isMajor: false }));
    expect(visibleTickLabels(ticks, 48).size).toBe(3);
  });
});
