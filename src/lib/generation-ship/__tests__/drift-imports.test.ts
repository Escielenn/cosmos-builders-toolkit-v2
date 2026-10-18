import { describe, it, expect } from "vitest";
import {
  INITIAL_GENSHIP_STATE,
  computeGenShip,
  normalizeGenShipState,
  type GenShipFormState,
} from "../calculations";
import { buildDriftEvents, chronicleYear, hashString, mulberry32 } from "../drift-events";
import {
  applyPatch,
  parseFractionOfC,
  parseG,
  readGravitas,
  readPhylo,
  readPropulsion,
  readSpacecraft,
  readTimeDilation,
} from "../imports";
import { buildGenShipMarkdown } from "../markdown";

function form(patch: (f: GenShipFormState) => void = () => {}): GenShipFormState {
  const f = normalizeGenShipState(JSON.parse(JSON.stringify(INITIAL_GENSHIP_STATE)));
  patch(f);
  return f;
}

describe("drift events", () => {
  it("are deterministic for the same inputs", () => {
    const f = form((x) => { x.identity.shipName = "Long Patience"; });
    const a = buildDriftEvents(f, computeGenShip(f));
    const b = buildDriftEvents(f, computeGenShip(f));
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(5);
  });

  it("keep milestone ids stable when only the name changes", () => {
    const a = form((x) => { x.identity.shipName = "Long Patience"; });
    const b = form((x) => { x.identity.shipName = "Second Chance"; });
    const idsA = buildDriftEvents(a, computeGenShip(a)).filter((e) => e.kind === "milestone").map((e) => e.id);
    const idsB = buildDriftEvents(b, computeGenShip(b)).filter((e) => e.kind === "milestone").map((e) => e.id);
    expect(idsA).toEqual(idsB);
  });

  it("run from launch to arrival in order, inside the voyage", () => {
    const f = form();
    const r = computeGenShip(f);
    const ev = buildDriftEvents(f, r);
    expect(ev[0].id).toBe("launch");
    expect(ev[ev.length - 1].id).toBe("arrival");
    for (let i = 1; i < ev.length; i++) expect(ev[i].shipYear).toBeGreaterThanOrEqual(ev[i - 1].shipYear);
    for (const e of ev) {
      expect(e.shipYear).toBeGreaterThanOrEqual(0);
      expect(e.shipYear).toBeLessThanOrEqual(r.voyage.shipYears + 1e-9);
      expect(e.generation).toBeGreaterThanOrEqual(1);
    }
  });

  it("include the physics-forced milestones when their thresholds are crossed", () => {
    const f = form((x) => {
      x.population.founding = 100;
      x.voyage.distanceLy = 10;
      x.lifeSupport.airEfficiencyPct = 99;
      x.lifeSupport.waterEfficiencyPct = 100;
      x.lifeSupport.foodEfficiencyPct = 100;
    });
    const ids = buildDriftEvents(f, computeGenShip(f)).map((e) => e.id);
    expect(ids).toContain("f-first-cousin");
    expect(ids).toContain("f-danger");
    expect(ids).toContain("reserve-exhausted:air");
    expect(ids).toContain("last-homeborn");
  });

  it("omit thresholds that are never crossed", () => {
    const f = form((x) => { x.population.founding = 100000; });
    const ids = buildDriftEvents(f, computeGenShip(f)).map((e) => e.id);
    expect(ids).not.toContain("f-danger");
  });

  it("date events in the home calendar from the launch year", () => {
    const f = form((x) => { x.identity.launchYear = 2400; });
    const ev = buildDriftEvents(f, computeGenShip(f));
    const arrival = ev.find((e) => e.id === "arrival")!;
    expect(chronicleYear(2400, arrival)).toBe(2400 + Math.round(arrival.earthYear));
    expect(chronicleYear(2400, ev[0])).toBe(2400);
  });

  it("produce nothing for an unresolved voyage", () => {
    const f = form((x) => { x.voyage.distanceLy = 0; });
    expect(buildDriftEvents(f, computeGenShip(f))).toEqual([]);
  });

  it("seeds a stable PRNG", () => {
    const a = mulberry32(hashString("ark"));
    const b = mulberry32(hashString("ark"));
    const xs = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(xs);
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe("import parsers", () => {
  it("parse a speed only when it is stated as a fraction of c", () => {
    expect(parseFractionOfC("0.08c")).toBe(0.08);
    expect(parseFractionOfC("0.08 c")).toBe(0.08);
    expect(parseFractionOfC("8% c")).toBe(0.08);
    expect(parseFractionOfC("8% of light")).toBe(0.08);
    expect(parseFractionOfC("0.1")).toBe(0.1);
    expect(parseFractionOfC("fast")).toBeNull();
    expect(parseFractionOfC("30 km/s")).toBeNull();
    expect(parseFractionOfC("2c")).toBeNull();
  });

  it("parse g only with the unit", () => {
    expect(parseG("0.3 g")).toBe(0.3);
    expect(parseG("1G")).toBe(1);
    expect(parseG("3 m/s²")).toBeNull();
  });

  it("read Paradox through its own engine", () => {
    const patch = readTimeDilation({
      journey: {
        presetCategory: "custom",
        presetId: "",
        customDistance: "11.9",
        customDistanceUnit: "ly",
        originName: "Sol",
        destinationName: "Tau Ceti",
      },
      propulsion: { method: "custom", customMaxVelocity: "0.05" },
      velocityProfile: { mode: "constant", velocityFraction: "0.02", gForce: "1" },
      referenceFrame: { frame: "earth", customName: "" },
      roundTrip: false,
      alcubierreNoDilation: true,
    });
    expect(patch["voyage.distanceLy"]).toBeCloseTo(11.9, 4);
    expect(patch["voyage.cruiseFractionC"]).toBeCloseTo(0.02, 6);
    expect(patch["voyage.accelG"]).toBe(0);
    expect(patch["identity.destinationName"]).toBe("Tau Ceti");
  });

  it("import nothing from an unusable Paradox worksheet", () => {
    expect(readTimeDilation({})).toEqual({});
    expect(readTimeDilation(null)).toEqual({});
  });

  it("read Impulse, Vessel, Phylo and Gravitas", () => {
    expect(readPropulsion({ system: { maxVelocity: "0.08c", acceleration: "0.3 g" } })).toEqual({
      "voyage.cruiseFractionC": 0.08,
      "voyage.accelG": 0.3,
    });
    expect(readPropulsion({ system: { maxVelocity: "very fast" } })).toEqual({});
    expect(readSpacecraft({ identity: { name: "Long Patience", origin: "Ceres yards" } })).toEqual({
      "identity.shipName": "Long Patience",
      "identity.originName": "Ceres yards",
    });
    expect(readPhylo({ speciesName: "Verrid", reproduction: { lifespan: "long", matingSystem: "polygynous" } })).toEqual({
      "identity.speciesName": "Verrid",
      "population.generationYears": 100,
      "population.lifespanYears": 300,
      "population.femalePct": 75,
      "population.familySizeVariance": 5,
    });
    expect(readGravitas({ spin: { radius_m: 900, rotation_rpm: 1 } })).toEqual({
      "habitat.radiusM": 900,
      "habitat.rpm": 1,
    });
  });

  it("apply a patch at dot paths without touching the original", () => {
    const f = form();
    const next = applyPatch(f, { "voyage.distanceLy": 12, "identity.shipName": "Ark" });
    expect(next.voyage.distanceLy).toBe(12);
    expect(next.identity.shipName).toBe("Ark");
    expect(f.voyage.distanceLy).toBe(4.24);
  });
});

describe("markdown export", () => {
  it("carries the headline numbers, the sources and the events", () => {
    const f = form((x) => {
      x.identity.shipName = "Long Patience";
      x.notes.shipboardLife = "<p>The gardens never sleep.</p>";
    });
    const r = computeGenShip(f);
    const md = buildGenShipMarkdown(f, r, buildDriftEvents(f, r), "Kepler Reach");
    expect(md).toContain("# Long Patience");
    expect(md).toContain("Kepler Reach");
    expect(md).toContain("Effective population (Ne): 500");
    expect(md).toContain("Smith 2014");
    expect(md).toContain("NASA BVAD");
    expect(md).toContain("## Drift events");
    expect(md).toContain("The gardens never sleep.");
    expect(md).not.toContain("<p>");
  });
});
