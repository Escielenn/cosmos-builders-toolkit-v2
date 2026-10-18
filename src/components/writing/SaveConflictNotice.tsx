// ---------------------------------------------------------------------------
// SaveConflictNotice, shown above an editor whose save found the server copy
// moved on (another writer saved first). Non-blocking: the writer can keep
// typing; their words are held (device journal) until they choose.
//
//   KEEP MINE   their version goes on file as a snapshot, then mine saves
//   LOAD THEIRS my version goes on file as a snapshot, then theirs opens
//   COMPARE     the snapshot diff, theirs against mine (restore = LOAD THEIRS)
//
// Neither side is ever lost. Also exports ReadOnlyNotice, for viewers.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { AlertTriangle, Eye } from "lucide-react";
import { SnapshotCompareDialog } from "@/components/writing/SnapshotCompareDialog";
import type { DocumentSnapshot } from "@/hooks/use-document-versions";
import type { ServerDocCopy } from "@/lib/writing/doc-scale";
import { countWords } from "@/lib/text";

export const CONFLICT_SNAPSHOT_ID = "server-copy";

/** Their copy, shaped for SnapshotCompareDialog. */
export function theirsAsSnapshot(docId: string, theirs: ServerDocCopy): DocumentSnapshot {
  const content = theirs.content ?? "";
  return {
    id: CONFLICT_SNAPSHOT_ID,
    documentId: docId,
    title: theirs.title || "Untitled",
    name: "Their version (on the server)",
    reason: "manual",
    content,
    wordCount: countWords(content),
    timestamp: theirs.updated_at ?? new Date().toISOString(),
  };
}

export interface SaveConflictNoticeProps {
  docId: string;
  theirs: ServerDocCopy;
  /** The words on this device (for COMPARE). */
  mine: () => string;
  onKeepMine: () => Promise<boolean>;
  onLoadTheirs: () => Promise<boolean>;
  /** Shown before the message when several documents share a surface. */
  label?: string;
}

export function SaveConflictNotice({
  docId,
  theirs,
  mine,
  onKeepMine,
  onLoadTheirs,
  label,
}: SaveConflictNoticeProps): JSX.Element {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [comparing, setComparing] = useState<{ snap: DocumentSnapshot; mine: string } | null>(null);

  const run = async (fn: () => Promise<boolean>): Promise<boolean> => {
    setBusy(true);
    setFailed(false);
    const ok = await fn().catch(() => false);
    setBusy(false);
    if (!ok) setFailed(true);
    return ok;
  };

  const btn =
    "min-h-hit border px-3 font-sans text-[12px] font-medium uppercase transition-colors duration-base disabled:border-sf-disabled-line disabled:bg-sf-disabled-bg disabled:text-sf-disabled-text";

  return (
    <div
      role="alert"
      className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 border border-sf-amber bg-sf-surface px-4 py-3"
    >
      <AlertTriangle className="h-4 w-4 shrink-0 text-sf-amber" aria-hidden="true" />
      <p className="min-w-[12rem] flex-1 font-mono text-[12px] uppercase text-t1">
        {label ? `${label} · ` : ""}RECORD CHANGED ELSEWHERE.
        <span className="mt-1 block font-sans text-[13px] normal-case text-t2">
          Another session saved this document after you opened it. Your words are held on this device.
          Either choice files the other version as a snapshot first.
        </span>
        {failed && (
          <span className="mt-1 block font-mono text-[12px] uppercase text-sf-crimson-text">
            {"// SNAPSHOT FAILED. NOTHING CHANGED. TRY AGAIN."}
          </span>
        )}
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(onKeepMine)}
          className={`${btn} border-sf-primary bg-sf-primary/[0.06] text-sf-primary-text hover:border-sf-line-emphasis`}
        >
          Keep mine
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(onLoadTheirs)}
          className={`${btn} border-sf-line text-t2 hover:border-sf-line-emphasis hover:text-t1`}
        >
          Load theirs
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setComparing({ snap: theirsAsSnapshot(docId, theirs), mine: mine() })}
          className={`${btn} border-sf-line text-t2 hover:border-sf-line-emphasis hover:text-t1`}
        >
          Compare
        </button>
      </div>
      <SnapshotCompareDialog
        snapshot={comparing?.snap ?? null}
        currentHtml={comparing?.mine ?? ""}
        onOpenChange={(o) => !o && setComparing(null)}
        onRestore={() => run(onLoadTheirs)}
        restoreLabel="Load theirs"
      />
    </div>
  );
}

/** A viewer's editor: read only, said once, no save errors. */
export function ReadOnlyNotice(): JSX.Element {
  return (
    <div role="status" className="mb-6 flex items-center gap-3 border border-sf-line bg-sf-surface px-4 py-3">
      <Eye className="h-4 w-4 shrink-0 text-t3" aria-hidden="true" />
      <p className="font-mono text-[12px] uppercase text-t1">
        READ ONLY. VIEWER ACCESS.
        <span className="mt-1 block font-sans text-[13px] normal-case text-t2">
          The world&apos;s owner can make you an editor.
        </span>
      </p>
    </div>
  );
}
