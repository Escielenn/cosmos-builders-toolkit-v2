import { describe, expect, it } from "vitest";
import { capSnapshots, isNamedSnapshot } from "../snapshot-cap";

const snap = (id: number, name: string | null = null) => ({ id, name });

describe("capSnapshots", () => {
  it("keeps the newest unnamed rows up to the cap", () => {
    const list = Array.from({ length: 25 }, (_, i) => snap(i));
    const out = capSnapshots(list);
    expect(out).toHaveLength(20);
    expect(out[0].id).toBe(0);
    expect(out[19].id).toBe(19);
  });

  it("never trims a named snapshot, however old", () => {
    const list = [
      ...Array.from({ length: 22 }, (_, i) => snap(i)),
      snap(100, "Before the rewrite"),
      snap(101),
    ];
    const out = capSnapshots(list);
    expect(out.map((s) => s.id)).toContain(100);
    expect(out.filter((s) => !isNamedSnapshot(s))).toHaveLength(20);
    expect(out.map((s) => s.id)).not.toContain(101);
  });

  it("named rows do not count toward the cap", () => {
    const list = [snap(1, "A"), snap(2, "B"), ...Array.from({ length: 20 }, (_, i) => snap(10 + i))];
    expect(capSnapshots(list)).toHaveLength(22);
  });

  it("treats a blank name as unnamed and preserves order", () => {
    const list = [snap(1, "  "), snap(2, "Keep"), snap(3)];
    expect(capSnapshots(list, 1).map((s) => s.id)).toEqual([1, 2]);
  });
});
