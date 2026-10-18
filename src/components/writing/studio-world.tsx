// ---------------------------------------------------------------------------
// studio-world, the world in the room: one memoised index of everything the
// writer made, shared by every surface of the Studio.
//
// useStudioWorldIndex loads the five stores (worksheets, simulation saves,
// entities + connections, Chronicle events + branches) through the hooks the
// rest of the product already uses, so React Query dedupes them, and builds
// the WorldFact list once per data change. The Studio provides the result as
// context, so the rail, the world palette inside each editor (main, split,
// Scrivenings) and the hover cards read the same thing.
//
// Nothing here runs per keystroke: rebuilds follow data, not typing.
// ---------------------------------------------------------------------------

import { createContext, useContext, useEffect, useMemo } from "react";
import { useWorksheets } from "@/hooks/use-worksheets";
import { useWorldSimulations } from "@/hooks/use-world-simulations";
import { useWorksheetSubjects } from "@/hooks/use-worksheet-subjects";
import { useEntities, useEntityConnections } from "@/hooks/use-entity-graph";
import { useChronicleData } from "@/hooks/use-chronicle";
import { useChronicleBranches } from "@/hooks/use-chronicle-branches";
import { buildWorldFacts, indexFacts, type WorldFact } from "@/lib/writing/world-index";
import { setLiveFacts, setLiveEntityNames, clearLiveFacts } from "@/lib/writing/live-facts";
import { useCanonRows } from "@/canon/hooks";
import type { SceneContext } from "@/lib/writing/scene-context";
import type { Entity, EntityConnection } from "@/services/entity-graph-types";

export interface StudioWorld {
  worldId: string;
  loading: boolean;
  facts: WorldFact[];
  factsByRef: Map<string, WorldFact>;
  factsByEntity: Map<string, WorldFact[]>;
  factsBySource: Map<string, WorldFact[]>;
  entities: Entity[];
  entityById: Map<string, Entity>;
  connections: EntityConnection[];
  worksheets: Array<{ id: string; tool_type: string; title: string | null; data: unknown }>;
  simulations: Array<{ id: string; simulator_type: string; name: string; data: unknown }>;
  subjects: Record<string, string | undefined>;
  branches: Array<{ id: string; name: string }>;
  /** The open scene's ranking context (Write fills it in). */
  scene: SceneContext;
  /** Focus mode: chips read as plain text and cards stay closed. */
  focus: boolean;
}

const StudioWorldContext = createContext<StudioWorld | null>(null);

export const StudioWorldProvider = StudioWorldContext.Provider;

/** The Studio's world, or null outside the Studio (wiki pages, notes). */
export function useStudioWorld(): StudioWorld | null {
  return useContext(StudioWorldContext);
}

function groupBy(facts: readonly WorldFact[], key: (f: WorldFact) => string | null): Map<string, WorldFact[]> {
  const out = new Map<string, WorldFact[]>();
  for (const f of facts) {
    const k = key(f);
    if (!k) continue;
    const list = out.get(k);
    if (list) list.push(f);
    else out.set(k, [f]);
  }
  return out;
}

export function useStudioWorldIndex(worldId: string | undefined): Omit<StudioWorld, "scene" | "focus"> {
  const { worksheets: rawWorksheets, isLoading: wsLoading } = useWorksheets(worldId);
  const { simulations, isLoading: simLoading } = useWorldSimulations(worldId);
  const { data: entityData, isLoading: entLoading } = useEntities(worldId);
  const { data: connectionData } = useEntityConnections(worldId);
  const { data: chronicle } = useChronicleData(worldId);
  const { data: branchData } = useChronicleBranches(worldId);

  const worksheets = useMemo(
    () =>
      (rawWorksheets ?? []).map((w) => ({ id: w.id, tool_type: w.tool_type, title: w.title, data: w.data as unknown })),
    [rawWorksheets],
  );
  const worksheetIds = useMemo(() => worksheets.map((w) => w.id), [worksheets]);
  const { data: subjectRows } = useWorksheetSubjects(worksheetIds);
  const subjects = useMemo(() => {
    const out: Record<string, string | undefined> = {};
    for (const [id, s] of Object.entries(subjectRows ?? {})) out[id] = s.entityId;
    return out;
  }, [subjectRows]);

  const entities = useMemo(() => entityData ?? [], [entityData]);
  const connections = useMemo(() => connectionData ?? [], [connectionData]);
  const branches = useMemo(
    () => (branchData?.branches ?? []).map((b) => ({ id: b.id, name: b.name, description: b.description })),
    [branchData],
  );
  const events = useMemo(() => chronicle?.events ?? [], [chronicle]);
  // Stored canon / proposed facts, read through the canon facade. A failed
  // read (e.g. the facts table not yet migrated) leaves the projected index
  // exactly as it was.
  const { data: canonRows } = useCanonRows(worldId);
  const asserted = useMemo(() => canonRows ?? [], [canonRows]);

  const facts = useMemo(
    () =>
      worldId
        ? buildWorldFacts({ worldId, worksheets, simulations, subjects, entities, events, branches, asserted })
        : [],
    [worldId, worksheets, simulations, subjects, entities, events, branches, asserted],
  );

  const loading = !!worldId && (wsLoading || simLoading || entLoading);

  // Publish current values for fact-ref chips (STALE markers).
  useEffect(() => {
    if (loading) return;
    setLiveFacts(new Map(facts.map((f) => [f.ref, { insert: f.insert }])), true);
  }, [facts, loading]);
  // Publish current names for @mention chips (NAME CHANGED markers).
  useEffect(() => {
    if (loading) return;
    setLiveEntityNames(new Map(entities.map((e) => [e.id, e.name])));
  }, [entities, loading]);
  useEffect(() => () => clearLiveFacts(), []);

  return useMemo(
    () => ({
      worldId: worldId ?? "",
      loading,
      facts,
      factsByRef: indexFacts(facts),
      factsByEntity: groupBy(facts, (f) => f.entityId),
      factsBySource: groupBy(facts, (f) => f.sourceId),
      entities,
      entityById: new Map(entities.map((e) => [e.id, e])),
      connections,
      worksheets,
      simulations,
      subjects,
      branches,
    }),
    [worldId, loading, facts, entities, connections, worksheets, simulations, subjects, branches],
  );
}
