/**
 * PublishToWorldDialog, Creates a world entity from simulator output.
 *
 * When a simulator sends a STELLARFORGE_PUBLISH message (or the user
 * clicks "Publish to World"), this dialog:
 * 1. Shows the typed facts the run will put in canon (sim-canon)
 * 2. Runs fuzzy name matching against existing entities
 * 3. Creates a new entity (plus a child per Solaris planet) or links to one
 * 4. Writes every fact through canon.assert with the run's provenance
 *    (1.9 X6); a value that differs from canon is shown, never overwritten
 *
 * Metadata keeps a per-tool cache only (E12).
 *
 * Spec: StellarForge_Final_Remediation_Spec_v2, Issue 4
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { Rocket, Globe, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import SimulationWorldPicker from "@/components/simulators/SimulationWorldPicker";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createEntry, getEntry, updateEntry } from "@/services/world-entries";
import { mapError } from "@/lib/ship-voice";
import { findFuzzyNameMatches, type EntityMatchCandidate } from "@/services/entity-match";
import EntityMatchDialog from "@/components/tools/EntityMatchDialog";
import type { SimulatorPayload } from "@/hooks/use-simulation-save";
import type { EntryType } from "@/services/world-data";
import { newRunId } from "@/lib/simulators/published-facts";
import { simCanon } from "@/lib/simulators/sim-canon";
import { publishSimRun, simRunMetadata, type PublishConflict, type SimRunSource } from "@/lib/simulators/sim-publish";
import { canon } from "@/canon";
import { canonKeys } from "@/canon/hooks";
import { useQueryClient } from "@tanstack/react-query";

/** Map simulator output types to entity types */
const OUTPUT_TYPE_MAP: Record<string, EntryType> = {
  planet: "planet",
  star_system: "star_system",
  star: "star_system",
  system: "star_system",
  event: "custom",
  observation: "custom",
  encounter: "custom",
  galaxy: "custom",
};

interface PublishToWorldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: SimulatorPayload | null;
  worldId: string | undefined;
  simulatorType: string;
  /** Optional narrative notes to store in metadata */
  narrativeNotes?: Record<string, string>;
}

export default function PublishToWorldDialog({
  open,
  onOpenChange,
  payload,
  worldId,
  simulatorType,
  narrativeNotes,
}: PublishToWorldDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  // Brief S1: "Always a reviewable diff first. Never automatic." The same
  // extractor the Refs panel and the continuity engine read, so what the
  // dialog lists is exactly what travels.
  const sim = useMemo(() => simCanon(simulatorType, payload), [payload, simulatorType]);
  const facts = sim.facts;
  const qc = useQueryClient();
  const [conflicts, setConflicts] = useState<PublishConflict[]>([]);
  const [runSource, setRunSource] = useState<SimRunSource | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [matchCandidates, setMatchCandidates] = useState<EntityMatchCandidate[]>([]);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);

  /**
   * The world to publish into.
   *
   * Falls back to a picker when the simulator was opened outside a world. This
   * dialog used to `return null` in that case, so Publish looked like a dead
   * button: nothing rendered, nothing was logged, and the writer had no way to
   * get their system into a world at all.
   */
  const [chosenWorld, setChosenWorld] = useState<string | undefined>(worldId);
  useEffect(() => {
    if (worldId) setChosenWorld(worldId);
  }, [worldId]);
  const targetWorld = worldId ?? chosenWorld;

  // Pre-fill name from payload
  useEffect(() => {
    if (payload?.name) setName(payload.name);
  }, [payload]);

  // X8: the simulator says what it made. "custom" only for an unknown sim.
  const mapped = OUTPUT_TYPE_MAP[payload?.outputType ?? ""];
  const entryType: EntryType = mapped && mapped !== "custom" ? mapped : sim.entityType;

  /**
   * Does the payload actually carry the simulation, or only a name?
   *
   * This dialog used to publish whatever it was handed, and it was handed
   * `pendingPayload`, which was null until the writer pressed Save. Publishing
   * straight from the simulator therefore wrote `_simulator_data: {}` and the
   * entity arrived in the world as a bare title with empty notes: the numbers
   * were on screen, and none of them made the trip.
   *
   * The pages now refresh the payload before opening this dialog. The count is
   * kept as a guard so a future wiring mistake fails visibly instead of writing
   * another hollow entity.
   */
  const fieldCount =
    Object.keys(payload?.parameters ?? {}).length +
    Object.keys(payload?.results ?? {}).length;
  const hasData = fieldCount > 0;

  const handlePublish = useCallback(async () => {
    if (!targetWorld || !user || !name.trim()) return;

    setIsPublishing(true);
    try {
      // Check for fuzzy matches first
      const matches = await findFuzzyNameMatches(targetWorld, name.trim());
      if (matches.length > 0) {
        setMatchCandidates(matches);
        setMatchDialogOpen(true);
        setIsPublishing(false);
        return;
      }

      // No matches, create new entity
      await createEntity();
    } catch (error) {
      toast({
        title: "PUBLISH FAILED.",
        description: mapError(error),
        variant: "destructive",
      });
      setIsPublishing(false);
    }
  }, [targetWorld, user, name]);

  /** A fresh provenance record for this publish (Law II). */
  const newSource = useCallback(
    (): SimRunSource => ({
      toolId: simulatorType,
      runId: newRunId(),
      seed:
        ((payload?.parameters as Record<string, unknown> | undefined)?.seed as string | number | null | undefined) ?? null,
      publishedAt: new Date().toISOString(),
    }),
    [simulatorType, payload],
  );

  /**
   * Facts into canon for the entity (and its children), then report. Conflicts
   * keep the dialog open so the writer sees both values and chooses.
   */
  const writeRun = useCallback(
    async (rootId: string, children: Record<string, string>, src: SimRunSource) => {
      if (!targetWorld) return;
      const out = await publishSimRun(canon, targetWorld, sim, { root: rootId, children }, src);
      await qc.invalidateQueries({ queryKey: canonKeys.all(targetWorld) });
      const parts = [`${out.written + out.unchanged} ${out.written + out.unchanged === 1 ? "VALUE" : "VALUES"} IN CANON.`];
      if (out.derived) parts.push(`${out.derived} DERIVED.`);
      if (out.stale) parts.push(`${out.stale} DERIVED ${out.stale === 1 ? "VALUE" : "VALUES"} STALE. RECOMPUTATION OFFERED.`);
      toast({ title: "PUBLISHED TO WORLD.", description: parts.join(" ") });
      if (out.conflicts.length) {
        setRunSource(src);
        setConflicts(out.conflicts);
      } else {
        onOpenChange(false);
        setName("");
      }
    },
    [targetWorld, sim, qc, toast, onOpenChange],
  );

  const createEntity = useCallback(async () => {
    if (!targetWorld || !user) return;

    setIsPublishing(true);
    try {
      const src = newSource();
      const root = await createEntry(
        {
          worldId: targetWorld,
          title: name.trim(),
          entryType,
          metadata: simRunMetadata({}, src, facts.filter((f) => !f.child), {
            parameters: payload?.parameters,
            results: payload?.results,
            narrativeNotes,
          }),
        },
        user.id
      );
      // Solaris planets become entities of their own, under the system.
      const children: Record<string, string> = {};
      for (const child of sim.children) {
        const entry = await createEntry(
          {
            worldId: targetWorld,
            title: child.name,
            entryType: child.type,
            parentId: root.id,
            metadata: simRunMetadata({}, src, facts.filter((f) => f.child === child.key), {}),
          },
          user.id,
        );
        children[child.key] = entry.id;
      }
      await writeRun(root.id, children, src);
    } catch (error) {
      toast({
        title: "PUBLISH FAILED.",
        description: mapError(error),
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  }, [targetWorld, user, name, entryType, newSource, facts, payload, narrativeNotes, sim.children, writeRun, toast]);

  // The name matched an existing entity and the writer chose to link to it:
  // attach this run to that entity. Metadata merges per tool (E12), so other
  // tools' runs and provenance stay; facts go through canon like a create.
  // Title and content are not touched.
  const handleMatchLink = useCallback(
    async (candidate: EntityMatchCandidate) => {
      setMatchDialogOpen(false);
      setIsPublishing(true);
      try {
        const existing = await getEntry(candidate.id);
        if (!existing) throw { code: "PGRST116" };
        const prior = (existing.metadata ?? {}) as Record<string, unknown>;
        const src = newSource();
        await updateEntry({
          entryId: candidate.id,
          metadata: simRunMetadata(prior, src, facts.filter((f) => !f.child), {
            parameters: payload?.parameters,
            results: payload?.results,
            narrativeNotes,
          }),
        });
        // Children are not matched by name (ids are the only truth); a linked
        // publish writes only the root entity's facts.
        await writeRun(candidate.id, {}, src);
      } catch (error) {
        toast({
          title: "NOTHING RECORDED.",
          description: mapError(error),
          variant: "destructive",
        });
      } finally {
        setIsPublishing(false);
      }
    },
    [newSource, facts, payload, narrativeNotes, writeRun, toast]
  );

  /** The writer chose this run's values over canon: supersede, history kept. */
  const applyRunValues = useCallback(async () => {
    if (!targetWorld || !runSource) return;
    setIsPublishing(true);
    try {
      for (const c of conflicts) {
        await canon.assert({
          worldId: targetWorld,
          subjectId: c.subjectId,
          predicate: c.fact.predicate,
          value: c.fact.value,
          valueText: c.fact.display,
          unit: c.fact.unit ?? null,
          sourceKind: "sim",
          sourceRef: { tool: runSource.toolId, run_id: runSource.runId, seed: runSource.seed, published_at: runSource.publishedAt },
          supersede: true,
        });
      }
      await qc.invalidateQueries({ queryKey: canonKeys.all(targetWorld) });
      toast({ title: "CANON REVISED.", description: `${conflicts.length} ${conflicts.length === 1 ? "VALUE" : "VALUES"} REPLACED. PRIOR VALUES KEPT IN HISTORY.` });
      setConflicts([]);
      onOpenChange(false);
      setName("");
    } catch (error) {
      toast({ title: "NOTHING RECORDED.", description: mapError(error), variant: "destructive" });
    } finally {
      setIsPublishing(false);
    }
  }, [targetWorld, runSource, conflicts, qc, toast, onOpenChange]);

  const keepCanon = useCallback(() => {
    setConflicts([]);
    onOpenChange(false);
    setName("");
  }, [onOpenChange]);

  const handleMatchCreateSeparate = useCallback(() => {
    setMatchDialogOpen(false);
    createEntity();
  }, [createEntity]);

  // No early return on a missing world any more. The dialog opens and asks which
  // world to use, because the alternative was a Publish button that did nothing.

  return (
    <>
      <Dialog open={open && !matchDialogOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-sf-surface border-sf-line">
          {conflicts.length > 0 ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TriangleAlert className="h-4 w-4 text-sf-amber" aria-hidden />
                  {conflicts.length} {conflicts.length === 1 ? "value differs" : "values differ"} from canon
                </DialogTitle>
                <DialogDescription className="mt-2 text-t2">
                  Everything else from this run is in canon. These values were already decided, so nothing was
                  changed. Choose which to keep.
                </DialogDescription>
              </DialogHeader>
              <ul className="sf-sb mt-2 max-h-56 overflow-y-auto border border-sf-line">
                {conflicts.map((c) => (
                  <li
                    key={`${c.subjectId}:${c.fact.predicate}`}
                    className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 border-b border-sf-line-hairline px-3 py-1.5 last:border-b-0"
                  >
                    <span className="text-[13px] text-t3">{c.fact.label}</span>
                    <span className="font-mono text-[13px] text-t2" title="In canon">
                      {c.existing.value_text ?? "set"}
                    </span>
                    <span className="font-mono text-[13px] text-t1" title="This run">
                      {c.fact.display}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 font-mono text-[12px] uppercase text-t4">Canon · this run</p>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={keepCanon} disabled={isPublishing}>
                  Keep canon
                </Button>
                <Button onClick={applyRunValues} disabled={isPublishing} className="gap-2">
                  {isPublishing ? <Loader variant="inline" size="sm" /> : null}
                  Use this run's values
                </Button>
              </DialogFooter>
            </>
          ) : (
          <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Publish to World
            </DialogTitle>
            <DialogDescription className="text-t2 mt-2">
              Save this simulation as an entity in your world. Its numbers go into
              canon with a record of this run, so a scene can cite them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-[13px] font-medium uppercase tracking-[1.5px] text-t3">
                Entity Name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Kepler-442b, The Great Rogue"
                className="mt-1.5"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handlePublish()}
              />
            </div>

            <div>
              <Label className="text-[13px] font-medium uppercase tracking-[1.5px] text-t3">
                Entity Type
              </Label>
              <p className="text-sm text-t2 mt-1 capitalize">
                {entryType.replace("_", " ")}
              </p>
            </div>

            {!worldId && (
              <SimulationWorldPicker
                value={chosenWorld}
                onChange={setChosenWorld}
                label="Publish into which world"
              />
            )}

            {narrativeNotes && Object.values(narrativeNotes).some((v) => v.trim()) && (
              <p className="text-[13px] text-t4 font-mono uppercase tracking-wider">
                + NARRATIVE NOTES ATTACHED
              </p>
            )}

            {/* Say what is travelling. A writer publishing a system they spent an
                hour on should not have to open the Codex to find out whether the
                numbers came with it. */}
            {hasData ? (
              facts.length > 0 ? (
                <div className="border border-sf-line">
                  <div className="border-b border-sf-line-hairline px-3 py-1.5 font-mono text-[12px] uppercase text-t3">
                    {facts.length} {facts.length === 1 ? "value" : "values"} go to canon
                    {sim.children.length > 0 ? ` · ${sim.children.length} planets as entities` : ""}
                  </div>
                  <ul className="sf-sb max-h-40 overflow-y-auto">
                    {facts.map((f) => (
                      <li
                        key={`${f.child ?? ""}:${f.predicate}`}
                        className="flex items-baseline justify-between gap-3 px-3 py-1"
                      >
                        <span className="text-[13px] text-t3">
                          {f.child ? `${sim.children.find((c) => c.key === f.child)?.name ?? f.child} · ` : ""}
                          {f.label}
                        </span>
                        <span className="shrink-0 font-mono text-[13px] text-t1">{f.display}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="border-t border-sf-line-hairline px-3 py-1.5 text-[12px] text-t3">
                    Gravity, density, escape velocity and habitable-zone edges are worked out from these by the tools
                    that own them.
                  </p>
                </div>
              ) : (
                <p className="text-[13px] text-t3">
                  This run is saved on the entity. It has no numbers that belong in canon yet
                  {simulatorType === "solaris" ? " (generate a system first)" : ""}.
                </p>
              )
            ) : (
              <p className="flex items-start gap-1.5 text-[13px] leading-relaxed text-sf-amber-text">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sf-amber" aria-hidden />
                Reading the simulation. If this does not clear in a moment, close
                this and press Save first, so the entity arrives with its numbers
                rather than just a name.
              </p>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPublishing}>
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing || !name.trim() || !targetWorld || !hasData}
              title={
                !targetWorld
                  ? "Choose a world first"
                  : !hasData
                    ? "Still reading the simulation"
                    : undefined
              }
              className="gap-2"
            >
              {isPublishing ? (
                <Loader variant="inline" size="sm" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              {isPublishing ? "PUBLISHING…" : "Publish"}
            </Button>
          </DialogFooter>
          </>
          )}
        </DialogContent>
      </Dialog>

      <EntityMatchDialog
        open={matchDialogOpen}
        onOpenChange={setMatchDialogOpen}
        worksheetTitle={name}
        candidates={matchCandidates}
        onLink={handleMatchLink}
        onCreateSeparate={handleMatchCreateSeparate}
      />
    </>
  );
}
