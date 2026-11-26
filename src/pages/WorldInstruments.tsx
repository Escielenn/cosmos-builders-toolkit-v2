// ---------------------------------------------------------------------------
// WorldInstruments — the INSTRUMENTS space (F6, 13-THE-LIFT.md §1).
//
// "Every instrument, simulators included, opened ON an entity, never in a vacuum."
//
// A world had no index of its own instruments: you reached a tool through the
// global marketing catalogue, or a link on the dashboard, or by knowing the
// URL. This is the world's own list, and every launch carries `?worldId=` —
// and `?entityId=` when the writer picks a subject first, which is the whole
// point of F4.
// ---------------------------------------------------------------------------

import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Crosshair, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import {
  INSTRUMENT_IDS,
  PRO_TOOL_IDS,
  SIMULATOR_TOOL_IDS,
  getToolDisplayName,
  getToolRoute,
} from "@/lib/tools-config";
import {
  INSTRUMENT_GROUPS,
  INSTRUMENT_PURPOSE,
  InstrumentGroup,
  InstrumentRow,
  instrumentGroup,
  type InstrumentItem,
} from "@/components/world/InstrumentList";
import { useEntities } from "@/hooks/use-entity-graph";
import { ENTITY_TYPE_LABELS } from "@/services/entity-graph-types";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { PageContainer, PageHeader, Notice } from "@/components/layout/page-chrome";
import { useWorldLayoutContext } from "@/contexts/WorldLayoutContext";
import { worldCrumbs } from "@/lib/world-crumbs";

const ALL_TOOL_IDS = INSTRUMENT_IDS;

/** Time-travel timelines are a Chronicle view, not a /tools route (Law VII). */
const TIME_TRAVEL_NAME = "Time Travel Timelines";

export default function WorldInstruments() {
  useMetaTags({ title: "Instruments" });
  const { worldId } = useParams<{ worldId: string }>();
  const worldChrome = useWorldLayoutContext();
  const { data: entities, isLoading } = useEntities(worldId);
  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");

  const tools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_TOOL_IDS.filter((id) => getToolRoute(id))
      .map((id) => ({
        id,
        name: getToolDisplayName(id),
        isSim: SIMULATOR_TOOL_IDS.includes(id),
        isPro: PRO_TOOL_IDS.includes(id),
      }))
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          (INSTRUMENT_PURPOSE[t.id] ?? "").toLowerCase().includes(q),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query]);

  const subjects = useMemo(
    () => [...(entities ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [entities],
  );
  const subject = subjects.find((e) => e.id === subjectId) ?? null;

  const tq = query.trim().toLowerCase();
  const timeTravelMatches =
    !tq || TIME_TRAVEL_NAME.toLowerCase().includes(tq) || "branches".includes(tq);

  const hrefFor = (toolId: string) => {
    const base = getToolRoute(toolId)!;
    const params = new URLSearchParams();
    if (worldId) params.set("worldId", worldId);
    // F4: an instrument opens ON an entity. There is no blank Genesis that
    // later gets matched to a planet by name.
    if (subjectId) params.set("entityId", subjectId);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <PageContainer variant="space">
      <PageHeader
        size="space"
        breadcrumbs={worldCrumbs({ id: worldId ?? "", name: worldChrome?.worldName }, "Instruments")}
        eyebrow="INSTRUMENTS"
        accent="primary"
        title="Instruments"
        lede="Grouped by cascade layer. Pick a subject first and every instrument opens on it."
      />

      {/* Pick the subject FIRST. That is the F4 order, and it is why the
          launch links below carry an entityId. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-sf-line-hairline py-2">
        <span className="flex items-center gap-1.5 font-heading text-sf-eyebrow uppercase text-t3">
          <Crosshair className="h-3 w-3" aria-hidden />
          Survey
        </span>
        {isLoading ? (
          <Loader size="sm" />
        ) : subjects.length === 0 ? (
          <Notice compact label="NO SUBJECTS ON FILE">
            Instruments will open blank until this world has something to
            survey.{" "}
            <Link
              to={`/worlds/${worldId}/codex`}
              className="text-sf-primary-text underline-offset-4 hover:underline"
            >
              Start in the Codex
            </Link>
            .
          </Notice>
        ) : (
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              aria-label="Subject entity"
              className="min-h-hit px-3 font-sans text-[16px] text-t2"
            >
              <option value="">Open blank (no subject)</option>
              {subjects.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {ENTITY_TYPE_LABELS[e.entity_type]}
                </option>
              ))}
            </select>
            {subject && (
              <>
                <Link
                  to={`/worlds/${worldId}/codex/${subject.id}`}
                  className="inline-flex min-h-hit items-center font-sans text-[14px] text-sf-primary-text underline-offset-4 hover:text-t1 hover:underline"
                >
                  Open its Codex page
                </Link>
                <button
                  type="button"
                  onClick={() => setSubjectId("")}
                  className="ml-auto flex min-h-hit items-center gap-1 px-2 font-sans text-[14px] text-t3 hover:text-t1"
                >
                  <X className="h-3 w-3" aria-hidden />
                  Clear
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Search first (1.6 #18), then the groups. */}
      <div className="relative mt-6">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-t4"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find an instrument"
          aria-label="Find an instrument"
          className="pl-9"
        />
      </div>

      {INSTRUMENT_GROUPS.map((g) => {
        const rows: InstrumentItem[] = tools
          .filter((t) => instrumentGroup(t.id, t.isSim) === g.id)
          .map((t) => ({ ...t, href: hrefFor(t.id) }));
        const showTimeTravel = g.id === "integration" && timeTravelMatches;
        const count = rows.length + (showTimeTravel ? 1 : 0);
        if (count === 0) return null;
        return (
          <InstrumentGroup key={g.id} id={g.id} label={g.label} swatch={g.swatch} count={count}>
            {rows.map((item) => (
              <InstrumentRow key={item.id} item={item} subjectName={subject?.name} />
            ))}
            {showTimeTravel && (
              <InstrumentRow
                item={{
                  id: "time-travel-timelines",
                  name: TIME_TRAVEL_NAME,
                  href: `/worlds/${worldId}/chronicle?view=branches`,
                  isSim: false,
                  isPro: false,
                }}
                tagLabel="View"
              />
            )}
          </InstrumentGroup>
        );
      })}

      {tools.length === 0 && !timeTravelMatches && (
        <p className="mt-6 font-mono text-sf-mono uppercase text-t3">
          NO INSTRUMENT MATCHES THAT.
        </p>
      )}
    </PageContainer>
  );
}
