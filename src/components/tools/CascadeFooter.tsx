/**
 * CascadeFooter — surfaces the Environmental Cascade at the tool level.
 * Every tool shows what it "builds on" (upstream) and "feeds into"
 * (downstream), turning the toolset into the connected cascade the
 * product promises. Rendered by ToolPageLayout, so all tools get it
 * consistently. Instrument register (mono), not the warm marketing meld.
 *
 * Data: tool-wiki-data.ts buildsOn / feedsInto. Route = /tools/{id}.
 */
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import {
  getToolWiki,
  CATEGORY_META,
  CASCADE_META,
  type ToolRelationship,
  type ToolCategory,
} from "@/lib/tool-wiki-data";
import { getToolDisplayName, getToolRoute } from "@/lib/tools-config";

const CATEGORY_DOT: Record<ToolCategory, string> = {
  "stars-systems": "bg-sf-amber",
  worlds: "bg-sf-azure",
  life: "bg-sf-emerald",
  civilizations: "bg-sf-violet",
  mythology: "bg-sf-stellar",
  integration: "bg-sf-teal",
};

const STRENGTH_LABEL: Record<string, string> = {
  required: "required",
  recommended: "recommended",
  optional: "optional",
};

function RelCard({ rel }: { rel: ToolRelationship }): JSX.Element {
  const wiki = getToolWiki(rel.toolId);
  const cat = wiki?.category ?? "integration";
  // Strip the "Codename: " prefix for a cleaner card, keep the descriptive half.
  const full = getToolDisplayName(rel.toolId);
  const name = full.includes(":") ? full.split(":")[0].trim() : full;
  // Cascade-layer chip: shows where this tool sits (Physics → … → Culture),
  // so the reader sees the *movement* through the cascade, not just a link.
  const casc = wiki ? CASCADE_META[wiki.cascade] : undefined;
  return (
    <Link
      to={getToolRoute(rel.toolId) ?? `/tools/${rel.toolId}`}
      className="group block border border-sf-border bg-sf-surface/60 p-3.5 transition-colors hover:border-sf-teal/40 hover:bg-sf-surface"
    >
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${CATEGORY_DOT[cat]}`} aria-hidden="true" />
        <span className="font-heading text-[13px] font-light uppercase tracking-[1px] text-t1">{name}</span>
        <span className="ml-auto font-mono text-[12px] uppercase tracking-[1px] text-t5">
          {STRENGTH_LABEL[rel.strength]}
        </span>
      </div>
      {casc && (
        <div className="mt-2 inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[1.5px]">
          <span
            className="h-1 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: casc.color }}
            aria-hidden="true"
          />
          <span style={{ color: casc.color }}>
            {casc.order <= 6 ? `${casc.order} · ` : ""}{casc.label}
          </span>
        </div>
      )}
      <p className="mt-1.5 text-[13px] leading-[1.5] text-t3">{rel.note}</p>
    </Link>
  );
}

export function CascadeFooter({ toolType }: { toolType: string }): JSX.Element | null {
  const wiki = getToolWiki(toolType);
  if (!wiki) return null;
  const buildsOn = wiki.buildsOn ?? [];
  const feedsInto = wiki.feedsInto ?? [];
  if (buildsOn.length === 0 && feedsInto.length === 0) return null;

  const catColor = CATEGORY_META[wiki.category]?.label ?? "";

  return (
    <section className="no-print mt-16 border-t border-dashed border-sf-border pt-10">
      <div className="mb-7 inline-flex items-center gap-3.5 font-mono text-[12px] uppercase tracking-[2.5px] text-sf-teal/80">
        <span aria-hidden className="block h-px w-12 bg-sf-teal/60" />
        <span>// the cascade{catColor ? ` · ${catColor.toLowerCase()}` : ""}</span>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        {buildsOn.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-heading text-[13px] font-light uppercase tracking-[2px] text-t3">
              <ArrowLeft className="h-3.5 w-3.5" /> Builds on
            </h3>
            <div className="space-y-2">
              {buildsOn.map((r) => <RelCard key={r.toolId} rel={r} />)}
            </div>
          </div>
        )}
        {feedsInto.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-heading text-[13px] font-light uppercase tracking-[2px] text-t3">
              Feeds into <ArrowRight className="h-3.5 w-3.5" />
            </h3>
            <div className="space-y-2">
              {feedsInto.map((r) => <RelCard key={r.toolId} rel={r} />)}
            </div>
          </div>
        )}
      </div>
      <p className="mt-6 font-serif text-[13px] italic text-t4">
        Change one thing upstream, and everything downstream shifts.
      </p>
    </section>
  );
}
