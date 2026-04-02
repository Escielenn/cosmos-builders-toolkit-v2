/**
 * SaveSimulationDialog — Prompts for a name when saving simulation state.
 *
 * Appears when the simulator iframe sends a STELLARFORGE_SAVE message,
 * or when the user clicks "Save" in the wrapper UI.
 *
 * Spec: StellarForge_Simulator_Addendum — Simulation Save & Replay
 */

import { useState } from "react";
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
import type { SimulatorPayload } from "@/hooks/use-simulation-save";

interface SaveSimulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: SimulatorPayload | null;
  onSave: (name: string) => void;
  isSaving: boolean;
}

export default function SaveSimulationDialog({
  open,
  onOpenChange,
  payload,
  onSave,
  isSaving,
}: SaveSimulationDialogProps) {
  const [name, setName] = useState(payload?.name ?? "");

  const handleSave = () => {
    onSave(name.trim() || "Untitled Simulation");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-sf-surface border-white/[0.08]">
        <DialogHeader>
          <DialogTitle className="font-heading text-sm font-light uppercase tracking-[3px] text-[#00D4FF]">
            Save Simulation
          </DialogTitle>
          <DialogDescription className="text-tier-2 mt-2">
            Save the current simulation state for later replay or publishing to your world.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-[11px] font-medium uppercase tracking-[1.5px] text-tier-3">
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
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
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
