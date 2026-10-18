// ---------------------------------------------------------------------------
// world-seed, writes a BEGIN SURVEY payload into an existing world.
//
// The payload is built by the pure src/lib/onboarding/survey-seed.ts. This
// file only performs the writes, through the same services every other
// surface uses: entities and typed edges through entity-graph-crud (so the
// Codex, the Web view and the Studio palette read the same rows), and the
// first binder document as a world_entries 'document' row exactly as the
// Studio's own create does.
//
// Resumable: every write records itself in a SeedProgress the caller owns.
// Passing the same progress back after a failure skips what already exists,
// so a retry never duplicates an entry, an edge or the document.
//
// The document carries inspector metadata only. Its content is empty: the
// wizard never writes prose for the writer.
// ---------------------------------------------------------------------------

import { supabase } from "@/integrations/supabase/client";
import { createEntity, createEntityConnection } from "@/services/entity-graph-crud";
import { writeDocMeta } from "@/lib/document-meta";
import type { SeedConnection, SeedKey, SeedPayload } from "@/lib/onboarding/survey-seed";

export interface SeedResult {
  entityIds: Partial<Record<SeedKey, string>>;
  documentId: string;
}

/** What has already been written for one seed. Mutated in place. */
export interface SeedProgress {
  entityIds: Partial<Record<SeedKey, string>>;
  /** connectionKey()s already written. */
  connectionsDone: string[];
  documentId: string | null;
}

export function emptySeedProgress(): SeedProgress {
  return { entityIds: {}, connectionsDone: [], documentId: null };
}

export function connectionKey(c: SeedConnection): string {
  return `${c.source}>${c.relationship_type}>${c.target}`;
}

/**
 * Inspector metadata for the first document, with seed keys resolved to the
 * rows just written.
 */
export function seedDocumentMeta(
  payload: SeedPayload,
  ids: Partial<Record<SeedKey, string>>,
): Record<string, unknown> {
  const place = payload.document.setInPlace ? ids[payload.document.setInPlace] ?? "" : "";
  const subject = payload.document.subject ? ids[payload.document.subject] ?? "" : "";
  // POV and synopsis stay empty on purpose: both are the writer's call.
  return writeDocMeta({}, { setInPlaceId: place, subjectEntityId: subject });
}

export async function executeSeed(
  payload: SeedPayload,
  worldId: string,
  userId: string,
  progress: SeedProgress = emptySeedProgress(),
): Promise<SeedResult> {
  // Upstream first (star, planet, species) so every edge has both ends.
  for (const e of payload.entities) {
    if (progress.entityIds[e.key]) continue;
    const created = await createEntity(
      {
        world_id: worldId,
        name: e.name,
        entity_type: e.entity_type,
        cascade_stage: e.cascade_stage,
        summary: e.summary || null,
        description: e.description,
        // `name`/`description` mirror the generic master fields the infobox
        // reads, the same pair useCreateEntityEntry writes.
        metadata: { name: e.name, description: e.description, ...e.metadata },
      },
      userId,
    );
    progress.entityIds[e.key] = created.id;
  }

  for (const c of payload.connections) {
    const key = connectionKey(c);
    if (progress.connectionsDone.includes(key)) continue;
    const source = progress.entityIds[c.source];
    const target = progress.entityIds[c.target];
    if (!source || !target) continue;
    await createEntityConnection(
      {
        world_id: worldId,
        source_entity_id: source,
        target_entity_id: target,
        relationship_type: c.relationship_type,
        cascade_stage: c.cascade_stage,
      },
      userId,
    );
    progress.connectionsDone.push(key);
  }

  if (!progress.documentId) {
    const { data, error } = await supabase
      .from("world_entries")
      .insert({
        world_id: worldId,
        title: payload.document.title,
        entry_type: "document",
        content: "",
        metadata: seedDocumentMeta(payload, progress.entityIds) as never,
        sort_order: 0,
        parent_id: null,
        created_by: userId,
      })
      .select("id")
      .single();

    if (error) throw error;
    progress.documentId = (data as { id: string }).id;
  }

  return { entityIds: { ...progress.entityIds }, documentId: progress.documentId };
}

/**
 * One survey filing: the payload as first filed, the world once it exists,
 * and the seed progress. The caller keeps it across a failure and passes
 * the same object to retry; nothing already written is written again.
 */
export interface SurveyRun {
  payload: SeedPayload;
  worldId: string | null;
  progress: SeedProgress;
}

export function newSurveyRun(payload: SeedPayload): SurveyRun {
  return { payload, worldId: null, progress: emptySeedProgress() };
}

/** Create the world (once), then seed it. Mutates `run` as it goes. */
export async function fileSurveyRun(
  run: SurveyRun,
  userId: string,
  insertWorld: (worldName: string) => Promise<string>,
): Promise<SeedResult & { worldId: string }> {
  if (!run.worldId) run.worldId = await insertWorld(run.payload.worldName);
  const seeded = await executeSeed(run.payload, run.worldId, userId, run.progress);
  return { worldId: run.worldId, ...seeded };
}
