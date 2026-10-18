// ---------------------------------------------------------------------------
// ProposedFactActions, PROMOTE TO CANON and RETRACT for a proposed fact.
//
// Shown anywhere a PROPOSED fact is (the Refs rail, the fact hover card, the
// ledger). Promotion follows the canon rule: it never silently overwrites a
// canon value. When canon already says something else for the same subject
// and predicate, the writer chooses, inline:
//
//   CANON ON FILE: 1.4 g.  [KEEP CANON]  [REPLACE]
//
// KEEP CANON retracts the proposal (the writer has decided). REPLACE
// supersedes the old canon, which is kept with its provenance.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePromoteFact, useRetractFact } from "@/canon/hooks";
import type { CanonFactRow } from "@/canon/types";
import { ACTION_PRIMARY as PRIMARY, ACTION_QUIET as QUIET } from "@/components/writing/action-classes";


export function ProposedFactActions({
  worldId,
  factId,
  label,
  onDone,
}: {
  worldId: string;
  factId: string;
  /** For accessible names: "Surface gravity". */
  label: string;
  onDone?: () => void;
}): JSX.Element {
  const promote = usePromoteFact(worldId);
  const retract = useRetractFact(worldId);
  const { toast } = useToast();
  const [conflict, setConflict] = useState<CanonFactRow | null>(null);
  const busy = promote.isPending || retract.isPending;

  const doPromote = (supersede: boolean) =>
    promote.mutate(
      { id: factId, supersede },
      {
        onSuccess: (r) => {
          if ("status" in r && r.status === "conflict") {
            setConflict(r.existing);
            return;
          }
          setConflict(null);
          toast({ title: supersede ? "CANON REPLACED. PRIOR VALUE KEPT ON FILE." : "PROMOTED TO CANON." });
          onDone?.();
        },
      },
    );

  const doRetract = (why: "retract" | "keep") =>
    retract.mutate(
      { id: factId },
      {
        onSuccess: () => {
          setConflict(null);
          toast({ title: why === "keep" ? "CANON KEPT. PROPOSAL RETRACTED." : "PROPOSAL RETRACTED." });
          onDone?.();
        },
      },
    );

  if (conflict) {
    return (
      <div role="group" aria-label={`Canon conflict for ${label}`} className="flex flex-col gap-2">
        <p className="font-mono text-[12px] uppercase text-sf-amber-text">
          // CANON ON FILE: {conflict.value_text ?? "A DIFFERENT VALUE"}.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => doRetract("keep")} className={QUIET}>
            Keep canon
          </button>
          <button type="button" disabled={busy} onClick={() => doPromote(true)} className={PRIMARY}>
            Replace
          </button>
          <button type="button" disabled={busy} onClick={() => setConflict(null)} className={QUIET}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div role="group" aria-label={`Proposed fact: ${label}`} className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => doPromote(false)}
        aria-label={`Promote ${label} to canon`}
        className={PRIMARY}
      >
        Promote to canon
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => doRetract("retract")}
        aria-label={`Retract proposed ${label}`}
        className={QUIET}
      >
        Retract
      </button>
    </div>
  );
}

export default ProposedFactActions;
