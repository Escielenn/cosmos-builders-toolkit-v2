import { describe, it, expect } from "vitest";
import { buildConditionsBrief, CONDITIONS_BRIEF_LABEL } from "@/lib/simulators/scene-prose";

// A 1.9 Tidelock default payload's results block (M4V, 1 atm N₂/O₂).
const results = {
  starType: "M4V", tSSP: 296.2, tASP: 262.4, tTerm: 268.1, habStatus: "Habitable", habPct: 42.5,
  surfGrav: 1, escVel: 11.19, atmRetention: "Retained", liquidWater: "Stable", tidalLock: "Locked",
  orbPeriod: 21.07, starTeff: 3210, insolation: 0.833, tSubstellarAirless: 344, collapse: false,
  condensationK: 77.4, condensingGas: "N₂", bandWidthDeg: 81.4, bandWidthKm: 9051, bandInnerDeg: 0,
  bandOuterDeg: 81.4, pressureAtm: 1, scaleHeightKm: 7.9, lockTimescaleYr: 8.1e5, systemAgeGyr: 5,
};

describe("conditions brief (doc 11 §3)", () => {
  it("carries the required label", () => {
    expect(CONDITIONS_BRIEF_LABEL).toBe("// CONDITIONS BRIEF · DERIVED · NOT CANON, NOT PROSE");
  });

  it("cites a value on every line", () => {
    const lines = buildConditionsBrief("tidelock", results);
    expect(lines.length).toBeGreaterThan(6);
    for (const l of lines) {
      expect(l.cites.length, l.id).toBeGreaterThan(0);
      for (const c of l.cites) expect(c.value, l.id).not.toBe("");
    }
  });

  it("is impersonal: no second-person POV, no characters, no interior states", () => {
    const text = buildConditionsBrief("tidelock", results).map((l) => l.text).join(" ");
    expect(text).not.toMatch(/\byou\b|\byour\b|\bI\b|\bshe\b|\bhe\b|\bfeel/i);
    expect(text).not.toMatch(/the only strip of this world where the air does not immediately try to kill you/);
  });

  it("states the cited numbers it rests on", () => {
    const lines = buildConditionsBrief("tidelock", results);
    const night = lines.find((l) => l.id === "night")!;
    expect(night.text).toContain("262 K");
    const band = lines.find((l) => l.id === "band")!;
    expect(band.text).toContain("9,051 km");
  });

  it("never claims people live at the terminator", () => {
    const text = buildConditionsBrief("tidelock", { ...results, tTerm: 70 }).map((l) => l.text).join(" ");
    expect(text).not.toMatch(/\b(live|lives|living|settle\w*|civiliz\w*|inhabit\w*)\b/i);
  });

  it("names atmosphere collapse when the sim reports it", () => {
    const lines = buildConditionsBrief("tidelock", { ...results, tASP: 52, collapse: true, condensationK: 63 });
    expect(lines.find((l) => l.id === "night")!.text).toContain("frost point of 63 K");
  });

  it("says when the world is not locked, and drops the locked-only lines", () => {
    const lines = buildConditionsBrief("tidelock", { ...results, tidalLock: "Not locked", lockTimescaleYr: 3e11 });
    expect(lines[0].id).toBe("not-locked");
    expect(lines.find((l) => l.id === "year")).toBeUndefined();
  });

  it("skips a line whose inputs are missing, and is empty for unknown sims", () => {
    const lines = buildConditionsBrief("tidelock", { tSSP: 300 });
    expect(lines.map((l) => l.id)).toEqual(["substellar"]);
    expect(buildConditionsBrief("solaris", results)).toEqual([]);
    expect(buildConditionsBrief("tidelock", null)).toEqual([]);
  });
});
