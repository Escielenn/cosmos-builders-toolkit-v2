// ---------------------------------------------------------------------------
// WorldInstruments — the INSTRUMENTS space (F6, 13-THE-LIFT.md §1).
//
// "The 27 tools + 5 sims, opened ON an entity, never in a vacuum."
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
  FREE_TOOL_IDS,
  PRO_TOOL_IDS,
  SIMULATOR_TOOL_IDS,
  getToolDisplayName,
  getToolRoute,
} from "@/lib/tools-config";
import { accentChipClass, getToolAccent } from "@/lib/tool-accents";
import { useEntities } from "@/hooks/use-entity-graph";
import { ENTITY_TYPE_LABELS } from "@/services/entity-graph-types";

const ALL_TOOL_IDS = [...FREE_TOOL_IDS, ...PRO_TOOL_IDS];

export default function WorldInstruments() {
  const { worldId } = useParams<{ worldId: string }>();
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
      }))
      .filter((t) => !q || t.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query]);

  const subjects = useMemo(
    () => [...(entities ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [entities],
  );
  const subject = subjects.find((e) => e.id === subjectId) ?? null;

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
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <h1 className="font-serif text-[24px] italic text-t1">Instruments</h1>
      <p className="mt-1 text-[12px] text-t4">
        {tools.length} on file · every one opens on a subject
      </p>

      {/* Pick the subject FIRST. That is the F4 order, and it is why the
          launch links below carry an entityId. */}
      <div className="mt-6 border border-sf-line bg-sf-surface p-3">
        <span className="mb-2 flex items-center gap-1.5 font-heading text-[12px] uppercase tracking-[2px] text-t3">
          <Crosshair className="h-3 w-3" aria-hidden />
          Survey
        </span>
        {isLoading ? (
          <Loader size="sm" />
        ) : subjects.length === 0 ? (
          <p className="text-[13px] text-t3">
            No entities on file yet. Instruments will open blank until this
            world has something to survey —{" "}
            <Link
              to={`/worlds/${worldId}/codex`}
              className="text-sf-primary-text underline-offset-4 hover:underline"
            >
              start in the Codex
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              aria-label="Subject entity"
              className="min-h-hit border border-sf-line-interactive bg-transparent px-2 text-[13px] text-t2"
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
                  className="font-mono text-[12px] uppercase tracking-wider text-t3 underline-offset-4 hover:text-t1 hover:underline"
                >
                  Open its Codex page
                </Link>
                <button
                  type="button"
                  onClick={() => setSubjectId("")}
                  className="ml-auto flex min-h-hit items-center gap-1 px-2 font-mono text-[12px] uppercase tracking-wider text-t3 hover:text-t1"
                >
                  <X className="h-3 w-3" aria-hidden />
                  Clear
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="relative mt-6">
        <Search
          className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-t4"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find an instrument…"
          aria-label="Find an instrument"
          className="h-10 pl-9 text-sm"
        />
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <li key={tool.id}>
            <Link
              to={hrefFor(tool.id)}
              className="flex min-h-hit flex-col justify-center border border-sf-line bg-sf-surface px-3 py-2 transition-colors hover:border-sf-primary"
            >
              <span className="text-[14px] text-t1">{tool.name}</span>
              <span className="mt-0.5 flex items-center gap-2">
                <span
                  className={`border px-1 font-mono text-[12px] uppercase tracking-wider ${accentChipClass(
                    getToolAccent(tool.id),
                  )}`}
                >
                  {tool.isSim ? "Simulator" : "Tool"}
                </span>
                {subject && (
                  <span className="truncate font-mono text-[12px] uppercase tracking-wider text-t4">
                    on {subject.name}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {tools.length === 0 && (
        <p className="mt-6 text-center font-mono text-[12px] uppercase tracking-wider text-t3">
          NO INSTRUMENT MATCHES THAT.
        </p>
      )}
    </div>
  );
}
