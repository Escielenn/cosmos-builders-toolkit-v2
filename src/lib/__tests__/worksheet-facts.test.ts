import { describe, it, expect } from "vitest";
import {
  extractWorksheetFacts,
  hasFactMapping,
  summarizeFacts,
} from "@/lib/worksheet-facts";

describe("extractWorksheetFacts", () => {
  it("pairs the master-field label with the value at the tool's mapped path", () => {
    const facts = extractWorksheetFacts("planetary-profile", {
      physicalCharacteristics: { surfaceGravity: 1.47 },
    });
    expect(facts).toContainEqual({
      key: "surfaceGravity",
      label: "Surface Gravity (g)",
      value: "1.47",
    });
  });

  it("reads a second mapped path on the same tool", () => {
    const facts = extractWorksheetFacts("planetary-profile", {
      stellarEnvironment: { starType: "K2V" },
    });
    expect(facts.map((f) => f.key)).toContain("starType");
  });

  it("omits unfilled fields rather than emitting blanks", () => {
    expect(extractWorksheetFacts("planetary-profile", {})).toEqual([]);
    expect(
      extractWorksheetFacts("planetary-profile", {
        physicalCharacteristics: { surfaceGravity: "" },
      }),
    ).toEqual([]);
  });

  it("returns nothing for a tool with no mapping", () => {
    expect(extractWorksheetFacts("not-a-real-tool", { a: 1 })).toEqual([]);
  });

  it("survives junk input instead of throwing", () => {
    expect(extractWorksheetFacts("planetary-profile", null)).toEqual([]);
    expect(extractWorksheetFacts("", { a: 1 })).toEqual([]);
    expect(
      extractWorksheetFacts("planetary-profile", { physicalCharacteristics: null }),
    ).toEqual([]);
  });

  it("joins array values into one display string", () => {
    const facts = extractWorksheetFacts("evolutionary-biology", {
      biochemistry: { biochemicalBasis: ["carbon", "silicon"] },
    });
    const fact = facts.find((f) => f.key === "biochemicalBasis");
    expect(fact?.value).toBe("carbon, silicon");
  });

  it("does not emit a container object as a fact", () => {
    const facts = extractWorksheetFacts("planetary-profile", {
      physicalCharacteristics: { surfaceGravity: { nested: 1 } },
    });
    expect(facts.find((f) => f.key === "surfaceGravity")).toBeUndefined();
  });

  it("reads the habitable-zone-calculator star and orbit", () => {
    const facts = extractWorksheetFacts("habitable-zone-calculator", {
      star: { spectralType: "K", mass: 0.8, luminosity: 0.34, temperature: 4800 },
      planet: { orbitalDistance: 0.58, name: "Ashfall", greenhouseWarming: 33 },
    });
    expect(facts).toContainEqual({
      key: "starType",
      label: "Star Type",
      value: "K",
    });
    expect(facts).toContainEqual({
      key: "orbitalDistance",
      label: "Orbital Distance (AU)",
      value: "0.58",
    });
    expect(facts).toContainEqual({
      key: "stellarLuminosity",
      label: "Stellar Luminosity (Sol)",
      value: "0.34",
    });
  });

  it("reads the surface-gravity-calculator primary and advanced inputs", () => {
    const facts = extractWorksheetFacts("surface-gravity-calculator", {
      primary: { mass: 1.8, radius: 1.2, compositionPreset: "iron-rich", planetPreset: "custom", linked: true },
      advanced: { surfaceTemp: 244, molecularWeightPreset: "earth", molecularWeight: 29 },
    });
    expect(facts).toContainEqual({
      key: "mass",
      label: "Mass (Earth masses)",
      value: "1.8",
    });
    expect(facts).toContainEqual({
      key: "radius",
      label: "Radius (Earth radii)",
      value: "1.2",
    });
    expect(facts).toContainEqual({
      key: "composition",
      label: "Composition",
      value: "iron-rich",
    });
    expect(facts).toContainEqual({
      key: "surfaceTemperature",
      label: "Surface Temperature (K)",
      value: "244",
    });
  });

  it("reads the time-dilation journey, drive, and cruise velocity", () => {
    const facts = extractWorksheetFacts("time-dilation", {
      journey: {
        presetCategory: "interstellar",
        presetId: "sol-proxima",
        customDistance: "",
        customDistanceUnit: "ly",
        originName: "Sol",
        destinationName: "Proxima Centauri",
      },
      propulsion: { method: "fusion", customMaxVelocity: "" },
      velocityProfile: { mode: "constant", velocityFraction: "0.1", gForce: "1" },
    });
    expect(facts).toContainEqual({
      key: "propulsionType",
      label: "Propulsion Type",
      value: "fusion",
    });
    expect(facts).toContainEqual({ key: "origin", label: "Origin", value: "Sol" });
    expect(facts).toContainEqual({
      key: "destination",
      label: "Destination",
      value: "Proxima Centauri",
    });
    expect(facts).toContainEqual({
      key: "cruiseVelocity",
      label: "Cruise Velocity (fraction of c)",
      value: "0.1",
    });
  });

  it("reads the drake-equation-calculator civilization longevity", () => {
    const facts = extractWorksheetFacts("drake-equation-calculator", {
      values: { rStar: 1.5, fp: 1, ne: 0.4, fl: 0.5, fi: 0.5, fc: 0.2, L: 10000 },
    });
    expect(facts).toContainEqual({
      key: "civilizationLongevity",
      label: "Civilization Longevity (years)",
      value: "10000",
    });
  });

  it("reads the kardashev-scale energy output and growth rate", () => {
    const facts = extractWorksheetFacts("kardashev-scale", {
      totalPowerWatts: 3.8e26,
      powerLog10: 26.58,
      growthRate: "aggressive",
      civilizationPreset: "dyson-swarm",
    });
    expect(facts).toContainEqual({
      key: "energyOutput",
      label: "Energy Output (Watts)",
      value: String(3.8e26),
    });
    expect(facts).toContainEqual({
      key: "energyGrowthRate",
      label: "Energy Growth Rate",
      value: "aggressive",
    });
  });

  it("reads the species-interaction-matrix synthesis", () => {
    const facts = extractWorksheetFacts("species-interaction-matrix", {
      species: [],
      pairs: [],
      overallEquilibrium: "powder-keg",
      overallTrajectory: "conflict",
      centralConflict: "Two species need the same spawning water.",
    });
    expect(facts).toContainEqual({
      key: "interactionEquilibrium",
      label: "Interaction Equilibrium",
      value: "powder-keg",
    });
    expect(facts).toContainEqual({
      key: "interactionTrajectory",
      label: "Interaction Trajectory",
      value: "conflict",
    });
    expect(facts).toContainEqual({
      key: "centralConflict",
      label: "Central Conflict",
      value: "Two species need the same spawning water.",
    });
  });

  it("never repeats a key even when shared across entity types", () => {
    const facts = extractWorksheetFacts("planetary-profile", {
      physicalCharacteristics: { surfaceGravity: 1.47 },
      stellarEnvironment: { starType: "G2V" },
    });
    expect(new Set(facts.map((f) => f.key)).size).toBe(facts.length);
  });
});

describe("hasFactMapping", () => {
  it("is true for a mapped tool and false for an unmapped one", () => {
    expect(hasFactMapping("planetary-profile")).toBe(true);
    // Simulators persist to simulation_saves, not worksheets, so they are
    // deliberately unmapped here.
    expect(hasFactMapping("rogue")).toBe(false);
  });
});

describe("summarizeFacts", () => {
  it("joins the leading facts for a one-line preview", () => {
    const summary = summarizeFacts([
      { key: "a", label: "Gravity", value: "1.47" },
      { key: "b", label: "Star", value: "K2V" },
      { key: "c", label: "Day", value: "18h" },
      { key: "d", label: "Extra", value: "dropped" },
    ]);
    expect(summary).toBe("Gravity: 1.47 · Star: K2V · Day: 18h");
  });

  it("returns an empty string when there is nothing to show", () => {
    expect(summarizeFacts([])).toBe("");
  });
});
