/**
 * CascadeRibbon — the whole Environmental Cascade at a glance.
 *
 * A horizontal flow of the six cascade stages (Physics → Environment →
 * Biology → Psychology → Mythology → Culture) plus the Integration/meta
 * layer, each with its stage color and a live tool count. Rendered at the
 * top of the Cascade tab in ToolsWiki so a reader sees the system shape
 * before scrolling the per-stage lists. Instrument register (mono).
 *
 * Pure/derived: reads CASCADE_META + getToolsByCascade. No data writes.
 */
import { ArrowRight } from "lucide-react";
import {
  CASCADE_META,
  getToolsByCascade,
  type CascadePosition,
} from "@/lib/tool-wiki-data";

export function CascadeRibbon(): JSX.Element {
  const stages = (Object.keys(CASCADE_META) as CascadePosition[])
    .sort((a, b) => CASCADE_META[a].order - CASCADE_META[b].order)
    .map((pos) => ({
      pos,
      meta: CASCADE_META[pos],
      count: getToolsByCascade(pos).length,
    }));

  return (
    <div className="no-print mb-8 border border-sf-border bg-sf-surface/40 p-4 md:p-5">
      <div className="mb-4 inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[2.5px] text-sf-teal/80">
        <span aria-hidden className="block h-px w-10 bg-sf-teal/60" />
        <span>// cascade map · upstream shapes downstream</span>
      </div>
      <ol className="flex flex-wrap items-stretch gap-2">
        {stages.map((s, i) => (
          <li key={s.pos} className="flex items-stretch gap-2">
            <div
              className="group flex min-w-[104px] flex-col justify-between border-l-2 bg-sf-void/40 px-3 py-2.5"
              style={{ borderColor: s.meta.color }}
            >
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-mono text-[10px] tabular-nums"
                  style={{ color: s.meta.color }}
                >
                  {s.meta.order <= 6 ? String(s.meta.order).padStart(2, "0") : "··"}
                </span>
                <span
                  className="font-heading text-[12px] font-light uppercase tracking-[1px]"
                  style={{ color: s.meta.color }}
                >
                  {s.meta.label}
                </span>
              </div>
              <span className="mt-1.5 font-mono text-[9px] uppercase tracking-[1px] text-t4">
                {s.count} {s.count === 1 ? "tool" : "tools"}
              </span>
            </div>
            {i < stages.length - 1 && (
              <ArrowRight
                className="h-3.5 w-3.5 shrink-0 self-center text-t5"
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default CascadeRibbon;
