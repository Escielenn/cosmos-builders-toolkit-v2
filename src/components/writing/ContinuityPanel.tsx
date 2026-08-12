// ---------------------------------------------------------------------------
// ContinuityPanel, the world answering back.
//
// Reads the facts the writer recorded in their tools and compares them to the
// prose in front of them. This is the one thing a general-purpose writing tool
// cannot do: Scrivener's research folder holds notes, which cannot disagree
// with the manuscript.
//
// Tone matters more than coverage here. These are an editor's margin notes, not
// errors — writers break their own physics deliberately, and a tool that scolds
// them will be switched off. Nothing blocks, nothing is red, and every note
// shows both numbers so the writer decides.
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useWorksheets } from "@/hooks/use-worksheets";
import { extractWorksheetFacts } from "@/lib/worksheet-facts";
import { checkContinuity, checkImplausibility } from "@/lib/continuity";
import { useWorldParameters } from "@/hooks/use-world-parameters";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ContinuityPanelProps {
  worldId: string | undefined;
  /** The open document's HTML. */
  content: string | null | undefined;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContinuityPanel({ worldId, content }: ContinuityPanelProps) {
  // List hook: the single-worksheet hook throws for non-owners.
  const { worksheets } = useWorksheets(worldId);

  const facts = useMemo(
    () =>
      (worksheets ?? []).flatMap((ws) =>
        extractWorksheetFacts(ws.tool_type, ws.data),
      ),
    [worksheets],
  );

  // Tier 2 needs the qualitative cascade drivers the writer chose in the
  // Environmental Chain Reaction tool, not the numeric facts.
  const { data: params } = useWorldParameters(worldId);
  const slugs = useMemo(() => (params ?? []).map((p) => p.slug), [params]);

  const notes = useMemo(
    () => [
      ...checkContinuity(content, facts),
      ...checkImplausibility(content, slugs),
    ],
    [content, facts, slugs],
  );

  if (!worldId) return null;

  if (facts.length === 0 && slugs.length === 0) {
    return (
      <div className="px-4 py-6">
        <p className="mb-2 font-serif text-[15px] italic text-t3">
          Nothing to check against yet
        </p>
        <p className="text-[13px] leading-relaxed text-t2">
          Record your world's numbers in a tool. Gravity, day length, population, a
          drive's cruise velocity. This panel tells you when the prose drifts
          from them.
        </p>
        <Link
          to="/guide/tools"
          className="mt-3 inline-block border border-sf-border px-3 py-2 text-[13px] text-t2 transition-colors hover:border-sf-teal hover:text-t1"
        >
          Browse the tools
        </Link>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="px-4 py-6">
        <p className="mb-1 font-serif text-[15px] italic text-sf-teal">
          Consistent so far
        </p>
        <p className="text-[13px] leading-relaxed text-t2">
          Nothing here contradicts the{" "}
          {facts.length === 1 ? "one fact" : `${facts.length} facts`} your world
          records
          {slugs.length > 0 && (
            <> or the {slugs.length === 1 ? "condition" : `${slugs.length} conditions`} it runs under</>
          )}
          .
        </p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <p className="px-4 pb-2 font-serif text-[13px] italic text-t3">
        {notes.length === 1 ? "One thing to look at" : `${notes.length} things to look at`}
      </p>

      {notes.map((n) => (
        <div key={n.factKey} className="border-b border-white/[0.04] px-4 py-3">
          <p className="mb-1.5 font-serif text-[14px] leading-relaxed text-t1">
            {n.message}
          </p>

          <div className="mb-2 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[1.2px]">
            <span className="text-t4">
              World <span className="text-sf-teal">{n.worldValue}</span>
            </span>
            <span className="text-t5" aria-hidden="true">vs</span>
            <span className="text-t4">
              Prose <span className="text-sf-amber">{n.proseValue}</span>
            </span>
          </div>

          <p className="border-l border-sf-border pl-2 font-serif text-[13px] italic text-t3">
            {n.excerpt}
          </p>
        </div>
      ))}

      <p className="px-4 py-3 font-serif text-[12px] italic text-t4">
        Breaking your own rules on purpose is allowed. This is a reminder, not a
        correction.
      </p>
    </div>
  );
}

export default ContinuityPanel;
