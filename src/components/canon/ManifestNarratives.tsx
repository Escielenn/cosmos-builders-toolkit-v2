/**
 * ManifestNarratives, the Studio rail's block of consequences (1.9 F-02).
 *
 *   // WHAT THE WORLD SAYS
 *   PHYSICS · ORRERY
 *   3200 K. Most of its light is infrared; the noon sky reads dim amber.
 *   ENVIRONMENT · BALLAST
 *   1.40 g. A fall carries 40% more than on Earth. Stairs are a hazard.
 *
 * Each line is the owning tool's own studio.narrative over the world's canon
 * facts, so a writer sees what a number MEANS beside the page. The tool name
 * is a link to where the number is edited (Law III). A block whose facts are
 * stale says so instead of passing the old consequence off as current.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCanonFacts } from "@/canon/hooks";
import { narrativeBlocks, type NarrativeBlock } from "@/canon/narrate";
import { CASCADE_LAYER_NAME } from "@/canon/tool-layers";
import { accentTextClass, type ToolAccent } from "@/lib/tool-accents";

export function ManifestNarratives({ worldId, subjectIds }: { worldId: string; subjectIds?: readonly string[] }): JSX.Element | null {
  const { data: facts } = useCanonFacts(worldId);
  const blocks = useMemo(() => {
    const all = facts ?? [];
    // Facts about the scene's own subjects first; world facts fill the rest.
    const scoped = subjectIds?.length ? all.filter((f) => !f.subjectId || subjectIds.includes(f.subjectId)) : all;
    return narrativeBlocks(scoped);
  }, [facts, subjectIds]);
  if (blocks.length === 0) return null;
  return (
    <section className="mt-5" aria-label="What the world says">
      <h3 className="mb-2 font-mono text-[12px] uppercase text-t3">// What the world says</h3>
      <ul>
        {blocks.map((b) => (
          <NarrativeItem key={b.toolId} block={b} worldId={worldId} />
        ))}
      </ul>
    </section>
  );
}

function NarrativeItem({ block, worldId }: { block: NarrativeBlock; worldId: string }): JSX.Element {
  const accent = block.accent as ToolAccent;
  return (
    <li className="border-b border-sf-line-hairline py-2">
      <Link
        to={`${block.route}?worldId=${worldId}`}
        className={`inline-flex min-h-hit items-center font-heading text-sf-eyebrow uppercase ${accentTextClass(accent)} hover:text-t1`}
      >
        {CASCADE_LAYER_NAME[block.layer]} · {block.brand}
      </Link>
      {block.stale && (
        <p className="font-mono text-[12px] uppercase text-sf-amber-text">// Upstream revised. Recompute offered in {block.brand}.</p>
      )}
      {block.lines.map((l) => (
        <p key={l} className="mt-0.5 font-sans text-[13px] leading-snug text-t2">
          {l}
        </p>
      ))}
    </li>
  );
}

/**
 * The consequence under a tool readout: a derivation's own narrative for the
 * number on screen (Charter obligation 3). Renders nothing for a value the
 * derivation cannot narrate.
 */
export function ReadoutNarrative({ text, className = "" }: { text: string | null | undefined; className?: string }): JSX.Element | null {
  if (!text) return null;
  return <p className={`sf-measure mt-2 font-sans text-[13px] leading-snug text-t2 ${className}`}>{text}</p>;
}
