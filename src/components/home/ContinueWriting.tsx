// ---------------------------------------------------------------------------
// ContinueWriting: the signed-in home's first section. Recent worlds, each
// with the document last edited in it and a Continue button that opens it in
// the Studio. A world with a cover shows it, faded, behind its card (1.7). The Prime Law, applied to the front door: the shortest path from
// signing in to the sentence the writer was in the middle of.
// ---------------------------------------------------------------------------

import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { PenLine, Plus } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import WorldIconRenderer from "@/components/world/WorldIconRenderer";
import WorldCardArt from "@/components/world/WorldCardArt";
import { worldCoverUrl } from "@/lib/world-art";
import { UNTITLED_DOC, docHref, type ContinueTarget, type WorldLite } from "@/lib/recent-work";

function ago(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  return formatDistanceToNow(new Date(t), { addSuffix: true });
}

interface ContinueWritingProps {
  targets: ContinueTarget<WorldLite>[];
  isLoading: boolean;
  /** Opens the create-world dialog (shown when there are no worlds yet). */
  onCreateWorld: () => void;
}

export default function ContinueWriting({ targets, isLoading, onCreateWorld }: ContinueWritingProps) {
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
        <p className="font-heading text-sf-eyebrow uppercase text-t4">No worlds yet</p>
        <p className="sf-measure text-sf-body text-t2">
          Create your first world. Give it a name, then pick a star, a planet, and one form of
          life, or skip those and start with a blank world.
        </p>
        <Button variant="sf-primary" size="sf-md" className="gap-2" onClick={onCreateWorld}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New world
        </Button>
      </GlassPanel>
    );
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {targets.map(({ world, doc, lastTouched }) => (
        <li key={world.id}>
          <GlassPanel hover className="relative overflow-hidden h-full">
            <WorldCardArt url={worldCoverUrl(world)} focusY={world.header_image_url ? world.header_image_focus_y : 50} />
            <div className="relative p-4 md:p-5 h-full flex flex-col gap-3">
            <Link
              to={`/worlds/${world.id}`}
              className="flex min-h-hit items-center gap-3 text-t1 hover:text-sf-primary-text transition-colors duration-base"
            >
              <WorldIconRenderer iconId={world.icon ?? "globe"} className="w-6 h-6 shrink-0 text-sf-primary-text" />
              <span className="truncate font-sans text-[18px] font-medium">{world.name}</span>
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
                  <p className="text-sf-body text-t2">No documents yet</p>
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
            </div>
          </GlassPanel>
        </li>
      ))}
    </ul>
  );
}
