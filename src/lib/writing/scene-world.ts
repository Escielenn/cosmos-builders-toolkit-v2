// ---------------------------------------------------------------------------
// scene-world, resolve a document's Card (POV, SET IN, WHEN, TIMELINE) into
// the records the rail ranks by and the World tab reads.
//
//   POV        → the character entity and its Dossier, plus the worksheets
//                that Dossier inherits from (homeworld, species, senses, …)
//   SET IN     → the place entity, the body it stands on, that body's facts
//                (resolveBodyFacts: Codex → Genesis → Tidelock), and the
//                cartographer's substellar longitude for a locked world
//   TIMELINE   → the branch name
//
// Everything is looked up by id. A free-text POV with no picked character
// resolves to no POV here, by design: a name is not an identity.
//
// Pure: no React, no network, tested.
// ---------------------------------------------------------------------------

import type { Entity } from "@/services/entity-graph-types";
import type { DocumentMeta } from "@/lib/document-meta";
import { findStarFor, resolveBodyFacts, type BodyFacts } from "@/lib/surface-cartographer/body";
import { readState } from "@/lib/surface-cartographer/places";
import { formatLatLon, isValidLatLon, type LatLon } from "@/lib/surface-cartographer/geo";
import { terminatorHalfWidthFromHabitable } from "@/lib/surface-cartographer/illumination";
import { normalizeDossier, DOSSIER_TOOL_TYPE } from "@/lib/dossier/types";
import { getToolRoute } from "@/lib/tools-config";
import type { InfluenceInput, InfluencePov } from "@/lib/writing/world-influence";

export interface SceneWorksheet {
  id: string;
  tool_type: string;
  title: string | null;
  data: unknown;
}

export interface SceneWorldInput {
  worldId: string;
  meta: Pick<DocumentMeta, "povEntityId" | "povDossierId" | "setInPlaceId" | "subjectEntityId" | "when" | "branchId">;
  entities: readonly Entity[];
  worksheets: readonly SceneWorksheet[];
  simulations: ReadonlyArray<{ id: string; simulator_type: string; name: string; data: unknown }>;
  /** worksheet id → subject entity id. */
  subjects: Readonly<Record<string, string | undefined>>;
  branches: ReadonlyArray<{ id: string; name: string }>;
}

export interface SceneWorld {
  povEntityId: string | null;
  povDossierId: string | null;
  povOriginSheetIds: string[];
  place: Entity | null;
  bodyEntityId: string | null;
  influence: InfluenceInput;
}

const ORIGIN_SLOTS = ["homeworld", "species", "sensorium", "culture", "polity", "language"] as const;

function placeAt(e: Entity | null): LatLon | null {
  const m = (e?.metadata ?? {}) as Record<string, unknown>;
  return isValidLatLon(m.lat, m.lon) ? { lat: m.lat as number, lon: m.lon as number } : null;
}

/** The Dossier for a character: the one picked, else one whose subject is the entity. */
export function findDossier(
  worksheets: readonly SceneWorksheet[],
  subjects: Readonly<Record<string, string | undefined>>,
  dossierId: string | null,
  entityId: string | null,
): SceneWorksheet | null {
  const dossiers = worksheets.filter((w) => w.tool_type === DOSSIER_TOOL_TYPE);
  if (dossierId) {
    const d = dossiers.find((w) => w.id === dossierId);
    if (d) return d;
  }
  if (entityId) return dossiers.find((w) => subjects[w.id] === entityId) ?? null;
  return null;
}

export function resolveSceneWorld(input: SceneWorldInput): SceneWorld {
  const { meta, entities, worksheets, subjects, worldId } = input;
  const byId = new Map(entities.map((e) => [e.id, e]));

  // POV
  const dossier = findDossier(worksheets, subjects, meta.povDossierId ?? null, meta.povEntityId ?? null);
  const povEntityId = meta.povEntityId || (dossier ? subjects[dossier.id] ?? null : null);
  let pov: InfluencePov | null = null;
  const povOriginSheetIds: string[] = [];
  let homeworldSheet: SceneWorksheet | null = null;
  if (dossier) {
    const d = normalizeDossier(dossier.data);
    for (const slot of ORIGIN_SLOTS) {
      const id = d.origins[slot].worksheetId;
      if (id) povOriginSheetIds.push(id);
    }
    const hwId = d.origins.homeworld.worksheetId;
    homeworldSheet = hwId ? worksheets.find((w) => w.id === hwId) ?? null : null;
    const name = d.identity.name.trim() || dossier.title || "POV";
    const route = getToolRoute(DOSSIER_TOOL_TYPE);
    pov = {
      name,
      resolved: d.resolved,
      source: `Dossier · ${name}`,
      href: route ? `${route}?worldId=${worldId}&worksheetId=${dossier.id}` : null,
    };
  }

  // SET IN → body
  const place = meta.setInPlaceId ? byId.get(meta.setInPlaceId) ?? null : null;
  const placeMeta = (place?.metadata ?? {}) as Record<string, unknown>;
  const placeBodyId =
    (typeof placeMeta.bodyEntityId === "string" && placeMeta.bodyEntityId) || place?.parent_entity_id || null;
  const subject = meta.subjectEntityId ? byId.get(meta.subjectEntityId) ?? null : null;
  const subjectIsBody = subject && (subject.entity_type === "planet" || subject.entity_type === "moon");
  const bodyEntity =
    (placeBodyId ? byId.get(placeBodyId) ?? null : null) ?? (subjectIsBody ? subject : null);

  let body: BodyFacts | null = null;
  let substellarLon = 0;
  let halfWidth: number | undefined;
  if (bodyEntity) {
    const profileWs =
      worksheets.find((w) => w.tool_type === "planetary-profile" && subjects[w.id] === bodyEntity.id) ?? null;
    const map = worksheets
      .filter((w) => w.tool_type === "surface-cartographer")
      .map((w) => readState(w.data))
      .find((s) => s.bodyEntityId === bodyEntity.id);
    const tl = map?.tidelockSaveId
      ? input.simulations.find((s) => s.id === map.tidelockSaveId) ?? null
      : null;
    substellarLon = map?.substellarLon ?? 0;
    body = resolveBodyFacts({
      worldId,
      entity: bodyEntity,
      profile: profileWs ? { id: profileWs.id, title: profileWs.title, data: profileWs.data } : null,
      tidelock: tl ? { id: tl.id, name: tl.name, data: tl.data } : null,
      star: findStarFor(bodyEntity, entities),
    });
    halfWidth = terminatorHalfWidthFromHabitable(body.habitablePercent?.value);
  } else if (homeworldSheet) {
    // No setting declared: the POV's homeworld is the best world we know.
    body = resolveBodyFacts({
      worldId,
      entity: null,
      profile: { id: homeworldSheet.id, title: homeworldSheet.title, data: homeworldSheet.data },
      tidelock: null,
      star: null,
    });
  }

  const branch = meta.branchId ? input.branches.find((b) => b.id === meta.branchId) ?? null : null;
  const when = (meta.when ?? "").trim();

  return {
    povEntityId,
    povDossierId: dossier?.id ?? null,
    povOriginSheetIds,
    place,
    bodyEntityId: bodyEntity?.id ?? null,
    influence: {
      body,
      place: place ? { name: place.name, at: placeAt(place) } : null,
      substellarLon,
      terminatorHalfWidthDeg: halfWidth,
      pov,
      epoch: when || branch ? { when, branchName: branch?.name ?? null } : null,
    },
  };
}

// ---------------------------------------------------------------------------
// Card pickers
// ---------------------------------------------------------------------------

export interface PovChoice {
  key: string;
  name: string;
  sub: string;
  entityId?: string;
  dossierId?: string;
}

/**
 * Characters the POV can bind to: every Dossier (with the entity it is about,
 * when linked), then every character entity no Dossier already covers.
 */
export function buildPovChoices(
  worksheets: readonly SceneWorksheet[],
  subjects: Readonly<Record<string, string | undefined>>,
  entities: readonly Entity[],
): PovChoice[] {
  const out: PovChoice[] = [];
  const covered = new Set<string>();
  for (const w of worksheets) {
    if (w.tool_type !== DOSSIER_TOOL_TYPE) continue;
    const name = normalizeDossier(w.data).identity.name.trim() || (w.title ?? "").trim() || "Unnamed character";
    const entityId = subjects[w.id];
    if (entityId) covered.add(entityId);
    out.push({ key: `d:${w.id}`, name, sub: "DOSSIER", dossierId: w.id, ...(entityId ? { entityId } : {}) });
  }
  for (const e of entities) {
    if (e.entity_type !== "character" || covered.has(e.id)) continue;
    out.push({ key: `e:${e.id}`, name: e.name, sub: "CODEX", entityId: e.id });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export interface PlaceChoice {
  id: string;
  name: string;
  sub: string;
}

/** Located places (Surface Cartographer), placed ones first. */
export function buildPlaceChoices(entities: readonly Entity[]): PlaceChoice[] {
  const byId = new Map(entities.map((e) => [e.id, e]));
  return entities
    .filter((e) => e.entity_type === "location")
    .map((e) => {
      const m = (e.metadata ?? {}) as Record<string, unknown>;
      const bodyId = (typeof m.bodyEntityId === "string" && m.bodyEntityId) || e.parent_entity_id || null;
      const body = bodyId ? byId.get(bodyId)?.name ?? null : null;
      const at = placeAt(e);
      const where = at ? formatLatLon(at) : "UNPLACED";
      return { id: e.id, name: e.name, sub: body ? `${body} · ${where}` : where, placed: !!at };
    })
    .sort((a, b) => Number(b.placed) - Number(a.placed) || a.name.localeCompare(b.name))
    .map(({ id, name, sub }) => ({ id, name, sub }));
}
