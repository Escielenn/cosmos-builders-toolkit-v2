// ---------------------------------------------------------------------------
// useWorldLexicon, the world's dictionary, live.
//
// Reads what the world already holds through the hooks the rest of the
// product uses (React Query dedupes them with the Manuscript's own reads):
// Codex entities and their aliases, entity-type templates, canon rows (the
// canon facade), Chronicle events, and the POV named on each document. Adds
// the writer's own terms, stored on the world (worlds.settings.writingLexicon
// via useWorldSetting, with its per-device fallback).
//
// A Codex rename or a new entity changes a query; the lexicon rebuilds and
// the assistant drops any flag it now accepts. Nothing here runs per
// keystroke.
// ---------------------------------------------------------------------------

import { useCallback, useMemo } from "react";
import { useEntities } from "@/hooks/use-entity-graph";
import { useEntityTypeTemplates } from "@/hooks/use-entity-type-templates";
import { useChronicleData } from "@/hooks/use-chronicle";
import { useWritingDocuments } from "@/hooks/use-writing-documents";
import { useWorldSetting } from "@/hooks/use-world-setting";
import { useCanonRows } from "@/canon/hooks";
import { entityAliases } from "@/lib/codex-entity";
import { readDocMeta } from "@/lib/document-meta";
import {
  LEXICON_KEY,
  buildWorldLexicon,
  sanitizeLexicon,
  type CustomTerm,
  type WorldLexicon,
} from "@/lib/writing/lexicon";
import type { CanonFactRow } from "@/canon/types";
import type { Entity } from "@/services/entity-graph-types";

function canonStringsOf(rows: readonly CanonFactRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    if (row.superseded_at) continue;
    const v = row.value;
    if (!v || typeof v !== "object") continue;
    if ((v.kind === "text" || v.kind === "enum") && typeof v.value === "string") out.push(v.value);
    else if (v.kind === "text[]" && Array.isArray(v.values)) {
      for (const s of v.values) if (typeof s === "string") out.push(s);
    }
  }
  return out;
}

export interface WorldLexiconState {
  lexicon: WorldLexicon;
  entities: Entity[];
  entityById: Map<string, Entity>;
  custom: CustomTerm[];
  /** True while the terms live in this browser only (settings column absent). */
  customLocal: boolean;
  saveCustom: (list: CustomTerm[]) => void;
}

export function useWorldLexicon(worldId: string | null): WorldLexiconState {
  const id = worldId ?? undefined;
  const { data: entityData } = useEntities(id);
  const { data: templates } = useEntityTypeTemplates(id);
  const { data: chronicle } = useChronicleData(id);
  const { data: canonRows } = useCanonRows(id);
  const { data: documents } = useWritingDocuments(id);
  const stored = useWorldSetting<CustomTerm[]>(id, LEXICON_KEY, sanitizeLexicon, "LEXICON NOT SAVED.");

  const entities = useMemo(() => entityData ?? [], [entityData]);
  const entityById = useMemo(() => new Map(entities.map((e) => [e.id, e])), [entities]);
  const custom = stored.value;

  const povNames = useMemo(() => {
    const out = new Set<string>();
    for (const d of documents ?? []) {
      const pov = readDocMeta(d.metadata).pov.trim();
      if (pov) out.add(pov);
    }
    return [...out];
  }, [documents]);

  const lexicon = useMemo(
    () =>
      buildWorldLexicon({
        entities: entities.map((e) => ({
          id: e.id,
          name: e.name,
          aliases: entityAliases(e.metadata),
          typeLabel: e.custom_type_label,
        })),
        typeLabels: (templates ?? []).map((t) => t.label),
        eventTitles: [...(chronicle?.events ?? []), ...(chronicle?.eras ?? [])].map((e) => e.title),
        canonStrings: canonStringsOf(canonRows ?? []),
        povNames,
        custom,
      }),
    [entities, templates, chronicle, canonRows, povNames, custom],
  );

  const save = stored.save;
  const saveCustom = useCallback((list: CustomTerm[]) => save(sanitizeLexicon(list)), [save]);

  return { lexicon, entities, entityById, custom, customLocal: stored.isLocal, saveCustom };
}
