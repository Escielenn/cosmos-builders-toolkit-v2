/**
 * use-codex-entity — the data the Codex entity page needs beyond what
 * useWikiPage already provides (Brief F1, 13-THE-LIFT.md §1).
 *
 *   - attached worksheets WITH their data, so the generated infobox can be
 *     derived on read from the same fact projection the Studio uses
 *   - chronicle events that link to this entity
 *   - documents that mention this entity (writing_entry_entities), which is
 *     the closest thing to doc_bindings that exists today
 *
 * Every read goes through this hook and the services it calls; the page
 * renders what comes back and computes nothing of its own.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useChronicleData } from "@/hooks/use-chronicle";
import { buildFactInfobox, type AttachedWorksheet, type InfoboxRow } from "@/lib/codex-entity";
import type { ChronicleEvent } from "@/services/chronicle-data";

export interface MentioningDocument {
  id: string;
  title: string;
}

export function useEntityAttachedWorksheets(entityId: string | undefined) {
  return useQuery({
    queryKey: ["codex-entity-worksheets", entityId],
    queryFn: async (): Promise<AttachedWorksheet[]> => {
      if (!entityId) return [];
      const { data, error } = await supabase
        .from("entity_worksheets")
        .select("worksheet_id, is_primary, worksheets(id, title, tool_type, data, updated_at)")
        .eq("entity_id", entityId);
      if (error) throw error;
      const out: AttachedWorksheet[] = [];
      for (const row of (data ?? []) as Array<Record<string, unknown>>) {
        const ws = row.worksheets as Record<string, unknown> | null;
        if (!ws) continue;
        out.push({
          worksheetId: String(row.worksheet_id),
          worksheetTitle: (ws.title as string | null) ?? null,
          toolType: String(ws.tool_type ?? ""),
          isPrimary: row.is_primary === true,
          data: ws.data,
          updatedAt: (ws.updated_at as string | null) ?? null,
        });
      }
      return out;
    },
    enabled: !!entityId,
    staleTime: 15_000,
  });
}

export function useEntityMentions(entityId: string | undefined) {
  return useQuery({
    queryKey: ["codex-entity-mentions", entityId],
    queryFn: async (): Promise<MentioningDocument[]> => {
      if (!entityId) return [];
      const { data, error } = await supabase
        .from("writing_entry_entities")
        .select("writing_entry_id, writing_entries(id, title)")
        .eq("entity_id", entityId);
      if (error) throw error;
      const seen = new Set<string>();
      const out: MentioningDocument[] = [];
      for (const row of (data ?? []) as Array<Record<string, unknown>>) {
        const doc = row.writing_entries as Record<string, unknown> | null;
        const id = String(doc?.id ?? row.writing_entry_id ?? "");
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push({ id, title: String(doc?.title ?? "Untitled") });
      }
      return out;
    },
    enabled: !!entityId,
    staleTime: 15_000,
  });
}

export interface CodexEntityData {
  attached: AttachedWorksheet[];
  infobox: InfoboxRow[];
  events: ChronicleEvent[];
  mentions: MentioningDocument[];
  isLoading: boolean;
}

/** Flatten the chronicle tree and keep events linked to one entity. */
function eventsFor(events: ChronicleEvent[] | undefined, entityId: string): ChronicleEvent[] {
  const out: ChronicleEvent[] = [];
  const walk = (list: ChronicleEvent[]) => {
    for (const e of list) {
      if (e.linkedEntryId === entityId) out.push(e);
      if (e.children?.length) walk(e.children);
    }
  };
  if (events) walk(events);
  return out.sort((a, b) => (a.sortValue ?? 0) - (b.sortValue ?? 0));
}

export function useCodexEntity(worldId: string | undefined, entityId: string | undefined): CodexEntityData {
  const attachedQ = useEntityAttachedWorksheets(entityId);
  const mentionsQ = useEntityMentions(entityId);
  const chronicleQ = useChronicleData(worldId);

  const attached = useMemo(() => attachedQ.data ?? [], [attachedQ.data]);
  const infobox = useMemo(() => (entityId ? buildFactInfobox(attached, entityId) : []), [attached, entityId]);
  const events = useMemo(() => (entityId ? eventsFor(chronicleQ.data?.events, entityId) : []), [chronicleQ.data, entityId]);

  return {
    attached,
    infobox,
    events,
    mentions: mentionsQ.data ?? [],
    isLoading: attachedQ.isLoading || mentionsQ.isLoading || chronicleQ.isLoading,
  };
}
