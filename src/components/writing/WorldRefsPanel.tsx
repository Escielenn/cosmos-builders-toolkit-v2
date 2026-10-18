// ---------------------------------------------------------------------------
// WorldRefsPanel, the Refs tab: every value the writer's tools and
// simulators hold, ranked by what the open scene is about.
//
//   PINNED           what the writer asked to keep in view
//   FOR THIS SCENE   facts about entities in the prose, the POV, the
//                    setting, the subject, one graph hop out; each says why
//   THE WORLD        everything else, by source, folded until opened
//
// Inserting cites the fact (a fact ref that remembers its source and can
// say when the source moves on); the secondary button inserts plain text.
// Every row opens its source (Law III: no dead-end readouts).
//
// Absorbs (Law VII): WorksheetFactsPanel, the unranked list it replaces.
// ---------------------------------------------------------------------------

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, CornerDownLeft, ExternalLink, Pin, Search, Type } from "lucide-react";
import { useStudioWorld } from "@/components/writing/studio-world";
import { PinnedGroup, ReasonTag } from "@/components/writing/RailPins";
import { ConfidenceTag } from "@/components/writing/ConfidenceTag";
import { ProposedFactActions } from "@/components/writing/ProposedFactActions";
import type { PinnedItem } from "@/hooks/use-writing-pins";
import { fuzzyScore, sourceLine, type WorldFact } from "@/lib/writing/world-index";
import { factReason, rankFacts, type RankReason } from "@/lib/writing/scene-context";

interface WorldRefsPanelProps {
  pins: PinnedItem[];
  onUnpin: (pin: PinnedItem) => void;
  onPinSource: (fact: WorldFact) => void;
  onCite: (fact: WorldFact) => void;
  onInsertPlain: (fact: WorldFact) => void;
}

/** A long world is no more usable in a rail than the tools themselves. */
const SCENE_LIMIT = 24;

export function WorldRefsPanel({ pins, onUnpin, onPinSource, onCite, onInsertPlain }: WorldRefsPanelProps): JSX.Element | null {
  const world = useStudioWorld();
  const [filter, setFilter] = useState("");
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());

  const ranked = useMemo(() => (world ? rankFacts(world.facts, world.scene) : []), [world]);
  const scene = useMemo(() => ranked.filter((r) => r.reason !== null), [ranked]);
  const sceneRefs = useMemo(() => new Set(scene.map((r) => r.item.ref)), [scene]);

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; title: string; facts: WorldFact[]; href: string | null; pinnable: boolean }>();
    for (const { item } of ranked) {
      if (sceneRefs.has(item.ref)) continue;
      // Stored canon facts group by subject, not by row: one "Canon · Kellis".
      const key =
        item.sourceKind === "canon"
          ? `canon:${item.entityId ?? "world"}`
          : item.sourceId ?? `entity:${item.entityId ?? item.tool}`;
      let g = map.get(key);
      if (!g) {
        g = {
          key,
          title: sourceLine(item),
          facts: [],
          href: item.href,
          pinnable: item.sourceKind === "worksheet",
        };
        map.set(key, g);
      }
      g.facts.push(item);
    }
    return [...map.values()];
  }, [ranked, sceneRefs]);

  const filtered = useMemo(() => {
    const q = filter.trim();
    if (!q || !world) return null;
    return ranked
      .map((r) => ({
        ...r,
        score: Math.max(fuzzyScore(q, r.item.label), fuzzyScore(q, `${r.item.sourceTitle} ${r.item.label}`) * 0.9, fuzzyScore(q, r.item.value) * 0.6),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 60);
  }, [filter, ranked, world]);

  if (!world) return null;

  if (world.loading) {
    return <p className="px-4 py-6 font-mono text-[12px] uppercase text-t3">// Reading tool data…</p>;
  }

  if (world.facts.length === 0) {
    return (
      <div className="px-4 py-6">
        <PinnedGroup pins={pins} onUnpin={onUnpin} />
        <p className="mb-2 mt-3 font-heading text-sf-eyebrow uppercase text-t3">No tool data yet</p>
        <p className="mb-4 font-serif text-[14px] leading-relaxed text-t2">
          Fill in a worldbuilding tool, lock in a simulation, or log an event in the Chronicle, and the values show up
          here ready to cite in your prose.
        </p>
        <Link
          to="/guide/tools"
          className="inline-flex min-h-hit items-center gap-1.5 border border-sf-line px-3 text-[13px] text-t2 transition-colors hover:border-sf-primary hover:text-t1"
        >
          Browse the tools <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const row = (f: WorldFact, reason: RankReason | null, showSource: boolean) => (
    <FactRow key={f.ref} fact={f} reason={reason} showSource={showSource} onCite={onCite} onInsertPlain={onInsertPlain} />
  );

  return (
    <div className="pb-3">
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-t4" aria-hidden="true" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter values"
            aria-label="Filter values"
            className="min-h-hit w-full pl-7 pr-2 font-sans text-[16px] text-t1 placeholder:text-t3"
          />
        </div>
        <p className="mt-1 font-sans text-[12px] text-t4">
          Tip: type / in the prose, or press Ctrl/Cmd+J, to cite without leaving the sentence.
        </p>
      </div>

      {filtered ? (
        <ul aria-label="Matching values" className="px-3">
          {filtered.length === 0 && <li className="py-3 font-mono text-[12px] uppercase text-t3">NO MATCH ON FILE.</li>}
          {filtered.map((r) => row(r.item, r.reason, true))}
        </ul>
      ) : (
        <>
          <PinnedGroup pins={pins} onUnpin={onUnpin} />

          <section aria-label="For this scene" className="pt-2">
            <h3 className="px-3 pb-1 font-heading text-sf-eyebrow uppercase text-t4">// For this scene</h3>
            {scene.length === 0 ? (
              <p className="px-3 pb-2 font-serif text-[14px] italic leading-relaxed text-t3">
                Mention an entity, or set the POV and SET IN on the Card, and the values that touch this scene rise here.
              </p>
            ) : (
              <ul className="px-3">{scene.slice(0, SCENE_LIMIT).map((r) => row(r.item, r.reason, true))}</ul>
            )}
          </section>

          <section aria-label="The rest of the world" className="pt-3">
            <h3 className="px-3 pb-1 font-heading text-sf-eyebrow uppercase text-t4">// The world</h3>
            {groups.map((g) => {
              const isOpen = openGroups.has(g.key);
              return (
                <div key={g.key} className="border-t border-sf-line-hairline">
                  <div className="flex items-center">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpenGroups((prev) => {
                          const next = new Set(prev);
                          if (next.has(g.key)) next.delete(g.key);
                          else next.add(g.key);
                          return next;
                        })
                      }
                      className="flex min-h-hit min-w-0 flex-1 items-center gap-1.5 px-3 text-left"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-t4" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-t4" aria-hidden="true" />
                      )}
                      <span className="min-w-0 flex-1 truncate font-sans text-[13px] text-t2">{g.title}</span>
                      <span className="shrink-0 font-mono text-[12px] text-t4">{g.facts.length}</span>
                    </button>
                    {g.pinnable && (
                      <button
                        type="button"
                        onClick={() => onPinSource(g.facts[0])}
                        aria-label={`Pin ${g.title}`}
                        title="Pin: keep its key values at the top of the rail"
                        className="flex h-11 w-10 shrink-0 items-center justify-center text-t4 transition-colors duration-fast hover:text-t1"
                      >
                        <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                    {g.href && (
                      <Link
                        to={g.href}
                        aria-label={`Open ${g.title}`}
                        title="Open the source"
                        className="flex h-11 w-10 shrink-0 items-center justify-center text-t4 transition-colors duration-fast hover:text-sf-primary-text"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                  {isOpen && <ul className="px-3 pb-1">{g.facts.map((f) => row(f, factReason(f, world.scene), false))}</ul>}
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}

function FactRow({
  fact,
  reason,
  showSource,
  onCite,
  onInsertPlain,
}: {
  fact: WorldFact;
  reason: RankReason | null;
  showSource: boolean;
  onCite: (f: WorldFact) => void;
  onInsertPlain: (f: WorldFact) => void;
}): JSX.Element {
  const worldId = useStudioWorld()?.worldId;
  return (
    <li className="flex items-center gap-0.5 border-t border-sf-line-hairline first:border-t-0">
      <div className="min-w-0 flex-1 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate font-sans text-[12px] font-medium uppercase text-t3" title={fact.label}>
            {fact.label}
          </span>
          {reason && <ReasonTag reason={reason} />}
          <ConfidenceTag confidence={fact.confidence} outranked={!!fact.outrankedBy} />
        </div>
        <div className="break-words font-mono text-[13px] text-t1">{fact.insert}</div>
        {showSource &&
          (fact.href ? (
            <Link to={fact.href} className="block truncate font-sans text-[12px] text-t3 hover:text-sf-primary-text">
              {sourceLine(fact)}
            </Link>
          ) : (
            <span className="block truncate font-sans text-[12px] text-t3">{sourceLine(fact)}</span>
          ))}
        {fact.confidence === "proposed" && fact.factId && worldId && (
          <div className="pt-1.5">
            <ProposedFactActions worldId={worldId} factId={fact.factId} label={fact.label} />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onCite(fact)}
        aria-label={`Cite ${fact.label} at the cursor`}
        title={`Cite "${fact.insert}" at the cursor (stays linked to its source)`}
        className="flex h-11 w-9 shrink-0 items-center justify-center text-t3 transition-colors duration-fast hover:text-sf-primary-text"
      >
        <CornerDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onInsertPlain(fact)}
        aria-label={`Insert ${fact.label} as plain text`}
        title="Insert as plain text (not linked)"
        className="flex h-11 w-9 shrink-0 items-center justify-center text-t4 transition-colors duration-fast hover:text-t1"
      >
        <Type className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </li>
  );
}

export default WorldRefsPanel;
