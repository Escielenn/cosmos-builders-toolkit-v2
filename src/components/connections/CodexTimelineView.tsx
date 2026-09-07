// ---------------------------------------------------------------------------
// CodexTimelineView — the Codex's fourth view (13-THE-LIFT.md §1).
//
// "Entities laid on the Chronicle by lifespan."
//
// The Chronicle page lists events. This lists ENTITIES, on the same axis, so
// the question it answers is the one the Chronicle cannot: who existed at the
// same time as whom. Clicking a bar lands on that entity's Codex page.
//
// Where a writer's declared epoch range and their own linked events disagree,
// the bar shows the declared range and flags the disagreement. It never
// averages the two — see lib/atlas/timeline.ts.
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useEntities } from "@/hooks/use-entity-graph";
import { getChronicleData } from "@/services/chronicle-data";
import { buildTimeline, spanGeometry } from "@/lib/atlas/timeline";
import {
  CASCADE_STAGE_COLORS,
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_LABELS,
  type EntityType,
} from "@/services/entity-graph-types";

interface CodexTimelineViewProps {
  worldId: string;
}

export function CodexTimelineView({ worldId }: CodexTimelineViewProps) {
  const navigate = useNavigate();
  const { data: entities, isLoading: entitiesLoading } = useEntities(worldId);
  const { data: chronicle, isLoading: chronicleLoading } = useQuery({
    queryKey: ["chronicle-data", worldId],
    queryFn: () => getChronicleData(worldId),
    enabled: !!worldId,
    staleTime: 30_000,
  });

  const model = useMemo(
    () => buildTimeline(entities ?? [], chronicle?.events ?? []),
    [entities, chronicle],
  );

  const colour = (t: string) =>
    ENTITY_TYPE_COLORS[t as EntityType] ?? CASCADE_STAGE_COLORS.culture;

  if (entitiesLoading || chronicleLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader size="sm" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
      <div className="xl:col-span-3">
        {model.bounds ? (
          <>
            <div className="mb-2 flex items-baseline justify-between font-mono text-[12px] uppercase tracking-wider text-t4">
              <span>{model.bounds.min}</span>
              <span>{model.spans.length} dated</span>
              <span>{model.bounds.max}</span>
            </div>

            <ul className="sf-sb max-h-[600px] space-y-1 overflow-y-auto border border-sf-line bg-sf-surface p-2">
              {model.spans.map((span) => {
                const geo = spanGeometry(span, model.bounds!);
                return (
                  <li key={span.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/worlds/${worldId}/codex/${span.id}`)}
                      className="group block w-full py-1 text-left"
                      title={`${span.name} — ${span.fromLabel} to ${span.toLabel}`}
                    >
                      <span className="flex items-baseline gap-2">
                        <span className="w-[18ch] shrink-0 truncate text-[13px] text-t2 group-hover:text-t1">
                          {span.name}
                        </span>
                        <span className="relative h-3 flex-1">
                          {/* The track, so a short span still reads as
                              positioned rather than floating. */}
                          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-sf-line-hairline" />
                          <span
                            className="absolute top-1/2 h-2 min-w-[3px] -translate-y-1/2 transition-transform group-hover:scale-y-150"
                            style={{
                              left: `${geo.left * 100}%`,
                              width: `${Math.max(geo.width * 100, 0.6)}%`,
                              background: colour(span.entityType),
                              opacity: span.observed ? 0.65 : 1,
                            }}
                          />
                        </span>
                        {span.conflict && (
                          <AlertTriangle
                            className="h-3 w-3 shrink-0 text-sf-amber"
                            aria-label="Dates disagree"
                          />
                        )}
                        <span className="w-[14ch] shrink-0 truncate text-right font-mono text-[12px] text-t4">
                          {span.fromLabel}
                        </span>
                      </span>
                      {span.conflict && (
                        <span className="ml-[19ch] block font-mono text-[12px] text-sf-amber-text">
                          {span.conflict}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <p className="mt-2 font-mono text-[12px] uppercase tracking-wider text-t4">
              Solid = a range you declared · faded = inferred from linked events
            </p>
          </>
        ) : (
          <div className="flex h-[300px] items-center justify-center border border-sf-line bg-sf-surface px-6 text-center">
            <p className="font-mono text-[12px] uppercase tracking-wider text-t3">
              NOTHING DATED YET. GIVE AN ENTITY AN EPOCH RANGE, OR LINK ONE TO A
              CHRONICLE EVENT.
            </p>
          </div>
        )}
      </div>

      <aside>
        <div className="border border-sf-line bg-sf-surface p-3">
          <h3 className="mb-2 font-heading text-[12px] uppercase tracking-[2px] text-t3">
            Undated
          </h3>
          {model.undated.length === 0 ? (
            <p className="text-[13px] text-t3">Everything here sits on the axis.</p>
          ) : (
            <>
              <ul className="sf-sb max-h-72 space-y-1 overflow-y-auto">
                {model.undated.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/worlds/${worldId}/codex/${e.id}`)}
                      className="flex min-h-hit w-full items-center gap-2 border border-sf-line-interactive px-2 text-left"
                    >
                      <span
                        aria-hidden
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: colour(e.entityType) }}
                      />
                      <span className="truncate text-[13px] text-t2">{e.name}</span>
                      <span className="ml-auto shrink-0 font-mono text-[12px] uppercase tracking-wider text-t4">
                        {ENTITY_TYPE_LABELS[e.entityType as EntityType] ?? e.entityType}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[12px] leading-relaxed text-t3">
                No epoch range and no linked event. Listed, not placed — a bar
                drawn at a guessed date would read exactly like one you meant.
              </p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

export default CodexTimelineView;
