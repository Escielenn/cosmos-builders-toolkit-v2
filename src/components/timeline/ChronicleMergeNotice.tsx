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

const LINK =
  "text-sf-primary-text underline underline-offset-2 hover:text-sf-primary-bright inline-flex items-center min-h-hit";

export function ChronicleMergeNotice({ worldId }: { worldId?: string | null }): JSX.Element {
  return (
    <div
      role="note"
      className="mb-6 flex items-start gap-3 rounded-none border border-sf-primary bg-sf-primary/[0.04] px-4 py-3"
    >
      <ScrollText className="mt-0.5 h-5 w-5 shrink-0 text-sf-primary-text" aria-hidden="true" />
      <div className="sf-measure text-sm text-t2">
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
    </div>
  );
}

export default ChronicleMergeNotice;
