// ---------------------------------------------------------------------------
// SimSubjectChip — "this simulator is open ON <entity>" (Brief S1).
//
// The tool pages get SubjectEntityBanner, a full-width band under the back
// link. A simulator's chrome is a row of small controls over a canvas, so the
// same fact takes a chip instead of a banner. Same hook, same truth, one line.
//
// Silent when the sim was opened blank, which is the ordinary case.
// ---------------------------------------------------------------------------

import { Link } from "react-router-dom";
import { Crosshair } from "lucide-react";
import { useSubjectEntity } from "@/hooks/use-subject-entity";

export function SimSubjectChip({ worldId }: { worldId?: string | null }) {
  const subject = useSubjectEntity();
  if (!subject.id) return null;

  if (subject.isLoading) {
    return (
      <span className="flex h-8 items-center px-2 font-mono text-[12px] uppercase tracking-wider text-t4">
        // LOCATING SUBJECT…
      </span>
    );
  }

  if (subject.isMissing || !subject.entry) {
    return (
      <span
        className="flex h-8 items-center gap-1.5 border border-sf-crimson px-2 font-mono text-[12px] uppercase tracking-wider text-sf-crimson-text"
        title="The id in this link is not on file in that world."
      >
        // SUBJECT NOT ON FILE
      </span>
    );
  }

  const entry = subject.entry;
  const label = `${entry.title}${subject.epoch !== null ? ` · ${subject.epoch}` : ""}`;
  const inner = (
    <>
      <Crosshair className="h-3 w-3 shrink-0 text-sf-primary-text" aria-hidden />
      <span className="font-mono text-[12px] uppercase tracking-wider text-t3">On</span>
      <span className="max-w-[18ch] truncate text-[13px] text-t1">{label}</span>
    </>
  );

  const className =
    "flex h-8 items-center gap-1.5 border border-sf-primary bg-sf-primary/[0.06] px-2";

  return worldId ? (
    <Link
      to={`/worlds/${worldId}/codex/${entry.id}`}
      className={`${className} transition-colors hover:border-sf-primary-bright`}
      title="Open this entity's Codex page"
    >
      {inner}
    </Link>
  ) : (
    <span className={className}>{inner}</span>
  );
}

export default SimSubjectChip;
