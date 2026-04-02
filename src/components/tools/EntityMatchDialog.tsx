/**
 * EntityMatchDialog — Ship's-computer-voice dialog shown when a worksheet
 * name fuzzy-matches an existing entity in the same world.
 *
 * "ENTITY MATCH DETECTED. Kepler-442b already exists in this world.
 *  Link this worksheet to the existing record?"
 *
 * Spec: StellarForge_Final_Remediation_Spec_v2 — Issue 2
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link2, FilePlus } from "lucide-react";
import type { EntityMatchCandidate } from "@/services/entity-match";
import { LAYER_LABELS } from "@/services/world-data";

interface EntityMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The name the user entered in the worksheet */
  worksheetTitle: string;
  /** Fuzzy-matched existing entries */
  candidates: EntityMatchCandidate[];
  /** Called when the user picks "Link to Existing" */
  onLink: (candidate: EntityMatchCandidate) => void;
  /** Called when the user picks "Create Separate Entry" */
  onCreateSeparate: () => void;
}

export default function EntityMatchDialog({
  open,
  onOpenChange,
  worksheetTitle,
  candidates,
  onLink,
  onCreateSeparate,
}: EntityMatchDialogProps) {
  const best = candidates[0];
  if (!best) return null;

  const layerLabel = best.layer
    ? (LAYER_LABELS as Record<string, string>)[best.layer] ?? best.layer
    : "this world";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-sf-surface border-white/[0.08]">
        <DialogHeader>
          <DialogTitle className="font-heading text-sm font-light uppercase tracking-[3px] text-primary">
            Entity Match Detected
          </DialogTitle>
          <DialogDescription className="text-tier-2 mt-3 leading-relaxed">
            <span className="font-mono text-tier-1 text-sm">
              &ldquo;{best.title}&rdquo;
            </span>{" "}
            already exists in {layerLabel}.
            <br className="mt-1" />
            Link this worksheet to the existing record? The data profile will be
            added to the existing wiki page.
          </DialogDescription>
        </DialogHeader>

        {candidates.length > 1 && (
          <div className="mt-2 space-y-1">
            <p className="font-mono text-[9px] uppercase tracking-wider text-tier-4">
              Other possible matches
            </p>
            {candidates.slice(1, 4).map((c) => (
              <button
                key={c.id}
                onClick={() => onLink(c)}
                className="w-full text-left px-3 py-1.5 text-xs text-tier-3 hover:text-tier-1 hover:bg-white/[0.04] transition-colors flex items-center justify-between"
              >
                <span>{c.title}</span>
                <span className="font-mono text-[9px] text-tier-5">
                  {Math.round(c.score * 100)}%
                </span>
              </button>
            ))}
          </div>
        )}

        <DialogFooter className="mt-4 flex gap-2 sm:justify-start">
          <Button
            onClick={() => onLink(best)}
            className="gap-2"
          >
            <Link2 className="w-4 h-4" />
            Link to Existing
          </Button>
          <Button
            variant="outline"
            onClick={onCreateSeparate}
            className="gap-2"
          >
            <FilePlus className="w-4 h-4" />
            Create Separate Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
