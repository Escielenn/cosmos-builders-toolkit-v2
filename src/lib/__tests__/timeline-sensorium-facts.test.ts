import { describe, it, expect } from "vitest";
import { extractWorksheetFacts, hasFactMapping } from "@/lib/worksheet-facts";
import { extractTimelineFacts } from "@/lib/timeline-facts";
import { initialTimelineState } from "@/lib/timeline/constants";
import { DEFAULT_FORM_STATE } from "@/lib/sensorium/data";

// ---------------------------------------------------------------------------
// Two tools that recorded real work and could not be read by the writing
// surface: Sensorium (scalars a dot path can reach) and Timeline (a list of
// events, which is why it needed a reader of its own).
//
// Both fixtures are built from the tool's own exported defaults, so a change to
// the persisted shape breaks these tests rather than silently emptying a panel.
// ---------------------------------------------------------------------------

const timelineSave = () => ({
  ...initialTimelineState,
  events: [
    {
      id: "e1",
      trackId: "t1",
      name: "The Quiet War",
      shortDescription: "Ended without a treaty",
      eventType: "war",
      startYear: 417,
      endYear: 424,
      hasDuration: true,
      importance: "major",
    },
    {
      id: "e2",
      trackId: "t1",
      name: "Landfall",
      shortDescription: "First permanent settlement",
      eventType: "founding",
      startYear: -50,
      hasDuration: false,
      importance: "epochal",
    },
    {
      id: "e3",
      trackId: "t1",
      name: "A minor squabble",
      shortDescription: "",
      eventType: "other",
      startYear: 500,
      hasDuration: false,
      importance: "minor",
    },
  ],
});

const sensoriumSave = () => ({
  ...DEFAULT_FORM_STATE,
  speciesName: "Ashgrave Drifters",
  perceptionProfile: {
    dominantSense: "Magnetoreception",
    sensoryHierarchy: "magnetic, then chemical, then touch",
    perceptionNotes: "",
  },
  perceptionGapNotes: {
    speciesPerceives: "Magnetic field lines and their distortion",
    speciesBlind: "Visible light entirely",
    conflictPotential: "",
  },
});

describe("a timeline reaching the writing surface", () => {
  it("is declared as mapped, so the panel offers it", () => {
    expect(hasFactMapping("timeline")).toBe(true);
  });

  it("routes through the shared extractor, not just its own module", () => {
    // The panel calls extractWorksheetFacts; a reader nothing dispatches to is
    // the exact failure this whole task exists to fix.
    const facts = extractWorksheetFacts("timeline", timelineSave());
    expect(facts.length).toBeGreaterThan(0);
  });

  it("reports the span of history, reading negative years as BCE", () => {
    const facts = extractTimelineFacts(timelineSave());
    const span = facts.find((f) => f.key === "timeline.span");
    expect(span?.value).toBe("50 BCE to 500");
  });

  it("puts the most consequential event first", () => {
    const facts = extractTimelineFacts(timelineSave());
    const events = facts.filter((f) => f.key.startsWith("timeline.event."));
    // Landfall is epochal, the war only major, the squabble minor.
    expect(events[0].label).toBe("Landfall");
    expect(events[events.length - 1].label).toBe("A minor squabble");
  });

  it("shows a span for an event with duration and a point for one without", () => {
    const facts = extractTimelineFacts(timelineSave());
    const war = facts.find((f) => f.label === "The Quiet War");
    const landfall = facts.find((f) => f.label === "Landfall");
    expect(war?.value).toContain("417 to 424");
    expect(landfall?.value).toContain("50 BCE");
    expect(landfall?.value).not.toContain(" to ");
  });

  it("inserts the event's name, not its date", () => {
    const facts = extractTimelineFacts(timelineSave());
    expect(facts.find((f) => f.label === "Landfall")?.insert).toBe("Landfall");
  });

  it("keeps two same-named events apart", () => {
    const twice = {
      ...initialTimelineState,
      events: [
        { id: "a", trackId: "t", name: "The Siege", startYear: 10, hasDuration: false, importance: "major" },
        { id: "b", trackId: "u", name: "The Siege", startYear: 90, hasDuration: false, importance: "major" },
      ],
    };
    const keys = extractTimelineFacts(twice).map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("is empty for a timeline created but never filled in", () => {
    expect(extractTimelineFacts(initialTimelineState)).toEqual([]);
  });

  it("ignores an event with no name or no year rather than emitting a blank row", () => {
    const junk = {
      ...initialTimelineState,
      events: [
        { id: "a", trackId: "t", name: "", startYear: 10, hasDuration: false, importance: "major" },
        { id: "b", trackId: "t", name: "Nameless year", hasDuration: false, importance: "major" },
      ],
    };
    expect(extractTimelineFacts(junk)).toEqual([]);
  });
});

describe("a sensorium reaching the writing surface", () => {
  it("is declared as mapped", () => {
    expect(hasFactMapping("sensorium")).toBe(true);
  });

  it("surfaces the species and its dominant sense", () => {
    const byKey = Object.fromEntries(
      extractWorksheetFacts("sensorium", sensoriumSave()).map((f) => [f.key, f.value]),
    );
    expect(byKey.speciesName).toBe("Ashgrave Drifters");
    expect(byKey.dominantSense).toBe("Magnetoreception");
  });

  it("surfaces the perception gap, which is what prose contradicts", () => {
    const byKey = Object.fromEntries(
      extractWorksheetFacts("sensorium", sensoriumSave()).map((f) => [f.key, f.value]),
    );
    expect(byKey.sensoryRange).toBe("Magnetic field lines and their distortion");
    expect(byKey.sensoryBlindSpot).toBe("Visible light entirely");
  });

  it("is empty for an untouched sensorium worksheet", () => {
    // Every narrative field defaults to "", and an empty value must not become
    // a fact that reads as though the writer decided something.
    expect(extractWorksheetFacts("sensorium", DEFAULT_FORM_STATE)).toEqual([]);
  });
});
