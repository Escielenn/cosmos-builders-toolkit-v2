import { describe, expect, it } from "vitest";
import {
  claimHash,
  claimValueText,
  createCaptureCache,
  detectParagraph,
  detectParagraphs,
  sentenceSpans,
  type Paragraph,
  type RawClaim,
} from "@/lib/writing/capture/detect";

const p = (text: string, mentions: Paragraph["mentions"] = [], blocked: Paragraph["blocked"] = []): Paragraph => ({
  text,
  mentions,
  blocked,
});

const one = (text: string): RawClaim => {
  const cs = detectParagraph(p(text));
  expect(cs, text).toHaveLength(1);
  return cs[0];
};

const none = (text: string) => expect(detectParagraph(p(text)), text).toEqual([]);

const near = (v: number | string, want: number, eps = 1e-6) =>
  expect(Math.abs(Number(v) - want)).toBeLessThan(eps * Math.max(1, Math.abs(want)));

describe("sentenceSpans", () => {
  it("splits on terminal punctuation, never inside a decimal", () => {
    const t = "Gravity was 1.4 g. The sky was red! Was it?";
    expect(sentenceSpans(t).map((s) => t.slice(s.start, s.end))).toEqual([
      "Gravity was 1.4 g.",
      "The sky was red!",
      "Was it?",
    ]);
  });
});

describe("true positives", () => {
  it("gravity in g, gees, and times Earth", () => {
    let c = one("The planet held her at 1.6 g of gravity.");
    expect(c.predicate).toBe("planet.surface_gravity");
    near(c.value, 1.6);
    expect(c.unit).toBe("g");
    near(c.halfStep, 0.05);

    c = one("Surface gravity here is two gees.");
    near(c.value, 2);

    c = one("It weighed on them: one and a half times Earth gravity.");
    near(c.value, 1.5);

    c = one("Its gravity was 9.8 m/s² at the equator.");
    near(c.value, 1, 1e-3);
  });

  it("day length", () => {
    let c = one("On this planet a 26-hour day felt endless.");
    expect(c.predicate).toBe("planet.rotation_period");
    near(c.value, 26);
    c = one("Its day lasts thirty hours.");
    near(c.value, 30);
    c = one("The world rotates once every 19.5 hours.");
    near(c.value, 19.5);
  });

  it("year length in local days, orbital period in standard units", () => {
    let c = one("The year lasts 400 days.");
    expect(c.predicate).toBe("planet.year_length");
    expect(c.unit).toBe("local_days");
    near(c.value, 400);

    c = one("A year here is 1.3 standard years.");
    expect(c.predicate).toBe("orbit.period");
    expect(c.unit).toBe("days");
    near(c.value, 1.3 * 365.25);

    c = one("It orbits its star every 88 days.");
    expect(c.predicate).toBe("orbit.period");
    near(c.value, 88);
  });

  it("spectral class from words and classes", () => {
    let c = one("Kellis Prime orbits a dim red dwarf.");
    expect(c.predicate).toBe("star.spectral_class");
    expect(c.value).toBe("M");
    expect(c.kind).toBe("enum");
    c = one("They circled an M4V star for a decade.");
    expect(c.value).toBe("M4V");
    c = one("The colony orbits a G-type star.");
    expect(c.value).toBe("G");
    c = one("It orbits an orange dwarf.");
    expect(c.value).toBe("K");
  });

  it("crew size", () => {
    let c = one("The Meridian carried a crew of 400.");
    expect(c.predicate).toBe("vessel.crew_size");
    near(c.value, 400);
    c = one("A crew of forty kept her flying.");
    near(c.value, 40);
    c = one("She was crewed by twelve.");
    near(c.value, 12);
    c = one("A 300-strong crew slept below.");
    near(c.value, 300);
    c = one("A crew of about 400 slept below.");
    expect(c.approx).toBe(true);
  });

  it("axial tilt, pressure, temperature", () => {
    let c = one("An axial tilt of 23 degrees gave it seasons.");
    expect(c.predicate).toBe("planet.obliquity");
    near(c.value, 23);
    c = one("The air was thin, 0.6 bar at the surface.");
    expect(c.predicate).toBe("planet.atmo_pressure");
    near(c.value, 0.6);
    c = one("The surface pressure was two atmospheres.");
    near(c.value, 2.0265, 1e-4);
    c = one("The mean temperature was 15 °C.");
    expect(c.predicate).toBe("planet.temp_mean");
    near(c.value, 288.15);
    c = one("Its average surface temperature hovered around minus 40 degrees Celsius.");
    near(c.value, 233.15);
  });

  it("radius, mass, orbit, star mass", () => {
    let c = one("At 1.2 Earth radii it was only a little larger.");
    expect(c.predicate).toBe("planet.radius");
    near(c.value, 1.2);
    c = one("A world of 3.5 Earth masses.");
    expect(c.predicate).toBe("planet.mass");
    near(c.value, 3.5);
    c = one("It orbits at 0.8 AU from its star.");
    expect(c.predicate).toBe("orbit.semi_major_axis");
    near(c.value, 0.8);
    c = one("The star weighs in at 0.3 solar masses.");
    expect(c.predicate).toBe("star.mass");
  });

  it("height, with a mile and a half", () => {
    const c = one("The Spires rise a mile and a half through the cloud deck.");
    expect(c.ruleId).toBe("height");
    expect(c.predicate).toBeNull();
    expect(c.namedOnly).toBe(true);
    near(c.value, 1.5 * 1609.344);
    const d = one("She stood two meters tall.");
    near(d.value, 2);
  });

  it("population, lifespan, star age, cruise", () => {
    let c = one("The city had a population of nine billion.");
    expect(c.predicate).toBe("place.population");
    near(c.value, 9e9);
    near(c.halfStep, 0.5e9);
    c = one("Kellis was home to 12 million souls.");
    near(c.value, 1.2e7);

    c = one("Their lifespan is 300 years.");
    expect(c.predicate).toBe("species.lifespan");
    expect(c.unit).toBe("local_years");
    near(c.value, 300);

    c = one("The star is 4.6 billion years old.");
    expect(c.predicate).toBe("star.age");
    near(c.value, 4.6);
    expect(c.namedOnly).toBe(true);

    c = one("The ship could cruise at 0.2 c.");
    expect(c.predicate).toBe("propulsion.cruise_fraction_c");
    near(c.value, 0.2);
    c = one("They traveled at a tenth of lightspeed.");
    near(c.value, 0.1);
    c = one("They traveled at 15% of lightspeed.");
    near(c.value, 0.15);
  });

  it("records where the claim sits and its sentence", () => {
    const text = "Rain fell. The planet held her at 1.6 g of gravity. Nobody moved.";
    const [c] = detectParagraph(p(text));
    expect(text.slice(c.start, c.end)).toBe(c.match);
    expect(c.sentence).toBe("The planet held her at 1.6 g of gravity.");
    expect(c.sentenceStart).toBe(11);
  });
});

describe("false positives (each of these must stay silent)", () => {
  it.each([
    "She added 5 g of sugar to the tea.",
    "The engines burned at two gees for an hour.",
    "After a 12-hour day in the mines she slept.",
    "Two crewmen ran for the lock.",
    "Three citizens stepped forward.",
    "He tilted his head 30 degrees.",
    "They pressed two bars of gold into her hand.",
    "The cabin held at 0.8 atm.",
    "She stood three meters away.",
    "It took two days to reach the ridge.",
    "The year was 2340.",
    "The blast radius of 50 km swallowed the valley.",
    "She lived ten years in exile.",
    "Mira is 34 years old.",
    "He walked 3 miles to the station.",
    "A crew of shuttles waited.",
    "The temperature fell to 5 degrees.",
  ])("%s", (text) => {
    const cs = detectParagraph(p(text));
    // namedOnly claims are kept for binding, which drops them without a
    // named subject; everything else must not fire at all.
    expect(cs.filter((c) => !c.namedOnly)).toEqual([]);
  });

  it("never reads a cited fact-ref or a number inside a name", () => {
    const text = "Gravity on Kepler-442b was 1.4 g.";
    const mention = { id: "e1", start: 11, end: 22 };
    // The value is a cited fact (fenced): nothing to propose.
    const factAt = text.indexOf("1.4 g");
    expect(detectParagraph(p(text, [mention], [{ start: factAt, end: factAt + 5 }]))).toEqual([]);
    // Unfenced, the claim is read and the name's digits are not.
    const cs = detectParagraph(p(text, [mention]));
    expect(cs).toHaveLength(1);
    near(cs[0].value, 1.4);
  });

  it("returns nothing for text with no numbers or star words", () => {
    none("The wind moved over the grass and nobody spoke.");
  });
});

describe("display and identity", () => {
  it("formats claim values with units", () => {
    expect(claimValueText({ value: 1.6, unit: "g" })).toBe("1.6 g");
    expect(claimValueText({ value: 400, unit: "individuals" })).toBe("400");
    expect(claimValueText({ value: "M", unit: null })).toBe("M");
    expect(claimValueText({ value: 9e9, unit: "individuals" })).toBe("9e+9");
  });

  it("hashes are stable and sentence-scoped", () => {
    const a = one("The planet held her at 1.6 g of gravity.");
    const b = one("The  planet held her at 1.6 g of GRAVITY.");
    const c = one("The planet held him at 1.6 g of gravity.");
    expect(claimHash(a, a.predicate)).toBe(claimHash(b, b.predicate));
    expect(claimHash(a, a.predicate)).not.toBe(claimHash(c, c.predicate));
  });
});

describe("incremental detection", () => {
  it("reads each paragraph once per signature", () => {
    const cache = createCaptureCache();
    const paras = [p("Gravity was 1.4 g."), p("Nothing here."), p("A crew of 400 slept.")];
    const first = detectParagraphs(paras, cache);
    expect(first.map((x) => x.length)).toEqual([1, 0, 1]);
    expect(cache.misses).toBe(3);
    detectParagraphs(paras, cache);
    expect(cache.misses).toBe(3);
    const edited = [paras[0], p("Nothing here at all."), paras[2]];
    detectParagraphs(edited, cache);
    expect(cache.misses).toBe(4);
  });
});
