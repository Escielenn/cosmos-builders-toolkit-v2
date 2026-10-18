import { describe, it, expect } from "vitest";
import {
  buildLaneLayout,
  resolveEventLane,
  detectBranchAdvisories,
  computeDomain,
  niceTicks,
  formatSortValue,
  computeProperDuration,
  eventInvolvesTraveler,
  PRIME_LANE,
  type BranchRecord,
  type BranchEventLike,
  type JumpRecord,
} from "@/lib/chronicle/branches";

const branch = (over: Partial<BranchRecord> & { id: string }): BranchRecord => ({
  name: over.id.toUpperCase(),
  color: "teal",
  parentBranchId: null,
  divergenceSortValue: null,
  divergenceEventId: null,
  description: null,
  sortOrder: 0,
  ...over,
});

const event = (over: Partial<BranchEventLike> & { id: string; sortValue: number }): BranchEventLike => ({
  title: over.id,
  eventDate: String(over.sortValue / 1000),
  endSortValue: null,
  branchId: null,
  linkedEntryId: null,
  tags: [],
  ...over,
});

const jump = (over: Partial<JumpRecord> & { id: string }): JumpRecord => ({
  travelerEntryId: null,
  travelerLabel: "",
  fromBranchId: null,
  fromSortValue: 0,
  toBranchId: null,
  toSortValue: 0,
  properDuration: null,
  method: "",
  notes: null,
  ...over,
});

describe("buildLaneLayout", () => {
  it("always has the prime lane first, starting at -infinity", () => {
    const lanes = buildLaneLayout([]);
    expect(lanes).toHaveLength(1);
    expect(lanes[0].key).toBe(PRIME_LANE);
    expect(lanes[0].start).toBe(Number.NEGATIVE_INFINITY);
  });

  it("orders children depth-first beneath their parent, siblings by sort order then divergence", () => {
    const lanes = buildLaneLayout([
      branch({ id: "b", divergenceSortValue: 2000 }),
      branch({ id: "a", divergenceSortValue: 1000 }),
      branch({ id: "a1", parentBranchId: "a", divergenceSortValue: 1500 }),
      branch({ id: "c", divergenceSortValue: 500, sortOrder: 5 }),
    ]);
    expect(lanes.map((l) => l.key)).toEqual([PRIME_LANE, "a", "a1", "b", "c"]);
    expect(lanes.map((l) => l.depth)).toEqual([0, 1, 2, 1, 1]);
    expect(lanes.find((l) => l.key === "a1")?.parentKey).toBe("a");
    expect(lanes.map((l) => l.index)).toEqual([0, 1, 2, 3, 4]);
  });

  it("starts a branch lane at its divergence point, or the divergence event's date", () => {
    const lanes = buildLaneLayout(
      [
        branch({ id: "a", divergenceSortValue: 1000 }),
        branch({ id: "e", divergenceEventId: "ev1" }),
        branch({ id: "inherit", parentBranchId: "a" }),
      ],
      [event({ id: "ev1", sortValue: 4200 })],
    );
    const start = (k: string) => lanes.find((l) => l.key === k)?.start;
    expect(start("a")).toBe(1000);
    expect(start("e")).toBe(4200);
    expect(start("inherit")).toBe(1000);
  });

  it("hangs branches with missing or looping parents under prime, marked orphaned", () => {
    const lanes = buildLaneLayout([
      branch({ id: "lost", parentBranchId: "gone" }),
      branch({ id: "x", parentBranchId: "y" }),
      branch({ id: "y", parentBranchId: "x" }),
    ]);
    for (const k of ["lost", "x", "y"]) {
      const lane = lanes.find((l) => l.key === k)!;
      expect(lane.orphaned).toBe(true);
      expect(lane.parentKey).toBe(PRIME_LANE);
    }
  });
});

describe("resolveEventLane", () => {
  it("maps null and unknown branch ids to prime", () => {
    const ids = new Set(["a"]);
    expect(resolveEventLane({ branchId: null }, ids)).toBe(PRIME_LANE);
    expect(resolveEventLane({ branchId: "deleted" }, ids)).toBe(PRIME_LANE);
    expect(resolveEventLane({ branchId: "a" }, ids)).toBe("a");
  });
});

describe("detectBranchAdvisories", () => {
  it("returns nothing for a consistent world", () => {
    const out = detectBranchAdvisories(
      [branch({ id: "a", divergenceSortValue: 1000 })],
      [event({ id: "e1", sortValue: 500 }), event({ id: "e2", sortValue: 1500, branchId: "a" })],
      [jump({ id: "j", fromSortValue: 900, toBranchId: "a", toSortValue: 1200 })],
    );
    expect(out).toEqual([]);
  });

  it("(a) flags a closed causal loop and cites the jump and the events inside it", () => {
    const out = detectBranchAdvisories(
      [],
      [
        event({ id: "before", sortValue: 100_000, linkedEntryId: "ix" }),
        event({ id: "inside", sortValue: 150_000, linkedEntryId: "ix" }),
        event({ id: "other", sortValue: 160_000, linkedEntryId: "someone" }),
      ],
      [
        jump({
          id: "j",
          travelerEntryId: "ix",
          travelerLabel: "Ix",
          fromSortValue: 200_000,
          toSortValue: 140_000,
        }),
      ],
    );
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("causal-loop");
    expect(out[0].title).toBe("CAUSAL LOOP");
    expect(out[0].jumpIds).toEqual(["j"]);
    expect(out[0].eventIds).toEqual(["inside"]);
  });

  it("(a) does not flag a backward jump when the traveller is absent from the loop window", () => {
    const out = detectBranchAdvisories(
      [],
      [event({ id: "far", sortValue: 10, linkedEntryId: "ix" })],
      [jump({ id: "j", travelerEntryId: "ix", fromSortValue: 200, toSortValue: 100 })],
    );
    expect(out).toEqual([]);
  });

  it("(a) does not flag a backward jump onto a different branch", () => {
    const out = detectBranchAdvisories(
      [branch({ id: "a", divergenceSortValue: 0 })],
      [event({ id: "e", sortValue: 150, linkedEntryId: "ix" })],
      [jump({ id: "j", travelerEntryId: "ix", fromSortValue: 200, toBranchId: "a", toSortValue: 100 })],
    );
    expect(out.filter((a) => a.kind === "causal-loop")).toEqual([]);
  });

  it("(b) flags an event on a child branch dated before the divergence", () => {
    const out = detectBranchAdvisories(
      [branch({ id: "a", divergenceSortValue: 1000 })],
      [event({ id: "early", sortValue: 900, branchId: "a" })],
      [],
    );
    expect(out.map((a) => a.kind)).toEqual(["event-predates-divergence"]);
    expect(out[0].eventIds).toEqual(["early"]);
    expect(out[0].branchIds).toEqual(["a"]);
  });

  it("(c) flags a branch that diverges before its parent exists", () => {
    const out = detectBranchAdvisories(
      [
        branch({ id: "parent", divergenceSortValue: 1000 }),
        branch({ id: "child", parentBranchId: "parent", divergenceSortValue: 500 }),
      ],
      [],
      [],
    );
    expect(out.map((a) => a.kind)).toEqual(["divergence-outside-parent"]);
    expect(out[0].branchIds).toEqual(["child", "parent"]);
  });

  it("(c) flags a divergence event that is not on the parent timeline", () => {
    const out = detectBranchAdvisories(
      [
        branch({ id: "other", divergenceSortValue: 0 }),
        branch({ id: "child", divergenceEventId: "ev" }),
      ],
      [event({ id: "ev", sortValue: 50, branchId: "other" })],
      [],
    );
    expect(out.map((a) => a.kind)).toEqual(["divergence-outside-parent"]);
    expect(out[0].eventIds).toEqual(["ev"]);
  });

  it("(d) flags a jump arriving on a branch before it exists", () => {
    const out = detectBranchAdvisories(
      [branch({ id: "a", divergenceSortValue: 1000 })],
      [],
      [jump({ id: "j", travelerLabel: "Ix", fromSortValue: 2000, toBranchId: "a", toSortValue: 500 })],
    );
    expect(out.map((a) => a.kind)).toEqual(["arrival-before-branch"]);
    expect(out[0].jumpIds).toEqual(["j"]);
    expect(out[0].detail).toContain("ARRIVES ON");
  });

  it("flags an orphaned branch", () => {
    const out = detectBranchAdvisories([branch({ id: "lost", parentBranchId: "gone" })], [], []);
    expect(out.map((a) => a.kind)).toEqual(["orphan-branch"]);
  });

  it("is deterministic", () => {
    const args: [BranchRecord[], BranchEventLike[], JumpRecord[]] = [
      [branch({ id: "a", divergenceSortValue: 1000 })],
      [event({ id: "early", sortValue: 900, branchId: "a" })],
      [jump({ id: "j", fromSortValue: 2000, toBranchId: "a", toSortValue: 500 })],
    ];
    expect(detectBranchAdvisories(...args)).toEqual(detectBranchAdvisories(...args));
  });
});

describe("eventInvolvesTraveler", () => {
  it("matches linked entity, tag, or whole word in the title", () => {
    const j = { travelerEntryId: "ix-id", travelerLabel: "Ixtla" };
    expect(eventInvolvesTraveler(event({ id: "1", sortValue: 0, linkedEntryId: "ix-id" }), j)).toBe(true);
    expect(eventInvolvesTraveler(event({ id: "2", sortValue: 0, tags: ["ixtla"] }), j)).toBe(true);
    expect(eventInvolvesTraveler(event({ id: "3", sortValue: 0, title: "Ixtla burns the archive" }), j)).toBe(true);
    expect(eventInvolvesTraveler(event({ id: "4", sortValue: 0, title: "Ixtlani rises" }), j)).toBe(false);
  });
});

describe("axis helpers", () => {
  it("computeDomain pads and never collapses", () => {
    expect(computeDomain([], [], [])).toEqual([0, 100_000]);
    const [min, max] = computeDomain([event({ id: "e", sortValue: 5000 })], [], []);
    expect(min).toBeLessThan(5000);
    expect(max).toBeGreaterThan(5000);
  });

  it("niceTicks lands on 1/2/5 steps", () => {
    expect(niceTicks(0, 10_000, 5)).toEqual([0, 2000, 4000, 6000, 8000, 10_000]);
    expect(niceTicks(10, 10)).toEqual([]);
  });

  it("formatSortValue reads in calendar years", () => {
    expect(formatSortValue(1_128_000, "EO")).toBe("1128 EO");
    expect(formatSortValue(-300_000)).toBe("-300");
    expect(formatSortValue(4_500_000_000_000)).toBe("4.5B");
    expect(formatSortValue(1500)).toBe("1.5");
  });
});

describe("computeProperDuration", () => {
  it("divides coordinate time by the Lorentz factor", () => {
    const r = computeProperDuration(0.6, 10)!;
    expect(r.gamma).toBeCloseTo(1.25, 6);
    expect(r.properYears).toBeCloseTo(8, 6);
    expect(r.label).toBe("8.00 years");
  });

  it("refuses unphysical input", () => {
    expect(computeProperDuration(1, 10)).toBeNull();
    expect(computeProperDuration(0.5, -1)).toBeNull();
    expect(computeProperDuration(Number.NaN, 1)).toBeNull();
  });
});
