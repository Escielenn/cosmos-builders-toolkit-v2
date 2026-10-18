// ---------------------------------------------------------------------------
// canon/supabase-store, the only code in the client that touches public.facts.
//
// Also hosts the default projector: the same computed-on-read pipeline the
// Studio runs (world-index over worksheets, simulation saves and Codex
// infoboxes), for callers of canon.facts() that do not already hold it.
// Chronicle events are not loaded here; they are not predicates.
// ---------------------------------------------------------------------------

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { fetchEntities } from "@/services/entity-graph-crud";
import { getWorksheetSubjects } from "@/services/worksheet-subjects";
import { buildWorldFacts } from "@/lib/writing/world-index";
import type { CanonStore, NewFactRow, Projector } from "@/canon/core";
import type { CanonFactRow } from "@/canon/types";

const COLUMNS =
  "id, world_id, subject_id, predicate, value, value_text, unit, confidence, source_kind, source_ref, asserted_by, created_at, updated_at, superseded_at";

function asRow(r: unknown): CanonFactRow {
  return r as CanonFactRow;
}

export const supabaseCanonStore: CanonStore = {
  async listLive(worldId, filter = {}) {
    let q = supabase.from("facts").select(COLUMNS).eq("world_id", worldId).is("superseded_at", null);
    if (filter.subjectId !== undefined) {
      q = filter.subjectId === null ? q.is("subject_id", null) : q.eq("subject_id", filter.subjectId);
    }
    if (filter.predicates?.length) q = q.in("predicate", filter.predicates);
    const { data, error } = await q.order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(asRow);
  },

  async get(id) {
    const { data, error } = await supabase.from("facts").select(COLUMNS).eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? asRow(data) : null;
  },

  async findLiveCanon(worldId, subjectId, predicates) {
    let q = supabase
      .from("facts")
      .select(COLUMNS)
      .eq("world_id", worldId)
      .eq("confidence", "canon")
      .is("superseded_at", null)
      .in("predicate", predicates);
    q = subjectId === null ? q.is("subject_id", null) : q.eq("subject_id", subjectId);
    const { data, error } = await q.limit(1);
    if (error) throw error;
    return data?.[0] ? asRow(data[0]) : null;
  },

  async insert(row: NewFactRow) {
    const { data, error } = await supabase
      .from("facts")
      .insert({
        ...row,
        value: row.value as unknown as Json,
        source_ref: row.source_ref as unknown as Json,
      })
      .select(COLUMNS)
      .single();
    if (error) throw error;
    return asRow(data);
  },

  async update(id, patch) {
    const { data, error } = await supabase.from("facts").update(patch).eq("id", id).select(COLUMNS).single();
    if (error) throw error;
    return asRow(data);
  },
};

export const supabaseProjector: Projector = async (worldId) => {
  const [ws, sims, entities] = await Promise.all([
    supabase.from("worksheets").select("id, tool_type, title, data").eq("world_id", worldId).is("archived_at", null),
    supabase.from("simulation_saves").select("id, simulator_type, name, data").eq("world_id", worldId),
    fetchEntities(worldId),
  ]);
  if (ws.error) throw ws.error;
  if (sims.error) throw sims.error;
  const worksheets = ws.data ?? [];
  const subjectRows = await getWorksheetSubjects(worksheets.map((w) => w.id));
  const subjects: Record<string, string | undefined> = {};
  for (const [id, s] of Object.entries(subjectRows)) subjects[id] = s.entityId;
  return buildWorldFacts({
    worldId,
    worksheets: worksheets.map((w) => ({ id: w.id, tool_type: w.tool_type, title: w.title, data: w.data as unknown })),
    simulations: (sims.data ?? []).map((s) => ({ ...s, data: s.data as unknown })),
    subjects,
    entities,
  });
};
