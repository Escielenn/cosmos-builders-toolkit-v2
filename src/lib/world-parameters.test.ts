import { describe, it, expect } from "vitest";
import { parseParameterSlug, countParameterHits, toPlainText } from "./world-parameters";

describe("world parameters (cascade panel)", () => {
  it("parses category-value slugs into labelled parameters", () => {
    const g = parseParameterSlug("gravity-low");
    expect(g?.category).toBe("gravity");
    expect(g?.label).toBe("Low gravity");
    expect(g?.keywords).toContain("gravity");

    const t = parseParameterSlug("rotation-locked");
    expect(t?.label).toBe("Tidally locked");
    expect(t?.keywords).toContain("terminator");
  });
  it("returns null for unknown categories", () => {
    expect(parseParameterSlug("nonsense-xyz")).toBeNull();
    expect(parseParameterSlug("")).toBeNull();
  });
  it("counts keyword hits in scene prose (word-boundary aware)", () => {
    const g = parseParameterSlug("gravity-high")!;
    expect(countParameterHits("The heavy gravity crushed him.", g)).toBeGreaterThan(0);
    expect(countParameterHits("Nothing relevant here.", g)).toBe(0);
    // 'gravity' should not match inside 'gravitational' via word boundary on the phrase list
    expect(countParameterHits("gravity gravity", g)).toBe(2);
  });
  it("strips HTML to plain text", () => {
    expect(toPlainText("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
    expect(toPlainText(null)).toBe("");
  });
});
