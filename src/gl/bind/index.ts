// ---------------------------------------------------------------------------
// bind/ — canon in, uniforms out (Brief G2 §4, 14-RENDER-ENGINE §1).
//
// "bind/ is the ONLY module allowed to read canon. Materials take uniforms.
// Scenes take bound data. No shader ever knows what a worksheet is."
//
// THE LINE THAT MATTERS
//
// This module produces UNIFORMS, never FACTS. That distinction is doing real
// work. To render a star that carries a spectral class but no measured
// temperature, we derive a temperature from the class — standard main-sequence
// midpoints. That is legitimate for choosing a colour and illegitimate as a
// claim: the writer never decided it, so it must never be written back as
// canon, cited in a flag, or shown as a value on the Codex page.
//
// Every derived value therefore travels with `derived: true` and the reason,
// so a caller that is tempted to display one has to look at that first.
// ---------------------------------------------------------------------------

import type { WorldEntry } from "@/services/world-data";
import { readPublishedFact } from "@/lib/simulators/published-facts";
import {
  coronaAmplitude,
  kelvinToRGB,
  limbDarkening,
  spectralClassKelvin,
} from "../materials/blackbody";
import { atmosphereUniforms, type AtmosphereUniforms } from "../materials/atmosphere";
import { surfaceUniforms, type SurfaceUniforms } from "../materials/surface";
import type { RGB } from "../engine/theme-uniforms";

/** A value the render used, and where it came from. */
export interface Provenanced<T> {
  value: T;
  /** False when a fact supplied it; true when this module inferred it. */
  derived: boolean;
  /** Why, when derived. Shown to a human, never used as a fact. */
  note?: string;
}

const fromFact = <T>(value: T): Provenanced<T> => ({ value, derived: false });
const inferred = <T>(value: T, note: string): Provenanced<T> => ({
  value,
  derived: true,
  note,
});

function num(entry: WorldEntry | null | undefined, predicate: string): number | null {
  const fact = readPublishedFact(entry, predicate);
  const v = fact?.value;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v.replace(/[^\d.eE+-]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  const meta = (entry?.metadata ?? {}) as Record<string, unknown>;
  const m = meta[predicate.split(".").pop() ?? ""];
  if (typeof m === "number" && Number.isFinite(m)) return m;
  if (typeof m === "string") {
    const n = Number.parseFloat(m.replace(/[^\d.eE+-]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function text(entry: WorldEntry | null | undefined, predicate: string): string | null {
  const v = readPublishedFact(entry, predicate)?.value;
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return null;
}

function bool(entry: WorldEntry | null | undefined, predicate: string): boolean | null {
  const v = readPublishedFact(entry, predicate)?.value;
  if (typeof v === "string") {
    if (/^(true|yes|locked|tidally[\s_-]?locked|1)$/i.test(v.trim())) return true;
    if (/^(false|no|unlocked|0)$/i.test(v.trim())) return false;
  }
  if (typeof v === "number") return v !== 0;
  return null;
}

// ---------------------------------------------------------------------------
// Star
// ---------------------------------------------------------------------------

export interface StarBinding {
  temperature: Provenanced<number>;
  colour: RGB;
  limbDarkening: number;
  coronaAmplitude: Provenanced<number>;
  /** Null when nothing on file says. The scene draws a neutral star. */
  spectralClass: string | null;
}

/** The default when a star carries neither a temperature nor a class. */
const NEUTRAL_STAR_K = 5700;

export function bindStar(entry: WorldEntry | null | undefined): StarBinding {
  const measured = num(entry, "star.temp_effective");
  const spectralClass = text(entry, "star.spectral_class");
  const fromClass = spectralClassKelvin(spectralClass);

  let temperature: Provenanced<number>;
  if (measured !== null) {
    temperature = fromFact(measured);
  } else if (fromClass !== null) {
    temperature = inferred(
      fromClass,
      `No effective temperature on file. Colour taken from the class ${spectralClass}. This is a render choice, not a fact.`,
    );
  } else {
    temperature = inferred(
      NEUTRAL_STAR_K,
      "Neither a temperature nor a class on file. Rendered as a neutral G-type; nothing here is a claim about this star.",
    );
  }

  const flare = num(entry, "star.flare_activity");

  return {
    temperature,
    colour: kelvinToRGB(temperature.value),
    limbDarkening: limbDarkening(temperature.value),
    coronaAmplitude:
      flare === null
        ? inferred(coronaAmplitude(null), "No flare activity on file; drawn calm.")
        : fromFact(coronaAmplitude(flare)),
    spectralClass,
  };
}

// ---------------------------------------------------------------------------
// Planet
// ---------------------------------------------------------------------------

export interface PlanetBinding {
  atmosphere: AtmosphereUniforms;
  surface: SurfaceUniforms;
  /** Earth radii. Used for relative scale in a system scene. */
  radius: Provenanced<number>;
  tidallyLocked: Provenanced<boolean>;
}

export function bindPlanet(entry: WorldEntry | null | undefined): PlanetBinding {
  const pressure = num(entry, "planet.atmo_pressure");
  const composition = text(entry, "planet.atmo_composition");
  const surfaceType = text(entry, "planet.surface_type");
  const albedo = num(entry, "planet.albedo");
  const radius = num(entry, "planet.radius");

  const lockedFact = bool(entry, "orbit.tidally_locked");
  const tidallyLocked: Provenanced<boolean> =
    lockedFact === null
      ? inferred(false, "Nothing on file says this world is locked; drawn rotating.")
      : fromFact(lockedFact);

  return {
    atmosphere: atmosphereUniforms(composition, pressure),
    surface: surfaceUniforms(surfaceType, albedo, tidallyLocked.value),
    radius:
      radius === null
        ? inferred(1, "No radius on file; drawn at one Earth radius for scale.")
        : fromFact(radius),
    tidallyLocked,
  };
}

/** Everything this render inferred rather than read. For a provenance readout. */
export function bindingNotes(
  binding: StarBinding | PlanetBinding,
): string[] {
  const notes: string[] = [];
  for (const value of Object.values(binding)) {
    if (
      value &&
      typeof value === "object" &&
      "derived" in value &&
      (value as Provenanced<unknown>).derived &&
      (value as Provenanced<unknown>).note
    ) {
      notes.push((value as Provenanced<unknown>).note!);
    }
  }
  return notes;
}
