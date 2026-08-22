import { describe, it, expect } from "vitest";
import { checkContinuity, checkImplausibility, proseToText } from "@/lib/continuity";
import type { WorksheetFact } from "@/lib/worksheet-facts";

// Helpers build facts with keys that are ACTUALLY mapped in entity-config.ts.
// A test keyed to an unmapped field would pass here while the feature could
// never fire in the product.
const fact = (key: string, label: string, value: string): WorksheetFact => ({
  key,
  label,
  value,
});

const gravity = (g: string) => fact("surfaceGravity", "Surface Gravity (g)", g);
const dayLength = (h: string) => fact("dayLength", "Day Length (hours)", h);
const population = (p: string) => fact("population", "Population", p);
const crew = (c: string) => fact("crewSize", "Crew Size", c);
const orbit = (au: string) => fact("orbitalDistance", "Orbital Distance (AU)", au);
const temp = (k: string) => fact("surfaceTemperature", "Surface Temperature (K)", k);

describe("proseToText", () => {
  it("strips tags and decodes the entities TipTap emits", () => {
    expect(proseToText("<p>one&nbsp;two &amp; three</p>")).toBe("one two & three");
  });
  it("is empty for nothing", () => {
    expect(proseToText("")).toBe("");
    expect(proseToText(null)).toBe("");
  });
});

describe("catches explicit contradictions", () => {
  it("flags a gravity claim well outside tolerance", () => {
    const notes = checkContinuity("<p>At 0.4 gravity she moved like a dancer.</p>", [gravity("1.47")]);
    expect(notes).toHaveLength(1);
    expect(notes[0].worldValue).toBe("1.47");
    expect(notes[0].proseValue).toBe("0.4");
    // The message must name both numbers so the writer can judge.
    expect(notes[0].message).toContain("1.47");
    expect(notes[0].message).toContain("0.4");
  });

  it("reads a number that follows the keyword", () => {
    expect(checkContinuity("<p>The gravity of 0.3 crushed nothing.</p>", [gravity("1.47")]))
      .toHaveLength(1);
  });

  it("flags a day length that disagrees", () => {
    expect(checkContinuity("<p>The 40 hour day wore on.</p>", [dayLength("18")])).toHaveLength(1);
  });

  it("flags a crew count that disagrees", () => {
    expect(checkContinuity("<p>All 12 crew were asleep.</p>", [crew("400")])).toHaveLength(1);
  });

  it("flags an orbital distance that disagrees", () => {
    expect(checkContinuity("<p>They fell to 4 AU and held.</p>", [orbit("0.58")])).toHaveLength(1);
  });

  it("includes the offending sentence as context", () => {
    const notes = checkContinuity(
      "<p>She looked up. At 0.2 gravity she drifted upward.</p>",
      [gravity("1.47")],
    );
    expect(notes[0].excerpt).toBe("At 0.2 gravity she drifted upward.");
  });
});

describe("multi-candidate facts — the two-planet world (S-FIX)", () => {
  // Two Planetary Profile worksheets both record "surfaceGravity", so the
  // pooled facts array has two candidates for the same key. Before S-FIX,
  // checkContinuity took whichever sorted first and reported confident,
  // specific, wrong contradictions against a planet the sentence might not
  // even be about.
  const twoPlanets = [gravity("1.47"), gravity("0.3")];

  it("does not fire when the sentence is consistent with at least one candidate", () => {
    // 0.3 matches the second planet exactly. The old code, sorting the first
    // planet (1.47) to the front, would have reported a false contradiction
    // every time. The fix must report nothing here.
    const notes = checkContinuity("<p>At 0.3 gravity she barely felt her own weight.</p>", twoPlanets);
    expect(notes).toHaveLength(0);
  });

  it("fires, and says so, only when the sentence contradicts every candidate", () => {
    const notes = checkContinuity("<p>At 9.8 gravity she was crushed flat.</p>", twoPlanets);
    expect(notes).toHaveLength(1);
    expect(notes[0].message).toBe("CONTRADICTS ALL 2 PLANETS ON FILE.");
    expect(notes[0].worldValue).toBe("1.47 / 0.3");
    expect(notes[0].proseValue).toBe("9.8");
  });

  it("keeps single-candidate behaviour byte-identical", () => {
    // Constraint from the brief: a key with exactly one fact must be
    // unchanged — same math, same message shape as before S-FIX.
    const notes = checkContinuity("<p>At 0.4 gravity she moved like a dancer.</p>", [gravity("1.47")]);
    expect(notes).toHaveLength(1);
    expect(notes[0].message).toBe("Your world records Surface Gravity (g) as 1.47; this reads 0.4.");
  });

  it("a third consistent candidate still suppresses the contradiction", () => {
    const threePlanets = [gravity("1.47"), gravity("9.8"), gravity("0.3")];
    const notes = checkContinuity("<p>At 0.3 gravity she barely felt her own weight.</p>", threePlanets);
    expect(notes).toHaveLength(0);
  });

  it("names the right count when three candidates are all contradicted", () => {
    const threePlanets = [gravity("1.47"), gravity("9.8"), gravity("2.1")];
    const notes = checkContinuity("<p>At 0.3 gravity she barely felt her own weight.</p>", threePlanets);
    expect(notes).toHaveLength(1);
    expect(notes[0].message).toBe("CONTRADICTS ALL 3 PLANETS ON FILE.");
  });

  it("ignores a qualitative (non-numeric) candidate when judging 'every candidate'", () => {
    // A candidate whose value can't be parsed as a number can't be
    // contradicted, so it shouldn't count toward "every candidate agrees"
    // in either direction.
    const mixed = [gravity("1.47"), fact("surfaceGravity", "Surface Gravity (g)", "unknown")];
    const notes = checkContinuity("<p>At 9.8 gravity she was crushed flat.</p>", mixed);
    expect(notes).toHaveLength(1);
    expect(notes[0].message).toBe("Your world records Surface Gravity (g) as 1.47; this reads 9.8.");
  });
});

describe("subject scoping — the two-planet world (S0)", () => {
  // Same two candidates as the S-FIX block above, but now each is tagged
  // with the world_entries id of the planet its worksheet is linked to.
  const planetA = "11111111-1111-1111-1111-111111111111";
  const planetB = "22222222-2222-2222-2222-222222222222";
  const gravityFor = (subjectId: string, g: string): WorksheetFact => ({
    ...gravity(g),
    subject_id: subjectId,
  });
  const twoPlanets = [gravityFor(planetA, "1.47"), gravityFor(planetB, "0.3")];

  it("scoped to planet A, only planet A's value is checked", () => {
    // 0.3 is planet B's number, not A's — scoped to A this must contradict,
    // even though the old pooled check would have stayed silent because SOME
    // candidate (B) agrees.
    const notes = checkContinuity("<p>At 0.3 gravity she barely felt her own weight.</p>", twoPlanets, planetA);
    expect(notes).toHaveLength(1);
    expect(notes[0].worldValue).toBe("1.47");
    expect(notes[0].message).toBe("Your world records Surface Gravity (g) as 1.47; this reads 0.3.");
  });

  it("scoped to planet B, only planet B's value is checked", () => {
    // Same facts, opposite subject: the two calls must disagree with each
    // other, because they're each about a different planet.
    const notes = checkContinuity("<p>At 0.3 gravity she barely felt her own weight.</p>", twoPlanets, planetB);
    expect(notes).toHaveLength(0);
  });

  it("a scoped match never uses the ambiguous-plural phrasing", () => {
    const notes = checkContinuity("<p>At 9.8 gravity she was crushed flat.</p>", twoPlanets, planetA);
    expect(notes).toHaveLength(1);
    expect(notes[0].message).not.toContain("ON FILE");
  });

  it("falls back to the S-FIX universal rule when nothing on file has this subject", () => {
    // subjectId doesn't match any candidate's subject_id, and neither
    // candidate is unscoped (null) either — nothing to check against, so
    // this must stay silent rather than guessing.
    const stranger = "33333333-3333-3333-3333-333333333333";
    const notes = checkContinuity("<p>At 9.8 gravity she was crushed flat.</p>", twoPlanets, stranger);
    expect(notes).toHaveLength(0);
  });

  it("an unlinked (subject-less) fact still participates in a scoped check as a fallback", () => {
    const unlinked = [fact("surfaceGravity", "Surface Gravity (g)", "1.47")]; // subject_id undefined
    const notes = checkContinuity("<p>At 9.8 gravity she was crushed flat.</p>", unlinked, planetA);
    expect(notes).toHaveLength(1);
    expect(notes[0].message).toBe("Your world records Surface Gravity (g) as 1.47; this reads 9.8.");
  });

  it("omitting subjectId keeps the unscoped S-FIX behaviour byte-identical", () => {
    const notes = checkContinuity("<p>At 9.8 gravity she was crushed flat.</p>", twoPlanets);
    expect(notes).toHaveLength(1);
    expect(notes[0].message).toBe("CONTRADICTS ALL 2 PLANETS ON FILE.");
  });
});

describe("scale words — the loosest figures in fiction", () => {
  it("treats spelled billions as the same magnitude as the recorded digits", () => {
    // 8.7e9 recorded vs "nine billion" written: a writer rounding, not an error.
    expect(checkContinuity("<p>Nine billion people lived there.</p>", [population("8700000000")]))
      .toEqual([]);
  });

  it("still flags a population off by orders of magnitude", () => {
    const notes = checkContinuity("<p>Twelve thousand citizens remained.</p>", [population("9 billion")]);
    expect(notes).toHaveLength(1);
  });

  it("matches a recorded value that itself uses a scale word", () => {
    expect(checkContinuity("<p>Two billion inhabitants.</p>", [population("2 billion")])).toEqual([]);
  });
});

describe("stays quiet when it should", () => {
  it("agrees, so says nothing", () => {
    expect(checkContinuity("<p>At 1.47 gravity every step cost her.</p>", [gravity("1.47")])).toEqual([]);
  });

  it("does not fire when prose mentions the concept without quantifying it", () => {
    expect(checkContinuity("<p>The gravity felt wrong.</p>", [gravity("1.47")])).toEqual([]);
    expect(checkContinuity("<p>The crew slept.</p>", [crew("400")])).toEqual([]);
  });

  it("tolerates prose rounding a measurement", () => {
    // "about 1.5 g" for a recorded 1.47 is the writer being human.
    expect(checkContinuity("<p>About 1.5 gravity, give or take.</p>", [gravity("1.47")])).toEqual([]);
    expect(checkContinuity("<p>A 19 hour day.</p>", [dayLength("18")])).toEqual([]);
  });

  it("is silent with no facts or no prose", () => {
    expect(checkContinuity("<p>At 9 gravity.</p>", [])).toEqual([]);
    expect(checkContinuity("", [gravity("1.47")])).toEqual([]);
    expect(checkContinuity(null, [gravity("1.47")])).toEqual([]);
  });

  it("ignores a qualitative value it cannot compare numerically", () => {
    expect(checkContinuity("<p>At 0.2 gravity she drifted.</p>", [gravity("crushing")])).toEqual([]);
  });

  it("ignores a fact whose key no check targets", () => {
    const unchecked = fact("biochemicalBasis", "Biochemical Basis", "silicon");
    expect(checkContinuity("<p>Three silicon forms.</p>", [unchecked])).toEqual([]);
  });

  it("reports each fact at most once, however often it is contradicted", () => {
    const notes = checkContinuity(
      "<p>At 0.2 gravity. Later 0.3 gravity. Then 0.4 gravity.</p>",
      [gravity("1.47")],
    );
    expect(notes).toHaveLength(1);
  });

  it("handles several different facts independently", () => {
    const notes = checkContinuity(
      "<p>At 0.3 gravity she jumped. The 40 hour day dragged.</p>",
      [gravity("1.47"), dayLength("18")],
    );
    expect(notes.map((n) => n.factKey).sort()).toEqual(["dayLength", "surfaceGravity"]);
  });

  it("does not crash on junk prose", () => {
    expect(() => checkContinuity("<<<>>> &&& 12345", [gravity("1.47")])).not.toThrow();
  });

  it("handles a recorded value in scientific notation", () => {
    // Kardashev energy output is stored as 3.8e26; parsing it as 3.8 would make
    // every mention of it look like a contradiction.
    const notes = checkContinuity("<p>At 273 kelvin the air held.</p>", [temp("273")]);
    expect(notes).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tier 2 — physical implausibility
// ---------------------------------------------------------------------------

describe("checkImplausibility", () => {
  it("flags a sunrise on a tidally locked world", () => {
    const notes = checkImplausibility(
      "<p>She watched the sunrise over the ridge.</p>",
      ["rotation-locked"],
    );
    expect(notes).toHaveLength(1);
    expect(notes[0].message).toContain("tidally locked");
    // The note must explain WHY, not just object.
    expect(notes[0].message).toContain("never rises");
    expect(notes[0].excerpt).toBe("She watched the sunrise over the ridge.");
  });

  it("flags effortless leaping under high gravity", () => {
    const notes = checkImplausibility("<p>He leapt the fence easily.</p>", ["gravity-high"]);
    expect(notes).toHaveLength(1);
    expect(notes[0].proseValue).toBe("leapt");
  });

  it("flags crushing weight under low gravity", () => {
    expect(checkImplausibility("<p>A crushing weight held her down.</p>", ["gravity-low"]))
      .toHaveLength(1);
  });

  it("flags sunlight on a starless rogue planet", () => {
    expect(checkImplausibility("<p>Sunlight caught the ice.</p>", ["stellar-rogue"]))
      .toHaveLength(1);
  });

  it("flags turning seasons on a world with no tilt", () => {
    expect(checkImplausibility("<p>Then autumn came early.</p>", ["tilt-none"]))
      .toHaveLength(1);
  });

  it("says nothing when the world never recorded that driver", () => {
    // Same prose, but the world is not tidally locked, so there is no conflict.
    expect(checkImplausibility("<p>She watched the sunrise.</p>", ["gravity-high"])).toEqual([]);
    expect(checkImplausibility("<p>She watched the sunrise.</p>", [])).toEqual([]);
  });

  it("says nothing when the prose does not contradict the driver", () => {
    expect(checkImplausibility("<p>The terminator glowed red.</p>", ["rotation-locked"])).toEqual([]);
    expect(checkImplausibility("<p>Every step cost her.</p>", ["gravity-high"])).toEqual([]);
  });

  it("is silent with no prose", () => {
    expect(checkImplausibility("", ["rotation-locked"])).toEqual([]);
    expect(checkImplausibility(null, ["rotation-locked"])).toEqual([]);
  });

  it("reports each driver at most once", () => {
    const notes = checkImplausibility(
      "<p>The sunrise. Later the sunset. Then dawn broke again.</p>",
      ["rotation-locked"],
    );
    expect(notes).toHaveLength(1);
  });

  it("handles several drivers independently", () => {
    const notes = checkImplausibility(
      "<p>He leapt easily as the sunrise lit the ridge.</p>",
      ["gravity-high", "rotation-locked"],
    );
    expect(notes.map((n) => n.factKey).sort()).toEqual(["gravity-high", "rotation-locked"]);
  });

  it("does not crash on junk", () => {
    expect(() => checkImplausibility("<<>> &&&", ["gravity-high"])).not.toThrow();
  });
});
