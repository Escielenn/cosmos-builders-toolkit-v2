// ---------------------------------------------------------------------------
// Places: located entities on a body's surface, and the worksheet around them.
//
// A place is not worksheet data. It is a `location` entity in world_entries,
// filed under its body (parent_entity_id), so it is @-mentionable in the
// Studio, has a Codex page, and pins onto the Codex Atlas at planet zoom with
// no adapter in between. Its coordinates live in metadata:
//
//   lat, lon       degrees; the cartographer's truth   (place.coordinates)
//   placeType      city · region · landmark · …        (place.settlement_type)
//   bodyEntityId   the body, repeated so a place survives being re-parented
//   atlas_x/_y     where it sits ON THE SHEET image, 0..1, written from lat/lon
//                  so the Atlas's existing pin model shows it without change.
//
// THE RULE (from src/lib/atlas/placement.ts): a place without coordinates is
// UNPLACED and says so. It is never scattered to a plausible spot.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import type { Entity } from "@/services/entity-graph-types";
import type { MapProjection } from "@/lib/atlas/placement";
import {
  formatLatLon,
  isValidLatLon,
  latLonToSheet,
  roundCoord,
  type LatLon,
} from "./geo";

export const PLACE_TYPES = [
  "city",
  "settlement",
  "region",
  "landmark",
  "biome",
  "ruin",
  "station",
  "port",
  "sacred",
  "hazard",
] as const;
export type PlaceType = (typeof PLACE_TYPES)[number];

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  city: "City",
  settlement: "Settlement",
  region: "Region",
  landmark: "Landmark",
  biome: "Biome",
  ruin: "Ruin",
  station: "Station",
  port: "Port",
  sacred: "Sacred site",
  hazard: "Hazard",
};

export interface SurfacePlace {
  id: string;
  name: string;
  placeType: PlaceType;
  description: string;
  /** null = unplaced. Shown in the tray, never guessed. */
  at: LatLon | null;
}

function isPlaceType(v: unknown): v is PlaceType {
  return typeof v === "string" && (PLACE_TYPES as readonly string[]).includes(v);
}

/** Read a place off an entity. Bad coordinates make it unplaced, not clamped. */
export function readPlace(entity: Entity): SurfacePlace {
  const meta = (entity.metadata ?? {}) as Record<string, unknown>;
  const lat = meta.lat;
  const lon = meta.lon;
  return {
    id: entity.id,
    name: entity.name,
    placeType: isPlaceType(meta.placeType) ? meta.placeType : "landmark",
    description: entity.description ?? "",
    at: isValidLatLon(lat, lon) ? { lat: lat as number, lon: lon as number } : null,
  };
}

/** The places on one body: `location` entities filed under it. */
export function placesOnBody(entities: readonly Entity[], bodyId: string | null): SurfacePlace[] {
  if (!bodyId) return [];
  return entities
    .filter((e) => e.parent_entity_id === bodyId && e.entity_type === "location")
    .map(readPlace)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface SheetGeometry {
  projection: MapProjection;
  /** width / height of the sheet image. */
  aspect: number;
}

/**
 * The metadata a placement writes. Shape matches entityUpdateToRow's merge,
 * so it never drops other keys on the row.
 */
export function placeMetadataPatch(
  at: LatLon,
  bodyEntityId: string,
  placeType: PlaceType,
  sheet: SheetGeometry = { projection: "equirectangular", aspect: 2 },
): Record<string, unknown> {
  const lat = roundCoord(at.lat);
  const lon = roundCoord(at.lon);
  const p = latLonToSheet({ lat, lon }, sheet.projection, sheet.aspect);
  const inSheet = p.y >= 0 && p.y <= 1;
  return {
    lat,
    lon,
    placeType,
    bodyEntityId,
    // A Mercator sheet cannot show the poles; a place beyond its edge keeps
    // its coordinates and simply has no position on that picture.
    atlas_x: inSheet ? Number(p.x.toFixed(6)) : null,
    atlas_y: inSheet ? Number(p.y.toFixed(6)) : null,
  };
}

/** Clearing a placement. The entity, its name and its words stay. */
export const UNPLACE_PATCH: Record<string, unknown> = {
  lat: null,
  lon: null,
  atlas_x: null,
  atlas_y: null,
};

// ---------------------------------------------------------------------------
// The worksheet
// ---------------------------------------------------------------------------

export type MapSource = "sheet" | "generated";

export interface GazetteerEntry {
  id: string;
  name: string;
  placeType: PlaceType;
  lat: number;
  lon: number;
}

/**
 * What the Surface Cartographer worksheet stores.
 *
 * Emitted (read by worksheet-facts → the Studio Refs/Check tabs):
 *   bodyName, mapSource, substellarLon, gazetteer
 * Ephemeral, by declaration (instrument settings, not claims about the world):
 *   travelKmh, measureFrom, measureTo, generatorSeed, view
 *
 * `gazetteer` is a SNAPSHOT refreshed on every save. The places themselves are
 * entities and are the truth; the snapshot exists only because the Studio's
 * fact pathway reads worksheet data, and it is labelled as such where shown.
 */
export interface SurfaceCartographerState {
  version: 1;
  bodyEntityId: string | null;
  /** A Genesis worksheet chosen as the body when no entity exists yet. */
  bodyWorksheetId: string | null;
  bodyName: string;
  tidelockSaveId: string | null;
  mapSource: MapSource;
  generatorSeed: string;
  /**
   * Longitude the star stands over on a locked world. A cartographic choice —
   * where on THEIR map the writer puts the eye of the world.
   */
  substellarLon: number;
  travelKmh: number;
  measureFrom: string | null;
  measureTo: string | null;
  view: "flat" | "globe";
  gazetteer: GazetteerEntry[];
  generalNotes: string;
}

export const INITIAL_STATE: SurfaceCartographerState = {
  version: 1,
  bodyEntityId: null,
  bodyWorksheetId: null,
  bodyName: "",
  tidelockSaveId: null,
  mapSource: "generated",
  generatorSeed: "forge",
  substellarLon: 0,
  travelKmh: 5,
  measureFrom: null,
  measureTo: null,
  view: "flat",
  gazetteer: [],
  generalNotes: "",
};

/** Load a saved blob, tolerating older or partial shapes. */
export function readState(raw: unknown): SurfaceCartographerState {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const s = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : null);
  const n = (k: string, d: number) =>
    typeof o[k] === "number" && Number.isFinite(o[k]) ? (o[k] as number) : d;
  const gaz = Array.isArray(o.gazetteer)
    ? (o.gazetteer as unknown[]).flatMap((g) => {
        const r = g && typeof g === "object" ? (g as Record<string, unknown>) : null;
        if (!r || typeof r.id !== "string" || typeof r.name !== "string") return [];
        if (!isValidLatLon(r.lat, r.lon)) return [];
        return [
          {
            id: r.id,
            name: r.name,
            placeType: isPlaceType(r.placeType) ? r.placeType : "landmark",
            lat: r.lat as number,
            lon: r.lon as number,
          },
        ];
      })
    : [];
  return {
    version: 1,
    bodyEntityId: s("bodyEntityId"),
    bodyWorksheetId: s("bodyWorksheetId"),
    bodyName: s("bodyName") ?? "",
    tidelockSaveId: s("tidelockSaveId"),
    mapSource: o.mapSource === "sheet" ? "sheet" : "generated",
    generatorSeed: s("generatorSeed") ?? INITIAL_STATE.generatorSeed,
    substellarLon: Math.max(-180, Math.min(180, n("substellarLon", 0))),
    travelKmh: Math.max(0.1, n("travelKmh", INITIAL_STATE.travelKmh)),
    measureFrom: s("measureFrom"),
    measureTo: s("measureTo"),
    view: o.view === "globe" ? "globe" : "flat",
    gazetteer: gaz,
    generalNotes: s("generalNotes") ?? "",
  };
}

/** The snapshot written on save: placed places only, stable order. */
export function gazetteerSnapshot(places: readonly SurfacePlace[]): GazetteerEntry[] {
  return places
    .filter((p): p is SurfacePlace & { at: LatLon } => p.at !== null)
    .map((p) => ({ id: p.id, name: p.name, placeType: p.placeType, lat: p.at.lat, lon: p.at.lon }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export interface GazetteerRow {
  place: SurfacePlace;
  band?: string;
  sky?: string;
}

/** A markdown gazetteer: the world's places, grouped by type, with coordinates. */
export function buildGazetteerMarkdown(
  bodyName: string,
  rows: readonly GazetteerRow[],
  extras: { radiusKm: number | null; locked: boolean; substellarLon: number },
): string {
  const lines: string[] = [];
  lines.push(`# ${bodyName || "Unnamed body"} — Gazetteer`, "");
  const facts: string[] = [];
  if (extras.radiusKm) facts.push(`Radius ${Math.round(extras.radiusKm).toLocaleString("en-US")} km`);
  facts.push(extras.locked ? `Tidally locked · substellar point ${formatLatLon({ lat: 0, lon: extras.substellarLon })}` : "Free rotation");
  lines.push(`_${facts.join(" · ")}_`, "");

  const placed = rows.filter((r) => r.place.at);
  const unplaced = rows.filter((r) => !r.place.at);
  for (const type of PLACE_TYPES) {
    const group = placed.filter((r) => r.place.placeType === type);
    if (!group.length) continue;
    lines.push(`## ${PLACE_TYPE_LABELS[type]}`, "");
    for (const r of group) {
      const meta = [formatLatLon(r.place.at!), r.band, r.sky].filter(Boolean).join(" · ");
      lines.push(`- **${r.place.name}** (${meta})`);
      const desc = r.place.description.trim();
      if (desc) lines.push(`  ${desc.replace(/\s*\n\s*/g, " ")}`);
    }
    lines.push("");
  }
  if (unplaced.length) {
    lines.push("## Unplaced", "");
    for (const r of unplaced) lines.push(`- ${r.place.name}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd() + "\n";
}

/** One numbered gazetteer line; `n` matches the marker on the map sheet. */
export interface GazetteerReportEntry {
  n: number;
  id: string;
  name: string;
  at: LatLon;
  coords: string;
  meta: string;
  description: string;
}

export interface GazetteerReport {
  title: string;
  subtitle: string;
  groups: { label: string; entries: GazetteerReportEntry[] }[];
  unplaced: string[];
}

/**
 * The gazetteer as structured data, for the PDF map sheet. Same grouping and
 * same facts line as buildGazetteerMarkdown; entries are numbered in reading
 * order so the numbers on the map match the list.
 */
export function buildGazetteerReport(
  bodyName: string,
  rows: readonly GazetteerRow[],
  extras: { radiusKm: number | null; locked: boolean; substellarLon: number },
): GazetteerReport {
  const facts: string[] = [];
  if (extras.radiusKm) facts.push(`Radius ${Math.round(extras.radiusKm).toLocaleString("en-US")} km`);
  facts.push(extras.locked ? `Tidally locked · substellar point ${formatLatLon({ lat: 0, lon: extras.substellarLon })}` : "Free rotation");

  let n = 0;
  const groups: GazetteerReport["groups"] = [];
  for (const type of PLACE_TYPES) {
    const group = rows.filter((r) => r.place.at && r.place.placeType === type);
    if (!group.length) continue;
    groups.push({
      label: PLACE_TYPE_LABELS[type],
      entries: group.map((r) => ({
        n: ++n,
        id: r.place.id,
        name: r.place.name,
        at: r.place.at as LatLon,
        coords: formatLatLon(r.place.at as LatLon),
        meta: [r.band, r.sky].filter(Boolean).join(" · "),
        description: r.place.description.trim().replace(/\s*\n\s*/g, " "),
      })),
    });
  }
  return {
    title: `${bodyName || "Unnamed body"} Gazetteer`,
    subtitle: facts.join(" · "),
    groups,
    unplaced: rows.filter((r) => !r.place.at).map((r) => r.place.name),
  };
}
