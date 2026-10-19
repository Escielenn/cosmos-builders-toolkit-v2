// ---------------------------------------------------------------------------
// ContinueWriting — the signed-in home's first section. Recent worlds, each
// with the document last edited in it and a CONTINUE that opens it in the
// Studio. The Prime Law, applied to the front door: the shortest path from
// signing in to the sentence the writer was in the middle of.
// ---------------------------------------------------------------------------

import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { PenLine } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import WorldIconRenderer from "@/components/world/WorldIconRenderer";
import { UNTITLED_DOC, docHref, type ContinueTarget, type WorldLite } from "@/lib/recent-work";

function ago(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  return formatDistanceToNow(new Date(t), { addSuffix: true });
}

interface ContinueWritingProps {
  targets: ContinueTarget<WorldLite>[];
  isLoading: boolean;
  /** Opens BEGIN SURVEY (no worlds on file). */
  onBeginSurvey: () => void;
}

export default function ContinueWriting({ targets, isLoading, onBeginSurvey }: ContinueWritingProps) {
  if (isLoading) {
    return (
      <GlassPanel className="p-8 flex items-center justify-center min-h-[160px]">
        <Loader size="sm" />
      </GlassPanel>
    );
  }

  if (targets.length === 0) {
    return (
      <GlassPanel className="p-8 flex flex-col items-start gap-4">
        <p className="font-mono text-sf-mono uppercase text-t3">NO WORLDS ON FILE.</p>
        <p className="sf-measure text-sf-body text-t2">
          A survey names a world, files its star, planet and first species in the Codex, and
          opens Chapter One on the planet.
        </p>
        <Button variant="sf-primary" size="sf-md" onClick={onBeginSurvey}>
          Begin survey
        </Button>
      </GlassPanel>
    );
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {targets.map(({ world, doc, lastTouched }) => (
        <li key={world.id}>
          <GlassPanel hover className="p-5 h-full flex flex-col gap-4">
            <Link
              to={`/worlds/${world.id}`}
              className="flex min-h-hit items-center gap-3 text-t1 hover:text-sf-primary-text transition-colors duration-base"
            >
              <WorldIconRenderer iconId={world.icon ?? "globe"} className="w-6 h-6 shrink-0 text-sf-primary-text" />
              <span className="font-heading text-sf-h3 truncate">{world.name}</span>
            </Link>

            <div className="flex-1 min-w-0">
              <p className="font-heading text-sf-eyebrow uppercase text-t4 mb-1">Last document</p>
              {doc ? (
                <>
                  <p className="text-sf-body text-t2 truncate">{doc.title?.trim() || UNTITLED_DOC}</p>
                  <p className="font-mono text-sf-mono uppercase text-t4 mt-1">
                    EDITED {ago(doc.updated_at).toUpperCase()}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-mono text-sf-mono uppercase text-t3">NO DOCUMENTS ON FILE.</p>
                  <p className="font-mono text-sf-mono uppercase text-t4 mt-1">
                    UPDATED {ago(lastTouched).toUpperCase()}
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {doc ? (
                <Button variant="sf-primary" size="sf-md" className="gap-2" asChild>
                  <Link to={docHref(doc)} aria-label={`Continue ${doc.title?.trim() || UNTITLED_DOC} in ${world.name}`}>
                    <PenLine className="w-4 h-4" aria-hidden="true" />
                    Continue
                  </Link>
                </Button>
              ) : (
                <Button variant="sf-primary" size="sf-md" asChild>
                  <Link to={`/worlds/${world.id}/write`}>Start writing</Link>
                </Button>
              )}
              <Button variant="sf-ghost" size="sf-md" asChild>
                <Link to={`/worlds/${world.id}`}>Open world</Link>
              </Button>
            </div>
          </GlassPanel>
        </li>
      ))}
    </ul>
  );
}
