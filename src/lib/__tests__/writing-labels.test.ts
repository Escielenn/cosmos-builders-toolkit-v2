import { describe, it, expect } from "vitest";
import {
  sanitizeLabels,
  readLabels,
  writeLabels,
  nextLabelHue,
  findLabel,
  LABEL_HUES,
  MAX_LABELS,
} from "@/lib/writing-labels";

describe("sanitizeLabels", () => {
  it("keeps valid labels and drops junk", () => {
    expect(
      sanitizeLabels([
        { id: "a", name: " Flashback ", hue: "violet" },
        { id: "a", name: "duplicate id", hue: "amber" },
        { id: "b", name: "", hue: "amber" },
        { id: "c", name: "Bad hue", hue: "cyan" },
        null,
        "nope",
      ]),
    ).toEqual([
      { id: "a", name: "Flashback", hue: "violet" },
      { id: "c", name: "Bad hue", hue: "stellar" },
    ]);
  });

  it("caps the list", () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ id: `l${i}`, name: `L${i}`, hue: "amber" }));
    expect(sanitizeLabels(many)).toHaveLength(MAX_LABELS);
  });
});

describe("read/write against worlds.settings", () => {
  it("round-trips and preserves other settings keys", () => {
    const settings = writeLabels({ other: 1 }, [{ id: "x", name: "Scene", hue: "teal" }]);
    expect(settings.other).toBe(1);
    expect(readLabels(settings)).toEqual([{ id: "x", name: "Scene", hue: "teal" }]);
  });

  it("reads nothing from junk", () => {
    expect(readLabels(null)).toEqual([]);
    expect(readLabels([])).toEqual([]);
    expect(readLabels({ writingLabels: "x" })).toEqual([]);
  });
});

describe("helpers", () => {
  it("picks an unused hue first", () => {
    expect(nextLabelHue([])).toBe(LABEL_HUES[0]);
    expect(nextLabelHue([{ id: "a", name: "A", hue: LABEL_HUES[0] }])).toBe(LABEL_HUES[1]);
  });

  it("finds by id", () => {
    const labels = [{ id: "a", name: "A", hue: "amber" as const }];
    expect(findLabel(labels, "a")?.name).toBe("A");
    expect(findLabel(labels, "")).toBeNull();
    expect(findLabel(labels, "zz")).toBeNull();
  });
});
