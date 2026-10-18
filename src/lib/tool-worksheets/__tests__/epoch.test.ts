import { describe, expect, it } from "vitest";
import { codec, dirtyKey } from "@/lib/tool-worksheets/epoch";
import { expectDefaultsRoundTrip, expectRoundTrip, fillLeaves, withMoodboard } from "./roundtrip";

const saved = {
  ...withMoodboard(fillLeaves(codec.defaults)),
  tracks: [{ id: "t1", name: "Empire", type: "political", color: "violet", order: 0, isCollapsed: false }],
  events: [
    {
      id: "e1",
      trackId: "t1",
      name: "The Founding",
      shortDescription: "First charter signed.",
      eventType: "point",
      startYear: -240,
      hasDuration: false,
      importance: "major",
      tags: ["charter"],
    },
  ],
  expandedEventIds: ["e1"],
  eventLinks: [{ id: "l1", sourceEventId: "e1", targetEventId: "e1", linkType: "causes" }],
};

describe("Epoch worksheet codec", () => {
  it("round-trips a saved timeline unchanged", () => expectRoundTrip(codec, saved));

  it("round-trips its defaults", () => expectDefaultsRoundTrip(codec));

  it("opens a phase-1 timeline with the later fields defaulted", () => {
    const state = codec.hydrate({ tracks: saved.tracks, events: saved.events }, codec.defaults);
    expect(state.tracks).toEqual(saved.tracks);
    expect(state.calendars).toEqual([]);
    expect(state.eventLinks).toEqual([]);
    expect(state.causalityLinksVisible).toBe(true);
    expect(state.viewState).toEqual(codec.defaults.viewState);
  });

  it("does not count panning or expanding as an unsaved change", () => {
    const base = codec.hydrate(saved, codec.defaults);
    const panned = { ...base, viewState: { ...base.viewState, centerYear: base.viewState.centerYear + 500 }, expandedEventIds: [] };
    expect(dirtyKey(panned)).toBe(dirtyKey(base));
    expect(dirtyKey({ ...base, generalNotes: "edited" })).not.toBe(dirtyKey(base));
  });
});
