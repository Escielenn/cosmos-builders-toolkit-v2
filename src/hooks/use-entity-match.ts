/**
 * useEntityMatch — Manages fuzzy entity matching state for a worksheet.
 *
 * After a worksheet is saved and a draft wiki page created, this hook
 * checks for existing entries with similar names. If found, it exposes
 * state for rendering the EntityMatchDialog.
 *
 * Usage in ToolPageLayout:
 *   const entityMatch = useEntityMatch(worldId);
 *   // After worksheet save succeeds:
 *   entityMatch.check(worksheetId, worksheetTitle);
 *   // Render:
 *   <EntityMatchDialog {...entityMatch.dialogProps} />
 */

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  findFuzzyNameMatches,
  linkWorksheetToEntry,
  type EntityMatchCandidate,
} from "@/services/entity-match";

interface UseEntityMatchReturn {
  /** Trigger a fuzzy match check for a worksheet title */
  check: (worksheetId: string, title: string) => Promise<void>;
  /** Props to spread onto EntityMatchDialog */
  dialogProps: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    worksheetTitle: string;
    candidates: EntityMatchCandidate[];
    onLink: (candidate: EntityMatchCandidate) => void;
    onCreateSeparate: () => void;
  };
}

export function useEntityMatch(worldId: string | undefined): UseEntityMatchReturn {
  const queryClient = useQueryClient();
  const [candidates, setCandidates] = useState<EntityMatchCandidate[]>([]);
  const [worksheetTitle, setWorksheetTitle] = useState("");
  const [worksheetId, setWorksheetId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const check = useCallback(
    async (wsId: string, title: string) => {
      if (!worldId || !title || title === "Untitled") return;

      try {
        const matches = await findFuzzyNameMatches(worldId, title);
        if (matches.length > 0) {
          setCandidates(matches);
          setWorksheetTitle(title);
          setWorksheetId(wsId);
          setOpen(true);
        }
      } catch {
        // Best-effort — don't block the save flow
      }
    },
    [worldId]
  );

  const onLink = useCallback(
    async (candidate: EntityMatchCandidate) => {
      if (!worksheetId) return;
      try {
        await linkWorksheetToEntry(worksheetId, candidate.id);
        // Invalidate codex and wiki data so dossier stacking picks it up
        if (worldId) {
          queryClient.invalidateQueries({ queryKey: ["codex-data", worldId] });
          queryClient.invalidateQueries({ queryKey: ["wiki-page"] });
        }
      } catch {
        // Silently handle — the link may already exist
      }
      setOpen(false);
      setCandidates([]);
    },
    [worksheetId, worldId, queryClient]
  );

  const onCreateSeparate = useCallback(() => {
    setOpen(false);
    setCandidates([]);
  }, []);

  return {
    check,
    dialogProps: {
      open,
      onOpenChange: setOpen,
      worksheetTitle,
      candidates,
      onLink,
      onCreateSeparate,
    },
  };
}
