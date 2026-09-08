// ---------------------------------------------------------------------------
// G2 — materials and canon binding.
//
// The test Brief G2 names: "render Kellis Prime, then change atmo_pressure to
// 1.4 in canon and screenshot again. The rim must visibly thicken. That's the
// whole point." A screenshot needs a GPU; the assertion behind it does not, so
// the thickening is pinned here as a pure function of pressure.
//
// The other rule under test: bind/ produces UNIFORMS, never FACTS. A render
// may infer a colour from a spectral class; nothing may write that back as a
// temperature the writer never chose.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  SPECTRAL_CLASS_KELVIN,
  coronaAmplitude,
  kelvinToRGB,
  limbDarkening,
  spectralClassKelvin,
} from "@/gl/materials/blackbody";
import {
  atmosphereUniforms,
  rimThickness,
  terminatorSoftness,
} from "@/gl/materials/atmosphere";
import { surfaceUniforms } from "@/gl/materials/surface";
import { bindPlanet, bindStar, bindingNotes } from "@/gl/bind";
import type { WorldEntry } from "@/services/world-data";

function entry(facts: Record<string, number | string>): WorldEntry {
  return {
    id: "e1",
    world_id: "w",
    entry_type: "planet",
    title: "Kellis Prime",
    content: null,
    metadata: {
      _published_facts: Object.entries(facts).map(([predicate, value]) => ({
        predicate,
        label: predicate,
        value,
      })),
    },
    sort_order: 0,
    parent_id: null,
    icon: null,
    color: null,
    tool_source: null,
    tool_data_id: null,
    layer: null,
    cover_image_url: null,
    tags: [],
    created_by: "u",
    created_at: "",
    updated_at: "",
  } as WorldEntry;
}

// ---------------------------------------------------------------------------
// Black body
// ---------------------------------------------------------------------------

describe("kelvinToRGB — the writer sees the class before reading it", () => {
  const hue = (k: number) => {
    const c = kelvinToRGB(k);
    return c.r - c.b;
  };

  it("makes cool stars red and hot stars blue", () => {
    // An M-dwarf is redder than the Sun, which is redder than an O-star.
    expect(hue(3200)).toBeGreaterThan(hue(5700));
    expect(hue(5700)).toBeGreaterThan(hue(18000));
    expect(hue(18000)).toBeLessThan(0);
  });

  it("keeps every channel inside the unit range", () => {
    for (const k of [500, 1000, 3200, 5700, 12000, 40000, 90000]) {
      const c = kelvinToRGB(k);
      for (const ch of [c.r, c.g, c.b]) {
        expect(ch).toBeGreaterThanOrEqual(0);
        expect(ch).toBeLessThanOrEqual(1);
      }
    }
  });

  it("clamps rather than extrapolating into imaginary colours", () => {
    expect(kelvinToRGB(-100)).toEqual(kelvinToRGB(1000));
    expect(kelvinToRGB(1e9)).toEqual(kelvinToRGB(40000));
  });

  it("gives each spectral class a distinguishable colour", () => {
    const seen = new Set(
      Object.values(SPECTRAL_CLASS_KELVIN).map((k) => {
        const c = kelvinToRGB(k);
        return `${c.r.toFixed(2)}|${c.g.toFixed(2)}|${c.b.toFixed(2)}`;
      }),
    );
    expect(seen.size).toBe(Object.keys(SPECTRAL_CLASS_KELVIN).length);
  });
});

describe("spectralClassKelvin", () => {
  it("reads the leading letter of a full class", () => {
    expect(spectralClassKelvin("K4V")).toBe(SPECTRAL_CLASS_KELVIN.K);
    expect(spectralClassKelvin("g2v")).toBe(SPECTRAL_CLASS_KELVIN.G);
  });

  it("is null for a class nobody wrote down", () => {
    expect(spectralClassKelvin(null)).toBeNull();
    expect(spectralClassKelvin("")).toBeNull();
    expect(spectralClassKelvin("Zeta")).toBeNull();
  });
});

describe("limbDarkening — the fix for the proof clipping to white", () => {
  it("darkens cooler stars more, so an M-dwarf survives bloom as red", () => {
    expect(limbDarkening(3200)).toBeGreaterThan(limbDarkening(18000));
  });

  it("stays inside a sane range at every temperature", () => {
    for (const k of [1000, 5700, 40000]) {
      expect(limbDarkening(k)).toBeGreaterThan(0.4);
      expect(limbDarkening(k)).toBeLessThanOrEqual(0.9);
    }
  });
});

describe("coronaAmplitude", () => {
  it("draws an unmeasured star calm, not average", () => {
    // An unmeasured star must not look as though someone found it violent.
    expect(coronaAmplitude(null)).toBeLessThan(0.5);
    expect(coronaAmplitude(undefined)).toBe(coronaAmplitude(null));
  });

  it("clamps into 0..1", () => {
    expect(coronaAmplitude(5)).toBe(1);
    expect(coronaAmplitude(-2)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Atmosphere — the graded test
// ---------------------------------------------------------------------------

describe("atmosphere", () => {
  it("THICKENS THE RIM when pressure rises — the whole point of G2", () => {
    const thin = rimThickness(0.6);
    const thick = rimThickness(1.4);
    expect(thick).toBeGreaterThan(thin);
    // And visibly so, not by a rounding error.
    expect(thick - thin).toBeGreaterThan(0.002);
  });

  it("separates Mars from Earth, which is the distinction that matters", () => {
    // A linear map would make these visually identical while blowing Venus up
    // to a hundred times Earth's rim.
    expect(rimThickness(1) - rimThickness(0.006)).toBeGreaterThan(0.005);
    expect(rimThickness(92)).toBeLessThan(rimThickness(1) * 3);
  });

  it("gives an airless body a hard limb, not a faint glow", () => {
    for (const p of [0, -1, Number.NaN, null, undefined]) {
      const a = atmosphereUniforms("N2", p as number);
      expect(a.present).toBe(false);
      expect(a.thickness).toBe(0);
      expect(a.terminatorSoftness).toBe(0);
    }
  });

  it("colours the rim by composition", () => {
    const co2 = atmosphereUniforms("96% CO2", 1);
    const n2 = atmosphereUniforms("N2/O2", 1);
    const ch4 = atmosphereUniforms("methane haze", 1);
    expect(co2.colour).not.toEqual(n2.colour);
    expect(ch4.colour).not.toEqual(n2.colour);
    // Nitrogen–oxygen reads blue: more blue than red.
    expect(n2.colour.b).toBeGreaterThan(n2.colour.r);
    // CO2 reads amber: more red than blue.
    expect(co2.colour.r).toBeGreaterThan(co2.colour.b);
  });

  it("still draws a shell when pressure is known but composition is not", () => {
    // The pressure is the fact; a neutral haze is honest about the rest.
    const a = atmosphereUniforms(null, 0.8);
    expect(a.present).toBe(true);
    expect(a.thickness).toBeGreaterThan(0);
    expect(a.label).toBe("unspecified");
  });

  it("softens the terminator as the air thickens", () => {
    expect(terminatorSoftness(1.4)).toBeGreaterThan(terminatorSoftness(0.6));
  });
});

// ---------------------------------------------------------------------------
// Surface
// ---------------------------------------------------------------------------

describe("surface", () => {
  it("DOES NOT ROTATE a tidally locked world", () => {
    // Its terminator is geography — the band where everything lives.
    expect(surfaceUniforms("rock", 0.3, true).spin).toBe(0);
    expect(surfaceUniforms("rock", 0.3, false).spin).toBeGreaterThan(0);
  });

  it("keys its look to the surface type", () => {
    const ocean = surfaceUniforms("ocean world", 0.3, false);
    const desert = surfaceUniforms("arid desert", 0.3, false);
    expect(ocean.colour).not.toEqual(desert.colour);
    expect(ocean.roughness).toBeLessThan(desert.roughness);
  });

  it("renders an unknown surface as unremarkable grey rather than guessing", () => {
    const unknown = surfaceUniforms("cheese", 0.3, false);
    expect(unknown.label).toBe("unspecified");
    expect(Math.abs(unknown.colour.r - unknown.colour.b)).toBeLessThan(0.1);
  });

  it("clamps albedo to a reflectance, since values outside 0..1 are bad data", () => {
    expect(surfaceUniforms("rock", 4, false).albedo).toBe(1);
    expect(surfaceUniforms("rock", -1, false).albedo).toBe(0);
    expect(surfaceUniforms("rock", null, false).albedo).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// bind/ — uniforms, never facts
// ---------------------------------------------------------------------------

describe("bindStar", () => {
  it("uses a measured temperature when one is on file", () => {
    const s = bindStar(entry({ "star.temp_effective": 4400 }));
    expect(s.temperature).toEqual({ value: 4400, derived: false });
  });

  it("INFERS a temperature from the class, and marks it derived", () => {
    const s = bindStar(entry({ "star.spectral_class": "K4V" }));
    expect(s.temperature.value).toBe(SPECTRAL_CLASS_KELVIN.K);
    expect(s.temperature.derived).toBe(true);
    // The note is what stops a caller displaying it as a fact.
    expect(s.temperature.note).toMatch(/not a fact/i);
  });

  it("prefers the measured value over the class when both exist", () => {
    const s = bindStar(
      entry({ "star.temp_effective": 4100, "star.spectral_class": "K4V" }),
    );
    expect(s.temperature).toEqual({ value: 4100, derived: false });
  });

  it("renders a star with nothing on file neutrally, and says so", () => {
    const s = bindStar(entry({}));
    expect(s.temperature.derived).toBe(true);
    expect(bindingNotes(s).join(" ")).toMatch(/nothing here is a claim/i);
  });
});

describe("bindPlanet", () => {
  it("binds the Kellis Prime case from the brief", () => {
    const p = bindPlanet(
      entry({
        "planet.atmo_pressure": 0.6,
        "planet.atmo_composition": "N2/CO2",
        "orbit.tidally_locked": "true",
        "planet.surface_type": "rock",
        "planet.albedo": 0.25,
      }),
    );
    expect(p.atmosphere.present).toBe(true);
    expect(p.tidallyLocked.value).toBe(true);
    expect(p.surface.spin).toBe(0);
  });

  it("thickens the rim when canon changes 0.6 → 1.4, and nothing else moves", () => {
    const facts = {
      "planet.atmo_composition": "N2/CO2",
      "orbit.tidally_locked": "true",
      "planet.surface_type": "rock",
      "planet.albedo": 0.25,
    };
    const before = bindPlanet(entry({ ...facts, "planet.atmo_pressure": 0.6 }));
    const after = bindPlanet(entry({ ...facts, "planet.atmo_pressure": 1.4 }));

    expect(after.atmosphere.thickness).toBeGreaterThan(before.atmosphere.thickness);
    expect(after.surface).toEqual(before.surface);
  });

  it("marks an unstated lock as inferred rather than asserting it is false", () => {
    const p = bindPlanet(entry({ "planet.atmo_pressure": 1 }));
    expect(p.tidallyLocked).toMatchObject({ value: false, derived: true });
    expect(bindingNotes(p).some((n) => /locked/i.test(n))).toBe(true);
  });

  it("collects every inference for a provenance readout", () => {
    const notes = bindingNotes(bindPlanet(entry({})));
    expect(notes.length).toBeGreaterThan(0);
    for (const n of notes) expect(n.length).toBeGreaterThan(0);
  });

  it("reports nothing derived when canon supplies everything", () => {
    const p = bindPlanet(
      entry({
        "planet.atmo_pressure": 1,
        "orbit.tidally_locked": "false",
        "planet.radius": 1.02,
      }),
    );
    expect(bindingNotes(p)).toEqual([]);
  });
});
