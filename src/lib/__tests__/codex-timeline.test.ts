// ---------------------------------------------------------------------------
// The Codex Timeline view (F5/F6, 13-THE-LIFT.md §1).
//
// The rule under test: a declared span and an observed span are not
// equivalent, and where they disagree the disagreement is REPORTED, never
// averaged away. A writer who typed "founded 1502" and then wrote an event at
// 1480 has a contradiction worth seeing.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  buildTimeline,
  flattenEvents,
  parseEpochLabel,
  spanGeometry,
} from "@/lib/atlas/timeline";
import type { ChronicleEvent } from "@/services/chronicle-data";
import type { Entity } from "@/services/entity-graph-types";

let n = 0;
const ent = (over: Partial<Entity> = {}): Entity =>
  ({
    id: `e${++n}`,
    world_id: "w",
    user_id: "u",
    name: `Entity ${n}`,
    entity_type: "faction",
    custom_type_label: null,
    cascade_stage: "culture",
    color: null,
    icon: null,
    summary: null,
    image_url: null,
    description: null,
    notes: null,
    parent_entity_id: null,
    sort_order: 0,
    tags: [],
    graph_x: null,
    graph_y: null,
    pinned: false,
    metadata: {},
    created_at: "",
    updated_at: "",
    ...over,
  }) as Entity;

const evt = (over: Partial<ChronicleEvent> = {}): ChronicleEvent =>
  ({
    id: `v${++n}`,
    title: "An event",
    description: null,
    eventDate: "1500",
    sortValue: 1500,
    endDate: null,
    endSortValue: null,
    eventType: "event",
    layer: null,
    parentId: null,
    linkedEntryId: null,
    linkedEntryTitle: null,
    icon: null,
    color: null,
    tags: [],
    children: [],
    ...over,
  }) as ChronicleEvent;

describe("parseEpochLabel", () => {
  it("reads a number out of a label", () => {
    expect(parseEpochLabel("1502")).toBe(1502);
    expect(parseEpochLabel("Year 1502")).toBe(1502);
    expect(parseEpochLabel("-200")).toBe(-200);
    expect(parseEpochLabel("1502.5")).toBe(1502.5);
  });

  it("returns null for a label with no number rather than guessing", () => {
    expect(parseEpochLabel("the Long Quiet")).toBeNull();
    expect(parseEpochLabel("")).toBeNull();
    expect(parseEpochLabel(null)).toBeNull();
  });
});

describe("flattenEvents", () => {
  it("includes nested children — a child event links to entities too", () => {
    const tree = [
      evt({ id: "a", children: [evt({ id: "b", children: [evt({ id: "c" })] })] }),
    ];
    expect(flattenEvents(tree).map((e) => e.id)).toEqual(["a", "b", "c"]);
  });
});

describe("buildTimeline", () => {
  it("uses the writer's declared range when there is one", () => {
    const e = ent({ id: "x", metadata: { epoch_from: "1500", epoch_to: "1600" } });
    const { spans } = buildTimeline([e], []);
    expect(spans[0]).toMatchObject({
      from: 1500,
      to: 1600,
      fromLabel: "1500",
      toLabel: "1600",
      observed: false,
      conflict: null,
    });
  });

  it("derives a span from linked events when nothing was declared", () => {
    const e = ent({ id: "x" });
    const events = [
      evt({ linkedEntryId: "x", sortValue: 1200, eventDate: "1200" }),
      evt({ linkedEntryId: "x", sortValue: 1450, eventDate: "1450" }),
    ];
    const { spans } = buildTimeline([e], events);
    expect(spans[0]).toMatchObject({
      from: 1200,
      to: 1450,
      fromLabel: "1200",
      toLabel: "1450",
      observed: true,
      eventCount: 2,
    });
  });

  it("REPORTS a conflict when events fall outside the declared range", () => {
    const e = ent({ id: "x", metadata: { epoch_from: "1502", epoch_to: "1600" } });
    const events = [evt({ linkedEntryId: "x", sortValue: 1480, eventDate: "1480" })];
    const { spans } = buildTimeline([e], events);
    // The declared range still wins — it is what the writer said.
    expect(spans[0].from).toBe(1502);
    expect(spans[0].conflict).toContain("outside the declared range");
  });

  it("does not average a declared range with an observed one", () => {
    const e = ent({ id: "x", metadata: { epoch_from: "1000", epoch_to: "1100" } });
    const events = [evt({ linkedEntryId: "x", sortValue: 2000, eventDate: "2000" })];
    const { spans } = buildTimeline([e], events);
    expect(spans[0].from).toBe(1000);
    expect(spans[0].to).toBe(1100);
  });

  it("fills a half-declared range from the events, not from nothing", () => {
    const e = ent({ id: "x", metadata: { epoch_from: "1500" } });
    const events = [evt({ linkedEntryId: "x", sortValue: 1700, eventDate: "1700" })];
    const { spans } = buildTimeline([e], events);
    expect(spans[0].from).toBe(1500);
    expect(spans[0].to).toBe(1700);
  });

  it("honours an event's end date for the span's far edge", () => {
    const e = ent({ id: "x" });
    const events = [
      evt({
        linkedEntryId: "x",
        sortValue: 1000,
        eventDate: "1000",
        endSortValue: 1300,
        endDate: "1300",
      }),
    ];
    const { spans } = buildTimeline([e], events);
    expect(spans[0]).toMatchObject({ from: 1000, to: 1300, toLabel: "1300" });
  });

  it("lists an entity with no date as undated rather than placing it", () => {
    const { spans, undated } = buildTimeline([ent({ id: "x", name: "Nowhen" })], []);
    expect(spans).toEqual([]);
    expect(undated).toEqual([
      { id: "x", name: "Nowhen", entityType: "faction" },
    ]);
  });

  it("treats an unparseable epoch label as no declaration at all", () => {
    const e = ent({ id: "x", metadata: { epoch_from: "the Long Quiet" } });
    expect(buildTimeline([e], []).undated.map((u) => u.id)).toEqual(["x"]);
  });

  it("orders spans by start, then name, so the axis reads top to bottom", () => {
    const a = ent({ id: "a", name: "Zed", metadata: { epoch_from: "100", epoch_to: "200" } });
    const b = ent({ id: "b", name: "Alpha", metadata: { epoch_from: "100", epoch_to: "200" } });
    const c = ent({ id: "c", name: "Mid", metadata: { epoch_from: "50", epoch_to: "60" } });
    expect(buildTimeline([a, b, c], []).spans.map((s) => s.name)).toEqual([
      "Mid",
      "Alpha",
      "Zed",
    ]);
  });

  it("reports the axis bounds across every span", () => {
    const a = ent({ metadata: { epoch_from: "100", epoch_to: "200" } });
    const b = ent({ metadata: { epoch_from: "150", epoch_to: "900" } });
    expect(buildTimeline([a, b], []).bounds).toEqual({ min: 100, max: 900 });
  });

  it("has no bounds when nothing is dated", () => {
    expect(buildTimeline([ent({})], []).bounds).toBeNull();
  });

  it("ignores events linked to nothing", () => {
    const e = ent({ id: "x" });
    expect(buildTimeline([e], [evt({ linkedEntryId: null })]).undated).toHaveLength(1);
  });
});

describe("spanGeometry", () => {
  it("places a span proportionally on the axis", () => {
    const span = buildTimeline(
      [ent({ metadata: { epoch_from: "150", epoch_to: "250" } })],
      [],
    ).spans[0];
    expect(spanGeometry(span, { min: 100, max: 300 })).toEqual({
      left: 0.25,
      width: 0.5,
    });
  });

  it("does not divide by zero when every entity shares one instant", () => {
    const span = buildTimeline(
      [ent({ metadata: { epoch_from: "500", epoch_to: "500" } })],
      [],
    ).spans[0];
    expect(spanGeometry(span, { min: 500, max: 500 })).toEqual({ left: 0, width: 1 });
  });
});
