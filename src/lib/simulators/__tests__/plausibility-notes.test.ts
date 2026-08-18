import { describe, it, expect } from "vitest";
import { checkTidelockPlausibility } from "@/lib/simulators/plausibility-notes";

describe("checkTidelockPlausibility", () => {
  it("notes a habitable band under 5 degrees as vanishingly narrow", () => {
    const notes = checkTidelockPlausibility({ habPct: 1.2, tSSP: 391, tASP: 168, tTerm: 279, escVel: 11.2 });
    expect(notes.some(n => n.key === "narrowBand")).toBe(true);
  });

  it("says nothing about a habitable band of ordinary width", () => {
    const notes = checkTidelockPlausibility({ habPct: 22, tSSP: 391, tASP: 168, tTerm: 279, escVel: 11.2 });
    expect(notes.some(n => n.key === "narrowBand")).toBe(false);
  });

  it("notes an escape velocity too low to plausibly hold an atmosphere", () => {
    // Below roughly Mars's 5 km/s, atmospheric retention over geological time
    // becomes the exception rather than the rule (Jeans escape, the same
    // reasoning Tidelock's own science page already cites).
    const notes = checkTidelockPlausibility({ habPct: 20, tSSP: 300, tASP: 200, tTerm: 250, escVel: 3.1 });
    expect(notes.some(n => n.key === "weakEscape")).toBe(true);
  });

  it("notes a terminator hotter than the dayside as a physically inverted result", () => {
    // Should not happen from the tool's own generator, but a hand-edited
    // custom config can produce it, and the note exists to catch exactly that.
    const notes = checkTidelockPlausibility({ habPct: 10, tSSP: 300, tASP: 200, tTerm: 320, escVel: 11 });
    expect(notes.some(n => n.key === "invertedGradient")).toBe(true);
  });

  it("returns no notes for an empty or missing results object", () => {
    expect(checkTidelockPlausibility({})).toEqual([]);
  });

  it("never returns a severity other than note", () => {
    const notes = checkTidelockPlausibility({ habPct: 0.5, tSSP: 500, tASP: 100, tTerm: 300, escVel: 2 });
    expect(notes.every(n => n.severity === "note")).toBe(true);
  });
});
