// ---------------------------------------------------------------------------
// ConnectionLegend — what the colours mean in the Web view.
//
// Before F3 this listed tool types, because the nodes were worksheets. The
// nodes are entities now, so it lists the cascade, which is what the colour
// is actually saying: Physics → Environment → Biology → Psychology →
// Mythology → Culture.
// ---------------------------------------------------------------------------

import {
  CASCADE_STAGES,
  CASCADE_STAGE_COLORS,
  CASCADE_STAGE_LABELS,
} from "@/services/entity-graph-types";

interface ConnectionLegendProps {
  /** Node counts per stage; a stage with none reads as absent, not broken. */
  counts?: Partial<Record<string, number>>;
}

const ConnectionLegend = ({ counts }: ConnectionLegendProps) => (
  <div className="border border-sf-line bg-sf-surface p-3">
    <h3 className="mb-2 font-heading text-[12px] uppercase tracking-[2px] text-t3">
      The cascade
    </h3>
    <ul className="space-y-1">
      {CASCADE_STAGES.map((stage) => {
        const n = counts?.[stage];
        return (
          <li key={stage} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0"
              style={{ background: CASCADE_STAGE_COLORS[stage] }}
            />
            <span className="text-[13px] text-t2">
              {CASCADE_STAGE_LABELS[stage]}
            </span>
            {n !== undefined && (
              <span className="ml-auto font-mono text-[12px] text-t4">{n}</span>
            )}
          </li>
        );
      })}
    </ul>
    <p className="mt-3 border-t border-sf-line-hairline pt-2 text-[12px] leading-relaxed text-t3">
      A node is an entity. A worksheet is a property of one, not a node.
      Edge colour is the cascade layer the relation belongs to; a dashed edge
      sits outside the epoch on the scrubber.
    </p>
  </div>
);

export default ConnectionLegend;
