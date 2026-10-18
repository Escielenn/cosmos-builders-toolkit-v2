// ---------------------------------------------------------------------------
// SnapshotCompareDialog, read a snapshot against the current text, then
// optionally restore it.
//
// The comparison is word-level (src/lib/word-diff.ts): removed words are
// struck through, added words underlined, so the change never rides on
// colour alone. Restore always snapshots the current text first (the hook
// refuses to restore if that safety capture fails). Register: WRITER.
// ---------------------------------------------------------------------------

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { diffDocuments, htmlToParagraphs } from "@/lib/word-diff";
import {
  SNAPSHOT_REASON_LABEL,
  formatSnapshotTime,
  type DocumentSnapshot,
} from "@/hooks/use-document-versions";

interface SnapshotCompareDialogProps {
  snapshot: DocumentSnapshot | null;
  /** Live HTML of the open document. */
  currentHtml: string;
  onOpenChange: (open: boolean) => void;
  /** Resolves true when the restore went through. */
  onRestore: (snapshot: DocumentSnapshot) => Promise<boolean>;
}

export function SnapshotCompareDialog({
  snapshot,
  currentHtml,
  onOpenChange,
  onRestore,
}: SnapshotCompareDialogProps): JSX.Element {
  const [view, setView] = useState<"changes" | "snapshot">("changes");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const diff = useMemo(
    () => (snapshot ? diffDocuments(snapshot.content, currentHtml) : null),
    [snapshot, currentHtml],
  );
  const snapshotParas = useMemo(
    () => (snapshot && view === "snapshot" ? htmlToParagraphs(snapshot.content) : []),
    [snapshot, view],
  );

  const close = (open: boolean) => {
    if (!open) {
      setConfirming(false);
      setView("changes");
    }
    onOpenChange(open);
  };

  const restore = async () => {
    if (!snapshot) return;
    setBusy(true);
    const ok = await onRestore(snapshot);
    setBusy(false);
    if (ok) close(false);
  };

  const title = snapshot?.name || (snapshot ? SNAPSHOT_REASON_LABEL[snapshot.reason] : "");

  return (
    <Dialog open={!!snapshot} onOpenChange={close}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-4 overflow-hidden">
        <DialogHeader>
          <p className="font-heading text-sf-eyebrow uppercase text-t4">{"// SNAPSHOT"}</p>
          <DialogTitle className="font-serif text-[22px] font-normal italic text-t1">{title}</DialogTitle>
          {snapshot && (
            <DialogDescription className="font-mono text-[12px] text-t3">
              {formatSnapshotTime(snapshot.timestamp)} · {snapshot.wordCount.toLocaleString()} WORDS
              {diff && !diff.identical && (
                <>
                  {" · "}
                  <span className="text-sf-primary-text">+{diff.wordsAdded.toLocaleString()} ADDED</span>
                  {" · "}
                  <span className="text-sf-crimson-text">−{diff.wordsRemoved.toLocaleString()} REMOVED</span>
                  {" SINCE"}
                </>
              )}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex items-center gap-2" role="tablist" aria-label="Snapshot view">
          {(["changes", "snapshot"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`min-h-hit border px-3 font-sans text-[13px] font-medium transition-colors duration-fast ${
                view === v
                  ? "border-sf-primary bg-sf-primary/[0.06] text-sf-primary-text"
                  : "border-sf-line text-t3 hover:border-sf-line-emphasis hover:text-t1"
              }`}
            >
              {v === "changes" ? "Changes since snapshot" : "Snapshot text"}
            </button>
          ))}
          {view === "changes" && (
            <span className="ml-auto hidden font-sans text-[12px] text-t3 sm:inline">
              <span className="text-sf-crimson-text line-through">struck</span> = only in snapshot ·{" "}
              <span className="text-sf-primary-text underline underline-offset-4">underlined</span> = only in current
            </span>
          )}
        </div>

        <div className="sf-sb min-h-0 flex-1 overflow-y-auto border border-sf-line bg-sf-void px-5 py-4">
          <div className="sf-measure mx-auto font-serif text-[16px] leading-relaxed text-t2">
            {view === "snapshot" ? (
              snapshotParas.length ? (
                snapshotParas.map((p, i) => (
                  <p key={i} className="mb-3">
                    {p}
                  </p>
                ))
              ) : (
                <p className="italic text-t3">This snapshot is empty.</p>
              )
            ) : diff?.identical ? (
              <p className="italic text-t3">No differences. The current text matches this snapshot.</p>
            ) : (
              diff?.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className={`mb-3 ${p.kind === "insert" || p.kind === "delete" ? "border-l-2 pl-3" : ""} ${
                    p.kind === "insert" ? "border-sf-primary" : p.kind === "delete" ? "border-sf-crimson" : ""
                  }`}
                >
                  {p.segments.map((s, j) => (
                    <span key={j}>
                      {j > 0 && " "}
                      {s.op === "equal" ? (
                        s.text
                      ) : s.op === "delete" ? (
                        <del className="bg-sf-crimson/[0.08] text-sf-crimson-text">{s.text}</del>
                      ) : (
                        <ins className="bg-sf-primary/[0.08] text-sf-primary-text underline underline-offset-4">
                          {s.text}
                        </ins>
                      )}
                    </span>
                  ))}
                </p>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="items-center gap-2">
          {confirming ? (
            <>
              <p className="mr-auto font-serif text-[14px] italic text-t2">
                The current text is snapshotted first, so this can be undone.
              </p>
              <Button variant="sf-ghost" size="sf-sm" onClick={() => setConfirming(false)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="sf-primary" size="sf-sm" onClick={restore} disabled={busy}>
                {busy ? "Restoring…" : "Confirm restore"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="sf-ghost" size="sf-sm" onClick={() => close(false)}>
                Close
              </Button>
              <Button
                variant="sf-primary"
                size="sf-sm"
                onClick={() => setConfirming(true)}
                disabled={!!diff?.identical}
              >
                Restore this version
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SnapshotCompareDialog;
