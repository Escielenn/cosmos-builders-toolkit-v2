/**
 * PublishToWorldDialog, Creates a world entity from simulator output.
 *
 * When a simulator sends a STELLARFORGE_PUBLISH message (or the user
 * clicks "Publish to World"), this dialog:
 * 1. Runs fuzzy name matching against existing entities
 * 2. Shows EntityMatchDialog if matches found
 * 3. Creates a new entity or links to existing
 *
 * Spec: StellarForge_Final_Remediation_Spec_v2, Issue 4
 */

import { useState, useCallback, useEffect } from "react";
import { Rocket, Globe } from "lucide-react";
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
import { createEntry } from "@/services/world-entries";
import { findFuzzyNameMatches, type EntityMatchCandidate } from "@/services/entity-match";
import EntityMatchDialog from "@/components/tools/EntityMatchDialog";
import type { SimulatorPayload } from "@/hooks/use-simulation-save";
import type { EntryType } from "@/services/world-data";

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

  const entryType: EntryType =
    OUTPUT_TYPE_MAP[payload?.outputType ?? ""] ?? "custom";

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
        title: "Publish failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setIsPublishing(false);
    }
  }, [targetWorld, user, name]);

  const createEntity = useCallback(async () => {
    if (!targetWorld || !user) return;

    setIsPublishing(true);
    try {
      await createEntry(
        {
          worldId: targetWorld,
          title: name.trim(),
          entryType,
          metadata: {
            _simulator_source: simulatorType,
            _simulator_data: payload?.parameters ?? {},
            _simulator_results: payload?.results ?? {},
            ...(narrativeNotes && Object.keys(narrativeNotes).length > 0
              ? { _narrative_notes: narrativeNotes }
              : {}),
          },
        },
        user.id
      );

      toast({
        title: "Published to world",
        description: `"${name.trim()}" has been added as a ${entryType.replace("_", " ")}.`,
      });
      onOpenChange(false);
      setName("");
    } catch (error) {
      toast({
        title: "Publish failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  }, [targetWorld, user, name, entryType, simulatorType, payload, narrativeNotes, toast, onOpenChange]);

  const handleMatchLink = useCallback(
    (_candidate: EntityMatchCandidate) => {
      // Entity already exists, just close and notify
      setMatchDialogOpen(false);
      toast({
        title: "Entity exists",
        description: `"${_candidate.title}" already exists in your world. Simulation data noted.`,
      });
      onOpenChange(false);
    },
    [toast, onOpenChange]
  );

  const handleMatchCreateSeparate = useCallback(() => {
    setMatchDialogOpen(false);
    createEntity();
  }, [createEntity]);

  // No early return on a missing world any more. The dialog opens and asks which
  // world to use, because the alternative was a Publish button that did nothing.

  return (
    <>
      <Dialog open={open && !matchDialogOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-sf-surface border-sf-line-interactive">
          <DialogHeader>
            <DialogTitle className="font-heading text-sm font-light uppercase tracking-[3px] text-sf-teal flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Publish to World
            </DialogTitle>
            <DialogDescription className="text-t2 mt-2">
              Create a world entity from this simulation. It will appear in your
              Codex and knowledge graph.
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
                + Narrative notes will be attached
              </p>
            )}

            {/* Say what is travelling. A writer publishing a system they spent an
                hour on should not have to open the Codex to find out whether the
                numbers came with it. */}
            {hasData ? (
              <p className="text-[13px] text-t4 font-mono uppercase tracking-wider">
                + {fieldCount} {fieldCount === 1 ? "value" : "values"} from the simulation
              </p>
            ) : (
              <p className="text-[13px] leading-relaxed text-sf-amber">
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
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          </DialogFooter>
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
