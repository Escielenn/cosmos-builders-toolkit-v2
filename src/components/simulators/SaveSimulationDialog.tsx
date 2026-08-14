/**
 * SaveSimulationDialog, Prompts for a name when saving simulation state.
 *
 * Appears when the simulator iframe sends a STELLARFORGE_SAVE message,
 * or when the user clicks "Save" in the wrapper UI.
 *
 * Spec: StellarForge_Simulator_Addendum, Simulation Save & Replay
 */

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
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
import type { SimulatorPayload } from "@/hooks/use-simulation-save";

interface SaveSimulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: SimulatorPayload | null;
  /** `worldId` is the world the save should belong to, chosen here when the
      simulator was opened without one. */
  onSave: (name: string, worldId?: string) => void;
  isSaving: boolean;
  /** The world already in context, if any. */
  worldId?: string;
}

export default function SaveSimulationDialog({
  open,
  onOpenChange,
  payload,
  onSave,
  isSaving,
  worldId,
}: SaveSimulationDialogProps) {
  const [name, setName] = useState(payload?.name ?? "");
  const [chosenWorld, setChosenWorld] = useState<string | undefined>(worldId);

  // Follow the context when it appears, but never clobber a choice made here.
  useEffect(() => {
    if (worldId) setChosenWorld(worldId);
  }, [worldId]);

  // Prefill from the payload each time the dialog opens with new state.
  useEffect(() => {
    if (payload?.name) setName(payload.name);
  }, [payload]);

  const handleSave = () => {
    onSave(name.trim() || "Untitled Simulation", chosenWorld);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-sf-surface border-sf-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-sm font-light uppercase tracking-[3px] text-sf-teal">
            Save Simulation
          </DialogTitle>
          <DialogDescription className="text-t2 mt-2">
            Save the current simulation state for later replay or publishing to your world.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-[13px] font-medium uppercase tracking-[1.5px] text-t3">
              Simulation Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., TRAPPIST-1 Rogue Encounter"
              className="mt-1.5"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          {/* Only asked when the simulator was opened outside a world. A save
              with no world is invisible to the writing surface, which is the
              whole reason to keep one. */}
          {!worldId && (
            <SimulationWorldPicker
              value={chosenWorld}
              onChange={setChosenWorld}
              label="Save into which world"
            />
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !chosenWorld}
            title={!chosenWorld ? "Choose a world first" : undefined}
            className="gap-2"
          >
            {isSaving ? (
              <Loader variant="inline" size="sm" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
