// ---------------------------------------------------------------------------
// CanonConflictPrompt, what a producer's save shows when canon disagrees.
//
//   CANON CONFLICT.
//   SURFACE GRAVITY   CANON SAYS 1.4 g · THIS SHEET SAYS 1.1 g
//   [KEEP CANON] [REPLACE]
//
// The worksheet is already secured; only canon waits on the answer. REPLACE
// supersedes (the old row is kept with superseded_at); KEEP CANON changes
// nothing. Never a silent overwrite (Constitution, canon.assert).
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { CanonConflict } from "@/canon/field";
import type { CanonEmit } from "@/canon/field-hooks";

export function CanonConflictPrompt({ conflicts, resolve, dismiss }: Pick<CanonEmit, "conflicts" | "resolve" | "dismiss">): JSX.Element {
  const [busy, setBusy] = useState<CanonConflict | null>(null);
  const act = async (c: CanonConflict, choice: "keep" | "replace") => {
    setBusy(c);
    try {
      await resolve(c, choice);
    } finally {
      setBusy(null);
    }
  };

  return (
    <AlertDialog open={conflicts.length > 0} onOpenChange={(open) => !open && dismiss()}>
      <AlertDialogContent className="max-w-lg rounded-none border-sf-line bg-sf-surface-elevated">
        <AlertDialogHeader>
          <AlertDialogTitle>Canon conflict</AlertDialogTitle>
          <AlertDialogDescription className="text-t2">
            WORKSHEET SECURED. CANON HOLDS A DIFFERENT VALUE. CHOOSE WHICH STANDS.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="sf-sb max-h-[50vh] space-y-4 overflow-y-auto">
          {conflicts.map((c) => (
            <li key={`${c.predicate}|${c.existingId}`} className="space-y-2 border-t border-sf-line-hairline pt-3">
              <p className="font-heading text-sf-eyebrow uppercase text-t4">{c.label}</p>
              <p className="font-mono text-[13px] text-t1">
                <span className="text-t3">CANON SAYS </span>
                {c.canonText}
                <span className="text-t3"> · THIS SHEET SAYS </span>
                {c.sheetText}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="sf-ghost" size="sf-sm" disabled={busy === c} onClick={() => act(c, "keep")}>
                  Keep canon
                </Button>
                <Button type="button" variant="sf-primary" size="sf-sm" disabled={busy === c} onClick={() => act(c, "replace")}>
                  Replace
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <AlertDialogFooter>
          <Button type="button" variant="sf-ghost" size="sf-sm" onClick={dismiss}>
            Decide later
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
