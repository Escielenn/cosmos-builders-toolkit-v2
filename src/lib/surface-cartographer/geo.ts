// ---------------------------------------------------------------------------
// Surface Cartographer geometry: coordinates, projections, distance, travel.
//
// Everything here is a pure function of numbers the writer decided. Latitude
// and longitude are degrees, north and east positive, longitude in
// [-180, 180). Distances are kilometres on a sphere of the body's own radius,
// never Earth's unless the body IS Earth-sized.
//
// Two sheet projections are supported, matching src/lib/atlas/placement.ts:
//   equirectangular  x ∝ longitude, y ∝ latitude. The 2:1 standard.
//   mercator         x ∝ longitude, y ∝ ln(tan(π/4 + φ/2)). Clipped at the
//                    latitude the sheet's own aspect implies, so a square
//                    sheet reaches ±85.05°, the familiar web-map limit.
// ---------------------------------------------------------------------------

import type { MapProjection } from "@/lib/atlas/placement";

export const EARTH_RADIUS_KM = 6371;

const DEG = Math.PI / 180;

export interface LatLon {
  lat: number;
  lon: number;
}

/** A point on a map sheet, 0..1 from the left and from the top. */
export interface SheetPoint {
  x: number;
  y: number;
}

export function clampLat(lat: number): number {
  return Math.min(90, Math.max(-90, lat));
}

/** Wrap any longitude into [-180, 180). */
export function wrapLon(lon: number): number {
  const w = ((((lon + 180) % 360) + 360) % 360) - 180;
  // -0 reads oddly in a readout.
  return w === 0 ? 0 : w;
}

/** A coordinate is usable only when both halves are finite and in range. */
export function isValidLatLon(lat: unknown, lon: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

// ---------------------------------------------------------------------------
// Mercator
// ---------------------------------------------------------------------------

/** Mercator y for a latitude, in radians-of-longitude units. */
export function latToMercator(latDeg: number): number {
  const phi = clampLat(latDeg) * DEG;
  return Math.log(Math.tan(Math.PI / 4 + phi / 2));
}

export function mercatorToLat(y: number): number {
  return (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / DEG;
}

/**
 * The latitude a Mercator sheet reaches, from its aspect (width / height).
 *
 * The x axis spans 2π, so the y axis spans 2π·h/w, half each side of the
 * equator. A square sheet therefore reaches atan(sinh(π)) = 85.05°.
 */
export function mercatorLatLimit(aspect: number): number {
  const a = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  return mercatorToLat(Math.PI / a);
}

// ---------------------------------------------------------------------------
// Sheet coordinates
// ---------------------------------------------------------------------------

/**
 * Where a coordinate falls on a sheet. `aspect` matters only for Mercator,
 * whose vertical extent depends on it. A Mercator point beyond the sheet's
 * latitude limit lands outside 0..1 and the caller decides how to show that.
 */
export function latLonToSheet(
  { lat, lon }: LatLon,
  projection: MapProjection = "equirectangular",
  aspect = 2,
): SheetPoint {
  const x = (wrapLon(lon) + 180) / 360;
  if (projection === "mercator") {
    const half = Math.PI / (Number.isFinite(aspect) && aspect > 0 ? aspect : 1);
    const y = 0.5 - latToMercator(lat) / (2 * half);
    return { x, y };
  }
  return { x, y: (90 - clampLat(lat)) / 180 };
}

export function sheetToLatLon(
  { x, y }: SheetPoint,
  projection: MapProjection = "equirectangular",
  aspect = 2,
): LatLon {
  const lon = wrapLon(x * 360 - 180);
  if (projection === "mercator") {
    const half = Math.PI / (Number.isFinite(aspect) && aspect > 0 ? aspect : 1);
    return { lat: clampLat(mercatorToLat((0.5 - y) * 2 * half)), lon };
  }
  return { lat: clampLat(90 - y * 180), lon };
}

// ---------------------------------------------------------------------------
// Distance and travel
// ---------------------------------------------------------------------------

/** Central angle between two points, radians (haversine; stable at small angles). */
export function centralAngle(a: LatLon, b: LatLon): number {
  const p1 = a.lat * DEG;
  const p2 = b.lat * DEG;
  const dp = (b.lat - a.lat) * DEG;
  const dl = (b.lon - a.lon) * DEG;
  const h =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Angular distance in degrees, 0..180. */
export function angularDistanceDeg(a: LatLon, b: LatLon): number {
  return centralAngle(a, b) / DEG;
}

/** Great-circle distance over the body's own surface. */
export function greatCircleKm(a: LatLon, b: LatLon, radiusKm: number): number {
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) return NaN;
  return centralAngle(a, b) * radiusKm;
}

/** Initial compass bearing from a to b, degrees clockwise from north. */
export function initialBearingDeg(a: LatLon, b: LatLon): number {
  const p1 = a.lat * DEG;
  const p2 = b.lat * DEG;
  const dl = (b.lon - a.lon) * DEG;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return ((Math.atan2(y, x) / DEG) + 360) % 360;
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

export function compassPoint(bearingDeg: number): string {
  return COMPASS[Math.round((((bearingDeg % 360) + 360) % 360) / 45) % 8];
}

/** Hours to cover a distance at a steady speed. */
export function travelHours(distanceKm: number, speedKmh: number): number {
  if (!Number.isFinite(distanceKm) || !Number.isFinite(speedKmh) || speedKmh <= 0) {
    return NaN;
  }
  return distanceKm / speedKmh;
}

/**
 * Hours as a writer would say them. Above two days the unit is days, above
 * a year it is years: "9.4 days", not "225.6 h".
 */
export function formatDuration(hours: number): string {
  if (!Number.isFinite(hours)) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${hours < 10 ? hours.toFixed(1) : Math.round(hours)} h`;
  const days = hours / 24;
  if (days < 365) return `${days < 10 ? days.toFixed(1) : Math.round(days)} days`;
  return `${(days / 365.25).toFixed(1)} years`;
}

export function formatKm(km: number): string {
  if (!Number.isFinite(km)) return "—";
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString("en-US")} km`;
}

/** 12.4°N 33.1°E — the way a gazetteer prints it. */
export function formatLatLon({ lat, lon }: LatLon): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(1)}°${ns} ${Math.abs(lon).toFixed(1)}°${ew}`;
}

/** Round a coordinate to ~100 m at Earth scale. Full float noise helps no one. */
export function roundCoord(value: number): number {
  return Number(value.toFixed(3));
}

/** Common travel speeds a writer reaches for, km/h. Ephemeral presets. */
export const TRAVEL_PRESETS: ReadonlyArray<{ id: string; label: string; kmh: number }> = [
  { id: "walk", label: "On foot", kmh: 5 },
  { id: "caravan", label: "Caravan", kmh: 4 },
  { id: "horse", label: "Mounted", kmh: 12 },
  { id: "sail", label: "Sailing ship", kmh: 9 },
  { id: "rail", label: "Rail", kmh: 90 },
  { id: "air", label: "Airship", kmh: 120 },
  { id: "jet", label: "Jet", kmh: 850 },
];
