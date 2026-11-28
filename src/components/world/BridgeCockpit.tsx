// ---------------------------------------------------------------------------
// BridgeCockpit: the world's cockpit (1.6 "Quiet Instrument", finding 17).
//
// One dense grid that answers "where was I, and what is true here?" without
// a single big empty box:
//
//   MANUSCRIPT   focal panel: last scene, word count, Continue
//   CANON        facts / proposed / contradictions (read-only, each a link
//                to where it is edited: Law III, no dead-end readouts)
//   CASCADE      six layers, filled or empty, each opens that layer in the
//                Codex
//   ACTIVITY     the last few edits, compact
//   CHRONICLE    latest events, or an inline "Log first event"
//
// Every empty state is one line and one action. The panels read through
// the existing hooks: canon via src/canon/hooks (never Supabase directly),
// documents via useWritingDocuments, layers via useCodexData (the same
// query the world sidebar already holds, so this costs no extra request).
// ---------------------------------------------------------------------------

import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, PenLine, Plus } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCanonFacts, useCanonRows } from "@/canon/hooks";
import { useWritingDocuments } from "@/hooks/use-writing-documents";
import { useCodexData } from "@/hooks/use-codex-data";
import { useChronicleData } from "@/hooks/use-chronicle";
import { LAYER_LABELS, type CascadeLayer } from "@/services/world-data";
import { manuscriptPath } from "@/lib/manuscript-path";
import RecentActivity from "@/components/world/RecentActivity";
import { cn } from "@/lib/utils";

/**
 * The cascade layers the Codex groups by (Physics joined in 1.9, F-07), in its order. Narrative is the
 * Codex's catch-all, not a cascade layer, so it is not counted here.
 */
const COCKPIT_LAYERS: CascadeLayer[] = [
  "physics",
  "environment",
  "biology",
  "psychology",
  "culture",
  "mythology",
  "technology",
];

/** Cascade colour is a meaning (CLAUDE.md): one fill per layer, never moved. */
const LAYER_FILL: Record<string, string> = {
  physics: "bg-sf-amber border-sf-amber",
  environment: "bg-sf-azure border-sf-azure",
  biology: "bg-sf-emerald border-sf-emerald",
  psychology: "bg-sf-magenta border-sf-magenta",
  culture: "bg-sf-violet border-sf-violet",
  mythology: "bg-sf-stellar border-sf-stellar",
  technology: "bg-sf-violet border-sf-violet",
};

const eyebrow = "font-heading text-sf-eyebrow uppercase text-t4";
const panelLink =
  "inline-flex min-h-hit items-center gap-1 font-sans text-[14px] text-sf-primary-text transition-colors duration-base hover:text-t1";

function ago(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

function PanelHead({ label, action }: { label: string; action?: ReactNode }): JSX.Element {
  return (
    <div className="mb-2 flex min-h-hit items-center justify-between gap-3 border-b border-sf-line-hairline">
      <h2 className={eyebrow}>{label}</h2>
      {action}
    </div>
  );
}

/** One line + one action: the only empty state the cockpit uses. */
function EmptyLine({ text, action }: { text: string; action: ReactNode }): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <p className="font-sans text-[14px] text-t3">{text}</p>
      {action}
    </div>
  );
}

// ── Manuscript (focal) ─────────────────────────────────────────────

function ManuscriptPanel({ worldId }: { worldId: string }): JSX.Element {
  const { data: docs, isLoading } = useWritingDocuments(worldId);
  const { last, words } = useMemo(() => {
    const list = docs ?? [];
    let latest: (typeof list)[number] | null = null;
    let total = 0;
    for (const d of list) {
      total += d.word_count ?? 0;
      if (!latest || new Date(d.updated_at) > new Date(latest.updated_at)) latest = d;
    }
    return { last: latest, words: total };
  }, [docs]);
  const count = docs?.length ?? 0;

  return (
    <GlassPanel glow className="p-4 md:p-5 lg:col-span-7" aria-labelledby="bridge-manuscript">
      <div className="mb-3 flex min-h-hit items-center justify-between gap-3 border-b border-sf-line-hairline">
        <h2 id="bridge-manuscript" className={eyebrow}>Manuscript</h2>
        {count > 0 && (
          <span className="font-mono text-sf-mono uppercase text-t4">
            {count} {count === 1 ? "doc" : "docs"}
          </span>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : last ? (
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <p className={eyebrow}>Last scene</p>
            <p className="mt-1 truncate font-sans text-[20px] font-medium text-t1">
              {last.title || "Untitled"}
            </p>
            <p className="mt-1 font-mono text-[12px] text-t4">Edited {ago(last.updated_at)}</p>
          </div>
          <div className="flex items-end gap-6">
            <div>
              <p className="font-mono text-[28px] leading-none text-t1">{words.toLocaleString()}</p>
              {/* No cn() here: twMerge reads text-sf-eyebrow as a colour and
                  would drop it beside text-t4. */}
              <p className={`${eyebrow} mt-1`}>Words</p>
            </div>
            <Button variant="sf-primary" size="sf-sm" asChild>
              <Link to={manuscriptPath(worldId, last.id)}>
                <PenLine className="mr-2 h-4 w-4" aria-hidden />
                Continue
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <EmptyLine
          text="No scenes yet."
          action={
            <Link to={manuscriptPath(worldId)} className={panelLink}>
              Start the first scene <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          }
        />
      )}
    </GlassPanel>
  );
}

// ── Canon ──────────────────────────────────────────────────────────

function CanonPanel({ worldId }: { worldId: string }): JSX.Element {
  const rows = useCanonRows(worldId);
  const facts = useCanonFacts(worldId);
  const stats = useMemo(() => {
    const live = (rows.data ?? []).filter((r) => !r.superseded_at);
    return {
      canon: live.filter((r) => r.confidence === "canon").length,
      proposed: live.filter((r) => r.confidence === "proposed").length,
      conflicted: (facts.data ?? []).filter((f) => f.conflicted).length,
    };
  }, [rows.data, facts.data]);

  const items: { label: string; n: number; to: string; tone?: "danger" }[] = [
    { label: "Facts", n: stats.canon, to: `/worlds/${worldId}/codex` },
    { label: "Proposed", n: stats.proposed, to: manuscriptPath(worldId) },
    {
      label: "Contradictions",
      n: stats.conflicted,
      to: manuscriptPath(worldId),
      tone: stats.conflicted > 0 ? "danger" : undefined,
    },
  ];

  return (
    <GlassPanel className="p-4 md:p-5 lg:col-span-5">
      <PanelHead label="Canon" />
      {rows.isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : rows.isError ? (
        <p className="font-mono text-sf-mono uppercase text-t3">Canon graph offline.</p>
      ) : (
        <ul className="divide-y divide-sf-line-hairline">
          {items.map((it) => (
            <li key={it.label}>
              <Link
                to={it.to}
                className="group flex min-h-hit items-center justify-between gap-3 transition-colors duration-base"
              >
                <span className="font-sans text-[14px] text-t2 group-hover:text-t1">
                  {it.tone === "danger" && <span className="text-sf-crimson-text" aria-hidden>// </span>}
                  {it.label}
                </span>
                <span
                  className={cn(
                    "font-mono text-[18px]",
                    it.tone === "danger" ? "text-sf-crimson-text" : it.n > 0 ? "text-t1" : "text-t4",
                  )}
                >
                  {it.n}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}

// ── Cascade ────────────────────────────────────────────────────────

function CascadePanel({ worldId }: { worldId: string }): JSX.Element {
  const { data, isLoading } = useCodexData(worldId);
  const layers = useMemo(() => {
    const byKey = new Map((data?.cascadeSections ?? []).map((s) => [s.key, s.elements.length]));
    return COCKPIT_LAYERS.map((key) => ({ key, label: LAYER_LABELS[key], n: byKey.get(key) ?? 0 }));
  }, [data]);
  const filled = layers.filter((l) => l.n > 0).length;

  return (
    <GlassPanel className="p-4 md:p-5 lg:col-span-12">
      <PanelHead
        label="Cascade"
        action={
          <span className="font-mono text-sf-mono uppercase text-t4">
            {filled} / {layers.length} layers
          </span>
        }
      />
      {isLoading ? (
        <Skeleton className="h-12 w-full" />
      ) : (
        <ol className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-6">
          {layers.map((l) => (
            <li key={l.key}>
              <Link
                to={`/worlds/${worldId}/codex?layer=${l.key}`}
                className="group flex min-h-hit flex-col justify-center gap-1.5 py-2"
                aria-label={`${l.label}: ${l.n === 0 ? "empty" : `${l.n} saved`}`}
              >
                <span
                  className={cn(
                    "h-1 w-full border",
                    l.n > 0 ? LAYER_FILL[l.key] : "border-sf-line-interactive bg-transparent",
                  )}
                  aria-hidden
                />
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-sans text-[14px] text-t2 group-hover:text-t1">{l.label}</span>
                  <span className={cn("font-mono text-[12px]", l.n > 0 ? "text-t1" : "text-t4")}>
                    {l.n > 0 ? l.n : "—"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </GlassPanel>
  );
}

// ── Chronicle ──────────────────────────────────────────────────────

function ChroniclePanel({ worldId }: { worldId: string }): JSX.Element {
  const { data, isLoading, isError } = useChronicleData(worldId);
  const latest = useMemo(
    () =>
      [...(data?.events ?? [])]
        .filter((e) => e.eventType !== "era")
        .sort((a, b) => b.sortValue - a.sortValue)
        .slice(0, 4),
    [data],
  );

  return (
    <GlassPanel className="p-4 md:p-5 lg:col-span-5">
      <PanelHead
        label="Chronicle"
        action={
          latest.length > 0 ? (
            <Link to={`/worlds/${worldId}/chronicle`} className={panelLink}>
              Open <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ) : undefined
        }
      />
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : isError ? (
        <p className="font-mono text-sf-mono uppercase text-t3">Chronicle unavailable.</p>
      ) : latest.length === 0 ? (
        <EmptyLine
          text="No events yet."
          action={
            <Link to={`/worlds/${worldId}/chronicle?log=1`} className={panelLink}>
              <Plus className="h-3.5 w-3.5" aria-hidden /> Log first event
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-sf-line-hairline">
          {latest.map((e) => (
            <li key={e.id}>
              <Link
                to={`/worlds/${worldId}/chronicle`}
                className="group flex min-h-hit items-center gap-3"
              >
                <span className="w-24 shrink-0 truncate font-mono text-[12px] text-t4">{e.eventDate}</span>
                <span className="truncate font-sans text-[14px] text-t2 group-hover:text-t1">{e.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}

// ── Cockpit ────────────────────────────────────────────────────────

export function BridgeCockpit({ worldId }: { worldId: string }): JSX.Element {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-12">
      <ManuscriptPanel worldId={worldId} />
      <CanonPanel worldId={worldId} />
      <CascadePanel worldId={worldId} />
      <GlassPanel className="p-4 md:p-5 lg:col-span-7">
        <RecentActivity worldId={worldId} variant="panel" limit={5} />
      </GlassPanel>
      <ChroniclePanel worldId={worldId} />
    </div>
  );
}

export default BridgeCockpit;
