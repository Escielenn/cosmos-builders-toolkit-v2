// ---------------------------------------------------------------------------
// Day, night and climate band at a place, from the body's canon.
//
// Two regimes, and the body's tidal state picks between them:
//
//   FREE ROTATION   The star's declination swings ±tilt over the year. Day
//                   length at a latitude follows the standard sunrise
//                   equation (cos H₀ = −tan φ · tan δ), scaled to the body's
//                   own solar day. Polar day and polar night fall out of it.
//
//   TIDALLY LOCKED  The star never moves. A place is in permanent day,
//                   permanent night, or the terminator band between, decided
//                   by its angular distance from the substellar point. That
//                   band IS the geography of a locked world (14 §2).
//
// Climate bands are insolation bands: the annual mean sunlight a latitude
// receives, thresholded so that at Earth's tilt they reproduce Earth's
// familiar 15° / 30° / 55° / 70° boundaries. At high obliquity the poles out-
// receive the equator, and the bands invert — that is physics, not a bug.
//
// Simple models, stated as such. No atmosphere, no ocean heat transport, no
// eccentricity. A writer needs the shape of the answer, and these get the
// shape right.
// ---------------------------------------------------------------------------

import { angularDistanceDeg, type LatLon } from "./geo";

const DEG = Math.PI / 180;
export const EARTH_TILT_DEG = 23.44;

/** The default half-width of a locked world's terminator band, degrees of star elevation. */
export const DEFAULT_TERMINATOR_HALF_WIDTH = 15;

// ---------------------------------------------------------------------------
// Free rotation
// ---------------------------------------------------------------------------

/** Solar declination at a point in the year. `season` 0 = northward equinox, 0.25 = northern solstice. */
export function declinationDeg(tiltDeg: number, season: number): number {
  return Math.asin(Math.sin(tiltDeg * DEG) * Math.sin(2 * Math.PI * season)) / DEG;
}

/** Fraction of one rotation the star is above the horizon, 0..1. */
export function daylightFraction(latDeg: number, declDeg: number): number {
  const phi = latDeg * DEG;
  const d = declDeg * DEG;
  const cosH = -Math.tan(phi) * Math.tan(d);
  if (cosH <= -1) return 1; // polar day
  if (cosH >= 1) return 0; // polar night
  return Math.acos(cosH) / Math.PI;
}

export interface DaylightProfile {
  /** Hours of light at the local summer solstice. */
  summerHours: number;
  equinoxHours: number;
  winterHours: number;
  /** Some part of the year has a star that never sets. */
  polarDay: boolean;
  /** Some part of the year has a star that never rises. */
  polarNight: boolean;
}

/**
 * Daylight through the year at one latitude.
 *
 * "Summer" is the local summer: the solstice when the star stands over this
 * hemisphere. On the equator the two solstices are the same.
 */
export function daylightProfile(
  latDeg: number,
  tiltDeg: number,
  solarDayHours: number,
): DaylightProfile {
  const tilt = Math.abs(tiltDeg);
  const north = declinationDeg(tilt, 0.25);
  const local = latDeg >= 0 ? north : -north;
  const summer = daylightFraction(latDeg, local);
  const winter = daylightFraction(latDeg, -local);
  const equinox = daylightFraction(latDeg, 0);
  return {
    summerHours: summer * solarDayHours,
    equinoxHours: equinox * solarDayHours,
    winterHours: winter * solarDayHours,
    polarDay: summer >= 1,
    polarNight: winter <= 0,
  };
}

/**
 * Daily-mean top-of-atmosphere insolation at a latitude and declination,
 * as a fraction of the stellar flux. Standard:
 * Q = (H₀ sin φ sin δ + cos φ cos δ sin H₀) / π.
 */
export function dailyInsolation(latDeg: number, declDeg: number): number {
  const phi = latDeg * DEG;
  const d = declDeg * DEG;
  const cosH = -Math.tan(phi) * Math.tan(d);
  let h0: number;
  if (cosH <= -1) h0 = Math.PI;
  else if (cosH >= 1) h0 = 0;
  else h0 = Math.acos(cosH);
  return (h0 * Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.sin(h0)) / Math.PI;
}

/** Annual-mean insolation at a latitude, sampled across a circular orbit. */
export function annualInsolation(latDeg: number, tiltDeg: number, samples = 96): number {
  let total = 0;
  for (let i = 0; i < samples; i++) {
    total += dailyInsolation(latDeg, declinationDeg(tiltDeg, (i + 0.5) / samples));
  }
  return total / samples;
}

export const CLIMATE_BANDS = [
  "equatorial",
  "tropical",
  "temperate",
  "subpolar",
  "polar",
] as const;
export type ClimateBand = (typeof CLIMATE_BANDS)[number];

export const CLIMATE_BAND_LABELS: Record<ClimateBand, string> = {
  equatorial: "Equatorial",
  tropical: "Tropical",
  temperate: "Temperate",
  subpolar: "Subpolar",
  polar: "Polar",
};

// Earth's band edges, turned into insolation thresholds once.
const EARTH_EDGES = [15, 30, 55, 70] as const;
let thresholds: number[] | null = null;
function bandThresholds(): number[] {
  if (!thresholds) {
    thresholds = EARTH_EDGES.map((lat) => annualInsolation(lat, EARTH_TILT_DEG));
  }
  return thresholds;
}

/** The insolation band a latitude falls in, given the body's tilt. */
export function climateBand(latDeg: number, tiltDeg: number): ClimateBand {
  const q = annualInsolation(latDeg, Math.abs(tiltDeg));
  const t = bandThresholds();
  if (q >= t[0]) return "equatorial";
  if (q >= t[1]) return "tropical";
  if (q >= t[2]) return "temperate";
  if (q >= t[3]) return "subpolar";
  return "polar";
}

/**
 * Above about 54° of obliquity a pole receives more sunlight across a year
 * than the equator. Worth saying out loud: it inverts every climate
 * assumption a reader brings.
 */
export function polesOutheatEquator(tiltDeg: number): boolean {
  return annualInsolation(90, Math.abs(tiltDeg)) > annualInsolation(0, Math.abs(tiltDeg));
}

// ---------------------------------------------------------------------------
// Tidally locked
// ---------------------------------------------------------------------------

export type LockedRegime = "day" | "terminator" | "night";

export const LOCKED_ZONES = [
  "substellar",
  "dayside",
  "terminator",
  "nightside",
  "antistellar",
] as const;
export type LockedZone = (typeof LOCKED_ZONES)[number];

export const LOCKED_ZONE_LABELS: Record<LockedZone, string> = {
  substellar: "Substellar",
  dayside: "Dayside",
  terminator: "Terminator band",
  nightside: "Nightside",
  antistellar: "Antistellar",
};

export interface LockedIllumination {
  /** Height of the star above the horizon, degrees. Negative below it. */
  starElevationDeg: number;
  regime: LockedRegime;
  zone: LockedZone;
}

/**
 * Half-width of the terminator band from Tidelock's habitable-band
 * percentage, when it ran. A band of ±w degrees of elevation around the
 * terminator great circle covers sin(w) of the sphere, so w = asin(fraction).
 */
export function terminatorHalfWidthFromHabitable(habitablePercent: number | null | undefined): number {
  if (typeof habitablePercent !== "number" || !Number.isFinite(habitablePercent)) {
    return DEFAULT_TERMINATOR_HALF_WIDTH;
  }
  const f = Math.min(1, Math.max(0, habitablePercent / 100));
  if (f <= 0) return DEFAULT_TERMINATOR_HALF_WIDTH;
  return Math.asin(f) / DEG;
}

export function lockedIllumination(
  place: LatLon,
  substellarLon: number,
  halfWidthDeg = DEFAULT_TERMINATOR_HALF_WIDTH,
): LockedIllumination {
  const elevation = 90 - angularDistanceDeg(place, { lat: 0, lon: substellarLon });
  const w = Math.max(0.5, halfWidthDeg);
  let regime: LockedRegime;
  if (elevation > w) regime = "day";
  else if (elevation < -w) regime = "night";
  else regime = "terminator";

  let zone: LockedZone;
  if (elevation >= 60) zone = "substellar";
  else if (elevation > w) zone = "dayside";
  else if (elevation >= -w) zone = "terminator";
  else if (elevation > -60) zone = "nightside";
  else zone = "antistellar";

  return { starElevationDeg: elevation, regime, zone };
}

// ---------------------------------------------------------------------------
// One readout per place
// ---------------------------------------------------------------------------

export interface PlaceSky {
  locked: boolean;
  band: string;
  /** Daylight hours, or null when the body's day length is unknown. */
  daylight: DaylightProfile | null;
  lockedSky: LockedIllumination | null;
  /** One Ship's-Voice sentence of consequence. */
  narrative: string;
}

function hoursText(h: number): string {
  return `${h < 10 ? h.toFixed(1) : Math.round(h)} H`;
}

export function placeSky(
  place: LatLon,
  body: {
    tiltDeg: number | null;
    dayLengthHours: number | null;
    tidallyLocked: boolean;
    substellarLon: number;
    terminatorHalfWidthDeg?: number;
  },
): PlaceSky {
  if (body.tidallyLocked) {
    const sky = lockedIllumination(place, body.substellarLon, body.terminatorHalfWidthDeg);
    const elev = Math.round(sky.starElevationDeg);
    const narrative =
      sky.regime === "day"
        ? `PERMANENT DAY. THE STAR HANGS ${elev}° UP AND NEVER MOVES. NO DAWN TO WRITE.`
        : sky.regime === "night"
          ? `PERMANENT NIGHT. THE STAR IS ${Math.abs(elev)}° BELOW THE HORIZON, FOREVER. LIGHT HERE IS MADE, NOT GIVEN.`
          : `TERMINATOR. THE STAR SITS ON THE HORIZON AT ${elev}°. ENDLESS TWILIGHT; SHADOWS NEVER SHORTEN.`;
    return {
      locked: true,
      band: LOCKED_ZONE_LABELS[sky.zone],
      daylight: null,
      lockedSky: sky,
      narrative,
    };
  }

  const tilt = body.tiltDeg ?? 0;
  const band = CLIMATE_BAND_LABELS[climateBand(place.lat, tilt)];
  if (body.dayLengthHours === null || !(body.dayLengthHours > 0)) {
    return {
      locked: false,
      band,
      daylight: null,
      lockedSky: null,
      narrative: "DAY LENGTH NOT ON FILE. SET IT IN GENESIS TO RESOLVE DAYLIGHT.",
    };
  }
  const d = daylightProfile(place.lat, tilt, body.dayLengthHours);
  let narrative: string;
  if (d.polarDay && d.polarNight) {
    narrative = `POLAR DAY AND POLAR NIGHT BOTH OCCUR HERE. THE YEAR IS ONE LONG DAY AND ONE LONG DARK.`;
  } else if (d.polarDay) {
    narrative = `THE STAR NEVER SETS AT MIDSUMMER. WINTER DAYS RUN ${hoursText(d.winterHours)}.`;
  } else if (d.polarNight) {
    narrative = `MIDWINTER BRINGS UNBROKEN NIGHT. SUMMER DAYS RUN ${hoursText(d.summerHours)}.`;
  } else if (Math.abs(d.summerHours - d.winterHours) < body.dayLengthHours * 0.08) {
    narrative = `DAYLIGHT BARELY CHANGES THROUGH THE YEAR. SEASONS HERE ARE WET AND DRY, NOT LONG AND SHORT.`;
  } else {
    narrative = `DAYLIGHT SWINGS FROM ${hoursText(d.winterHours)} TO ${hoursText(d.summerHours)} ACROSS THE YEAR.`;
  }
  return { locked: false, band, daylight: d, lockedSky: null, narrative };
}
