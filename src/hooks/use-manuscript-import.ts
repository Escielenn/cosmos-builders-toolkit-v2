// ---------------------------------------------------------------------------
// useManuscriptImport, writes a confirmed import preview into a world.
//
// Additive only: every row is a new world_entries row (client-made ids, so a
// chunk's children can name their parents before the server answers). Top
// level names that collide with the binder's are suffixed. Nothing existing
// is read for writing, moved or overwritten, so there is nothing to snapshot.
//
// Rows go in chunks of 50, parents before children, and the hook yields to
// the browser between chunks so a 400-document import never freezes the
// page. A failure stops the run and says how far it got; the rows already
// written stay (they are ordinary documents the writer can trash).
//
// After the rows: Scrivener labels the world lacked are added to its label
// set, and items Scrivener excluded from compile are added to the compile
// exclusions (worlds.settings, with the browser fallback).
// ---------------------------------------------------------------------------

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { WorldEntry } from "@/services/world-data";
import { nextSortOrder } from "@/hooks/use-writing-documents";
import { updateWorldSettingKey } from "@/hooks/use-world-setting";
import { chunkRows, countImport, dedupeTopLevel, planImportRows, type ImportPreview } from "@/lib/manuscript-import";
import { sanitizeLabels } from "@/lib/writing-labels";
import { invalidateWorldEntries } from "@/services/entity-graph-keys";
import { sanitizeCompileSettings, withExcluded } from "@/lib/manuscript/compile";

export interface ImportProgress {
  written: number;
  total: number;
}

export interface ImportOutcome {
  firstDocId: string | null;
  /** Codex entries created from Characters, Places, … folders (Scrivener). */
  entities: number;
  documents: number;
  folders: number;
  words: number;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // RFC 4122 v4 fallback for very old browsers.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const yieldToBrowser = () => new Promise<void>((r) => setTimeout(r, 0));

export class ImportHaltedError extends Error {
  constructor(
    readonly written: number,
    readonly total: number,
    readonly cause: unknown,
  ) {
    super(`IMPORT HALTED. ${written} OF ${total} ENTRIES WRITTEN.`);
  }
}

export function useManuscriptImport(worldId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  const run = useCallback(
    async (preview: ImportPreview, existing: WorldEntry[]): Promise<ImportOutcome> => {
      if (!worldId || !user) throw new Error("SESSION REQUIRED.");
      const root = existing.filter((e) => !e.parent_id);
      const nodes = dedupeTopLevel(preview.nodes, root.map((e) => e.title));
      const rows = planImportRows(nodes, {
        parentId: null,
        rootSortStart: nextSortOrder(root),
        newId,
      });
      const entities = preview.entities ?? [];
      const total = rows.length + entities.length;
      let written = 0;
      setProgress({ written, total });

      for (const chunk of chunkRows(rows, 50)) {
        const { error } = await supabase.from("world_entries").insert(
          chunk.map((r) => ({
            id: r.id,
            world_id: worldId,
            title: r.title,
            entry_type: r.entry_type,
            content: r.content,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            metadata: r.metadata as any,
            sort_order: r.sort_order,
            parent_id: r.parent_id,
            created_by: user.id,
          })),
        );
        if (error) {
          qc.invalidateQueries({ queryKey: ["writing-documents", worldId] });
          throw new ImportHaltedError(written, total, error);
        }
        written += chunk.length;
        setProgress({ written, total });
        await yieldToBrowser();
      }

      // Codex entries (Scrivener Characters, Places, …): new world_entries
      // rows at the top level of the Codex, never inside the manuscript.
      const entityRows = entities.map((e) => ({ ...e, id: newId() }));
      for (let i = 0; i < entityRows.length; i += 50) {
        const chunk = entityRows.slice(i, i + 50);
        const { error } = await supabase.from("world_entries").insert(
          chunk.map((e) => ({
            id: e.id,
            world_id: worldId,
            title: e.title,
            entry_type: e.entryType,
            content: e.html || null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            metadata: { ...(e.summary ? { summary: e.summary } : {}), ...(e.notes ? { notes: e.notes } : {}), imported_from: "scrivener" } as any,
            tags: e.tags,
            sort_order: 0,
            parent_id: null,
            created_by: user.id,
          })),
        );
        if (error) {
          qc.invalidateQueries({ queryKey: ["writing-documents", worldId] });
          invalidateWorldEntries(qc, worldId);
          throw new ImportHaltedError(written, total, error);
        }
        written += chunk.length;
        setProgress({ written, total });
        await yieldToBrowser();
      }
      if (entities.length) invalidateWorldEntries(qc, worldId);

      // Labels and compile exclusions are best-effort: the words are in.
      if (preview.labels && preview.labelsCreated > 0) {
        const created = preview.labels;
        try {
          await updateWorldSettingKey(
            worldId,
            "writingLabels",
            (raw) => {
              const current = sanitizeLabels(raw);
              const have = new Set(current.map((l) => l.id));
              return sanitizeLabels([...current, ...created.filter((l) => !have.has(l.id))]);
            },
            `sf-writing-labels:${worldId}`,
          );
        } catch (e) {
          console.warn("Label merge after import failed:", e);
        }
      }
      const excluded = rows.filter((r) => !r.includeInCompile).map((r) => r.id);
      if (excluded.length) {
        try {
          await updateWorldSettingKey(worldId, "compile", (raw) => withExcluded(sanitizeCompileSettings(raw), excluded));
        } catch (e) {
          console.warn("Compile exclusions after import failed:", e);
        }
      }

      qc.invalidateQueries({ queryKey: ["writing-documents", worldId] });
      qc.invalidateQueries({ queryKey: ["writing-labels", worldId] });
      qc.invalidateQueries({ queryKey: ["world-setting", worldId] });
      const counts = countImport(nodes);
      // First document in reading order (rows are breadth-first).
      const kids = new Map<string | null, typeof rows>();
      for (const r of rows) kids.set(r.parent_id, [...(kids.get(r.parent_id) ?? []), r]);
      const firstDoc = (parent: string | null): string | null => {
        for (const r of kids.get(parent) ?? []) {
          if (r.entry_type === "document") return r.id;
          const inner = firstDoc(r.id);
          if (inner) return inner;
        }
        return null;
      };
      return {
        firstDocId: firstDoc(null),
        entities: entities.length,
        documents: counts.documents,
        folders: counts.folders,
        words: counts.words,
      };
    },
    [worldId, user, qc],
  );

  return { run, progress, reset: () => setProgress(null) };
}
