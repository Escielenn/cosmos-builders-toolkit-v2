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
import { useWorldSimulations } from "@/hooks/use-world-simulations";
import { useWorksheetSubjects } from "@/hooks/use-worksheet-subjects";
import { extractWorksheetFacts } from "@/lib/worksheet-facts";
import {
  extractSimulationFacts,
  toContinuityFacts,
  simulationSourceLabel,
} from "@/lib/simulation-facts";
import { checkContinuity, checkImplausibility, checkableSubjects } from "@/lib/continuity";
import { useWorldParameters } from "@/hooks/use-world-parameters";
import { ENTITY_TYPE_LABELS } from "@/services/world-data";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ContinuityPanelProps {
  worldId: string | undefined;
  /** The open document's HTML. */
  content: string | null | undefined;
  /** The world_entries id this document is about, if the writer has chosen one. */
  entityId?: string;
  /** Persist the writer's pick from the ambiguity picker onto the document. */
  onSetEntityId?: (entityId: string) => void;
}

// ---------------------------------------------------------------------------
// Ambiguity picker copy
// ---------------------------------------------------------------------------

const IRREGULAR_PLURALS: Record<string, string> = { species: "Species" };

function pluralSubjectNoun(entryType: string | null, count: number): string {
  const label = entryType ? ENTITY_TYPE_LABELS[entryType] ?? entryType : "Subject";
  if (count === 1) return label.toUpperCase();
  const plural = entryType ? IRREGULAR_PLURALS[entryType] ?? `${label}s` : "Subjects";
  return plural.toUpperCase();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContinuityPanel({ worldId, content, entityId, onSetEntityId }: ContinuityPanelProps) {
  // List hook: the single-worksheet hook throws for non-owners.
  const { worksheets } = useWorksheets(worldId);

  // Simulations are the second source of truth about this world, and until now
  // the Check tab could not see them: a saved Tidelock world could say the
  // terminator sits at 279 K while the prose called it blistering, and nothing
  // would notice.
  const { simulations } = useWorldSimulations(worldId);

  // Which world_entries row each worksheet is linked to (S0). A worksheet
  // with no link is simply absent here — its facts stay subject-less.
  const worksheetIds = useMemo(() => (worksheets ?? []).map((ws) => ws.id), [worksheets]);
  const { data: subjectsByWorksheet } = useWorksheetSubjects(worksheetIds);

  const facts = useMemo(() => {
    const fromWorksheets = (worksheets ?? []).flatMap((ws) =>
      extractWorksheetFacts(ws.tool_type, ws.data, subjectsByWorksheet?.[ws.id]?.entityId ?? null),
    );
    // Per simulation, so each note can name the save it came from. Duplicates
    // across saves are harmless: checkContinuity takes the first fact matching
    // a key, and these arrive newest first. Simulator facts have no subject
    // yet — that arrives with S1/S2 (publish/open-on) — so they fall back to
    // the unscoped side of a subject-scoped check rather than dropping out.
    const fromSimulations = simulations.flatMap((sim) =>
      toContinuityFacts(
        extractSimulationFacts(sim.simulator_type, sim.data),
        simulationSourceLabel(sim.simulator_type, sim.name),
      ),
    );
    // Worksheets first: a value the writer typed outranks one a simulator
    // derived, and checkContinuity takes the first fact matching a key.
    return [...fromWorksheets, ...fromSimulations];
  }, [worksheets, simulations, subjectsByWorksheet]);

  // Tier 2 needs the qualitative cascade drivers the writer chose in the
  // Environmental Chain Reaction tool, not the numeric facts.
  const { data: params } = useWorldParameters(worldId);
  const slugs = useMemo(() => (params ?? []).map((p) => p.slug), [params]);

  // Every entity a worksheet is linked to, by id — used to resolve names for
  // both the picker and the "scene about" bar below.
  const subjectsById = useMemo(() => {
    const byEntity = new Map<string, { title: string; entryType: string | null }>();
    for (const s of Object.values(subjectsByWorksheet ?? {})) {
      byEntity.set(s.entityId, { title: s.title, entryType: s.entryType });
    }
    return byEntity;
  }, [subjectsByWorksheet]);

  // Subjects worth asking about: more than one entity on file that owns a
  // fact this panel can actually check. A world with two planets but only
  // one that ever recorded gravity isn't ambiguous — there's nothing to
  // confuse it with yet.
  const candidateIds = useMemo(() => checkableSubjects(facts), [facts]);
  const candidates = useMemo(
    () =>
      candidateIds.map((id) => ({
        id,
        ...(subjectsById.get(id) ?? { title: "Untitled", entryType: null }),
      })),
    [candidateIds, subjectsById],
  );

  const needsPicker = !entityId && candidates.length > 1 && !!onSetEntityId;
  const currentSubject = entityId ? subjectsById.get(entityId) : undefined;
  const canChangeSubject = !!entityId && !!onSetEntityId && candidates.length > 1;

  const notes = useMemo(
    () =>
      needsPicker
        ? []
        : [
            ...checkContinuity(content, facts, entityId),
            ...checkImplausibility(content, slugs),
          ],
    [content, facts, slugs, entityId, needsPicker],
  );

  if (!worldId) return null;

  if (needsPicker) {
    const allSameType = candidates.every((c) => c.entryType === candidates[0].entryType);
    const noun = pluralSubjectNoun(allSameType ? candidates[0].entryType : null, candidates.length);

    return (
      <div className="px-4 py-6">
        <p className="mb-1 font-serif text-[15px] italic text-t1">
          Ambiguous: {candidates.length} {noun.toLowerCase()} on file.
        </p>
        <p className="mb-3 text-[13px] leading-relaxed text-t2">
          Which is this scene about? Picking one lets the check compare your
          prose to the right numbers instead of every candidate on file.
        </p>
        <div className="space-y-1.5">
          {candidates.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSetEntityId?.(c.id)}
              className="block w-full min-h-hit border border-sf-line-interactive px-3 py-2 text-left text-[13px] text-t2 transition-colors hover:border-sf-teal hover:text-t1"
            >
              {c.title}
              {c.entryType && (
                <span className="ml-2 text-[11px] uppercase tracking-[1.5px] text-t4">
                  {ENTITY_TYPE_LABELS[c.entryType] ?? c.entryType}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Two-way, not a dead end: once a subject is chosen it stays visible and
  // changeable from right here, not buried in a document-settings panel.
  const subjectBar = entityId && (currentSubject || canChangeSubject) && (
    <div className="flex items-center justify-between border-b border-sf-line-hairline px-4 py-2">
      <span className="text-[11px] uppercase tracking-[1.5px] text-t4">
        Scene about <span className="text-t2">{currentSubject?.title ?? "unknown subject"}</span>
      </span>
      {canChangeSubject && (
        <button
          type="button"
          onClick={() => onSetEntityId?.("")}
          className="min-h-hit text-[11px] uppercase tracking-[1.5px] text-sf-teal transition-colors hover:text-sf-teal-bright"
        >
          Change
        </button>
      )}
    </div>
  );

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
          className="mt-3 inline-block border border-sf-line-interactive px-3 py-2 text-[13px] text-t2 transition-colors hover:border-sf-teal hover:text-t1"
        >
          Browse the tools
        </Link>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div>
        {subjectBar}
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
      </div>
    );
  }

  return (
    <div className="py-2">
      {subjectBar}
      <p className="px-4 pb-2 pt-2 font-serif text-[13px] italic text-t3">
        {notes.length === 1 ? "One thing to look at" : `${notes.length} things to look at`}
      </p>

      {notes.map((n) => (
        <div key={n.factKey} className="border-b border-sf-line-hairline px-4 py-3">
          <p className="mb-1.5 font-serif text-[14px] leading-relaxed text-t1">
            {n.message}
          </p>

          <div className="mb-2 flex items-center gap-3 font-mono text-[12px] uppercase tracking-[1.2px]">
            <span className="text-t4">
              World <span className="text-sf-teal">{n.worldValue}</span>
            </span>
            <span className="text-t4 text-[10px]" aria-hidden="true">vs</span>
            <span className="text-t4">
              Prose <span className="text-sf-amber">{n.proseValue}</span>
            </span>
          </div>

          <p className="border-l border-sf-line pl-2 font-serif text-[13px] italic text-t3">
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
