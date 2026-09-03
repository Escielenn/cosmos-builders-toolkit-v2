/**
 * SubjectEntityBanner — "this instrument is open ON <entity>" (Brief F4).
 *
 * Sits under the back link on every tool page. Says nothing when the tool
 * was opened blank; says so plainly when the id in the URL is not on file.
 */

import { Link } from "react-router-dom";
import { Crosshair } from "lucide-react";
import { useSubjectEntity } from "@/hooks/use-subject-entity";

export default function SubjectEntityBanner({ worldId }: { worldId: string | null | undefined }) {
  const subject = useSubjectEntity();
  if (!subject.id) return null;

  if (subject.isLoading) {
    return (
      <div className="mb-6 font-mono text-[12px] uppercase tracking-wider text-t4">// LOCATING SUBJECT…</div>
    );
  }
  if (subject.isMissing || !subject.entry) {
    return (
      <div className="mb-6 flex items-center gap-2 border border-sf-crimson px-3 py-2 font-mono text-[12px] uppercase tracking-wider text-sf-crimson-text">
        <span>// SUBJECT NOT ON FILE. THIS WORKSHEET WILL SAVE UNATTACHED.</span>
      </div>
    );
  }

  const e = subject.entry;
  const codexHref = worldId ? `/worlds/${worldId}/codex/${e.id}` : null;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 border border-sf-primary bg-sf-primary/[0.06] px-3 py-2">
      <Crosshair className="h-3.5 w-3.5 text-sf-primary-text" aria-hidden />
      <span className="font-mono text-[12px] uppercase tracking-wider text-t3">Surveying</span>
      {codexHref ? (
        <Link to={codexHref} className="font-heading text-[14px] text-t1 underline-offset-4 hover:underline">
          {e.title}
        </Link>
      ) : (
        <span className="font-heading text-[14px] text-t1">{e.title}</span>
      )}
      <span className="font-mono text-[12px] uppercase tracking-wider text-t4">{e.entry_type}</span>
      <span className="ml-auto font-mono text-[12px] uppercase tracking-wider text-t4">
        SAVES ATTACH TO THIS ENTITY
      </span>
    </div>
  );
}
