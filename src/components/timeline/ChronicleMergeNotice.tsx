/**
 * ChronicleMergeNotice: Timeline is folding into Chronicle.
 *
 * The Tool Charter (#27) says two timeline surfaces is a Law VII violation
 * and Timeline merges into Chronicle. The merge is a 2.0 item
 * (06-BUILD-ORDER.md). Until then this notice, which is not dismissible,
 * sends the writer to the world's Chronicle for canon events, and to its
 * Branches view for divergent timelines.
 */
import { Link } from "react-router-dom";
import { ScrollText } from "lucide-react";
import { Notice } from "@/components/layout/page-chrome";

const LINK =
  "text-sf-primary-text underline underline-offset-2 hover:text-sf-primary-bright inline-flex items-center min-h-hit";

export function ChronicleMergeNotice({ worldId }: { worldId?: string | null }): JSX.Element {
  return (
    <Notice tone="info" icon={<ScrollText className="h-5 w-5" />} className="mb-6">
      <div className="sf-measure">
        <p>
          <span className="font-medium text-t1">Timeline is merging into Chronicle.</span>{" "}
          Chronicle is the world's canonical event record: its events bind to scenes and to the Canon
          Graph. Timeline remains for track-based scheduling inside one worksheet until the merge
          lands in StellarForge 2.0; nothing here is lost when it does.
        </p>
        {worldId ? (
          <p className="mt-1 flex flex-wrap gap-x-4">
            <Link to={`/worlds/${worldId}/chronicle`} className={LINK}>
              Open this world's Chronicle
            </Link>
            <Link to={`/worlds/${worldId}/chronicle?view=branches`} className={LINK}>
              Chronicle Branches view
            </Link>
          </p>
        ) : (
          <p className="mt-1">
            Every world has its own Chronicle.{" "}
            <Link to="/worlds" className={LINK}>
              Choose a world
            </Link>{" "}
            to open it.
          </p>
        )}
      </div>
    </Notice>
  );
}

export default ChronicleMergeNotice;
