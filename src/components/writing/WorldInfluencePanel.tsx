/**
 * World tab (Studio editor inspector), the Studio Charter's block:
 *
 *   // WORLD INFLUENCE · EPOCH 2340 · KELLIS BAND
 *   GRAVITY   1.4 g    FELT AS 1.4× HOME. HEAVY. STAIRS ARE A HAZARD.
 *
 * Six to ten facts that touch THIS scene, chosen by the Card (POV, SET IN,
 * WHEN, TIMELINE), each with the consequence its own tool already wrote
 * (Dossier, Surface Cartographer, Gravitas), else value and unit. Below it,
 * folded, the cascade parameters the world runs on and which ones the prose
 * engages (the panel this tab used to be).
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useWorldParameters } from "@/hooks/use-world-parameters";
import { countParameterHits, toPlainText } from "@/lib/world-parameters";
import {
  buildWorldInfluence,
  influenceHeading,
  type InfluenceInput,
  type InfluenceRow,
} from "@/lib/writing/world-influence";
import { accentTextClass } from "@/lib/tool-accents";

const CATEGORY_DOT: Record<string, string> = {
  gravity: "bg-sf-amber",
  rotation: "bg-sf-stellar",
  stellar: "bg-sf-amber",
  hydrosphere: "bg-sf-azure",
  atmosphere: "bg-sf-azure",
  tilt: "bg-sf-emerald",
  geological: "bg-sf-crimson",
  other: "bg-sf-primary",
};

export function WorldInfluencePanel({
  worldId,
  content,
  influence,
  onEditCard,
}: {
  worldId: string;
  content: string | null | undefined;
  /** The scene's resolved world (from the Card), or null before it loads. */
  influence: InfluenceInput | null;
  /** Open the Card so the writer can set POV / SET IN. */
  onEditCard?: () => void;
}): JSX.Element {
  const rows = useMemo(() => (influence ? buildWorldInfluence(influence) : []), [influence]);
  const heading = influence ? influenceHeading(influence) : "// WORLD INFLUENCE";

  return (
    <div className="p-4">
      <h3 className="mb-1 font-mono text-[12px] uppercase text-t3">{heading}</h3>
      {rows.length > 0 ? (
        <ul className="mt-3">
          {rows.map((r) => (
            <InfluenceLine key={r.key} row={r} />
          ))}
        </ul>
      ) : (
        <div className="mt-3 border border-dashed border-sf-line p-3">
          <p className="font-serif text-[14px] italic leading-relaxed text-t2">
            Set the POV and where the scene is SET IN on the Card, and the facts that touch this scene gather here:
            the gravity underfoot, the light overhead, what the viewpoint body makes of both.
          </p>
          {onEditCard && (
            <button
              type="button"
              onClick={onEditCard}
              className="mt-3 inline-flex min-h-hit items-center border border-sf-line-interactive px-3 text-[13px] text-t2 transition-colors hover:border-sf-primary hover:text-t1"
            >
              Open the Card
            </button>
          )}
        </div>
      )}
      <CascadeParameters worldId={worldId} content={content} folded={rows.length > 0} />
    </div>
  );
}

function InfluenceLine({ row }: { row: InfluenceRow }): JSX.Element {
  return (
    <li className="border-b border-sf-line-hairline py-2">
      <div className="flex items-baseline gap-2">
        <span className={`w-[38%] shrink-0 font-mono text-[12px] ${accentTextClass(row.accent)}`}>{row.label}</span>
        <span className="min-w-0 flex-1 break-words font-mono text-[13px] text-t1">{row.value}</span>
      </div>
      {row.narrative && <p className="mt-1 font-sans text-[13px] leading-snug text-t2">{row.narrative}</p>}
      {row.source &&
        (row.href ? (
          <Link to={row.href} className="mt-0.5 block truncate font-sans text-[12px] text-t4 hover:text-sf-primary-text">
            {row.source}
          </Link>
        ) : (
          <span className="mt-0.5 block truncate font-sans text-[12px] text-t4">{row.source}</span>
        ))}
    </li>
  );
}

function CascadeParameters({
  worldId,
  content,
  folded,
}: {
  worldId: string;
  content: string | null | undefined;
  folded: boolean;
}): JSX.Element | null {
  const { data: params, isLoading } = useWorldParameters(worldId);
  const [open, setOpen] = useState(false);
  const plain = useMemo(() => toPlainText(content), [content]);
  const rows = useMemo(
    () => (params ?? []).map((p) => ({ param: p, hits: countParameterHits(plain, p) })),
    [params, plain],
  );
  const engaged = rows.filter((r) => r.hits > 0).length;
  const total = rows.length;
  const show = !folded || open;

  if (isLoading) return null;

  return (
    <div className="mt-5">
      <button
        type="button"
        aria-expanded={show}
        onClick={() => setOpen((o) => !o)}
        disabled={!folded}
        className="flex min-h-hit w-full items-center gap-1.5 text-left font-heading text-sf-eyebrow uppercase text-t4 enabled:hover:text-t2"
      >
        {folded && (show ? <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />)}
        // Cascade parameters
        {total > 0 && <span className="ml-auto font-mono">{engaged}/{total}</span>}
      </button>
      {show && total === 0 && (
        <div className="border border-dashed border-sf-line p-3">
          <p className="font-serif text-[13px] italic leading-relaxed text-t3">
            This world hasn't set its environmental parameters yet.
          </p>
          <Link
            to={`/tools/environmental-chain-reaction?worldId=${worldId}`}
            className="mt-3 inline-flex min-h-hit items-center border border-sf-line-interactive px-3 text-[13px] text-t2 transition-colors hover:border-sf-primary hover:text-t1"
          >
            Open the Cascade tool →
          </Link>
        </div>
      )}
      {show && total > 0 && (
        <>
          <div className="space-y-px">
            {rows.map(({ param, hits }) => (
              <div key={param.slug} className="flex items-center gap-2.5 border-b border-sf-line-hairline py-2">
                <span
                  className={`h-1.5 w-1.5 shrink-0 ${hits > 0 ? CATEGORY_DOT[param.category] ?? "bg-sf-primary" : "border border-sf-line-interactive"}`}
                  aria-hidden="true"
                />
                <span className={`flex-1 font-mono text-[13px] ${hits > 0 ? "text-t2" : "text-t4"}`}>{param.label}</span>
                <span
                  className={`font-mono text-[12px] ${hits > 0 ? "text-sf-primary-text" : "text-t4"}`}
                  title={hits > 0 ? `${hits} reference${hits === 1 ? "" : "s"} in this scene` : "Not referenced yet"}
                >
                  {hits > 0 ? `×${hits}` : "—"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 font-mono text-[12px] text-t4">
            {engaged} of {total} parameter{total === 1 ? "" : "s"} engaged in this scene
          </div>
        </>
      )}
    </div>
  );
}
