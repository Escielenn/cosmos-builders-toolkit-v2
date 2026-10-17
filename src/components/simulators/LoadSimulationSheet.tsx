/**
 * LoadSimulationSheet, Shows saved simulations for replay.
 *
 * Renders in a side sheet, listing saved simulation states with
 * name, date, and a load button.
 *
 * Spec: StellarForge_Simulator_Addendum, Simulation Save & Replay
 */

import { FolderOpen, Play } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { EmptyState } from "@/components/ui/empty-state";
import type { SimulationSave } from "@/hooks/use-simulation-save";

interface LoadSimulationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saves: SimulationSave[];
  isLoading: boolean;
  onLoad: (save: SimulationSave) => void;
}

export default function LoadSimulationSheet({
  open,
  onOpenChange,
  saves,
  isLoading,
  onLoad,
}: LoadSimulationSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 bg-sf-surface border-sf-line-interactive">
        <SheetHeader>
          <SheetTitle className="font-heading text-sm font-light uppercase tracking-wide text-sf-primary-text flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Saved Simulations
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {isLoading && (
            <Loader size="sm" message="RETRIEVING SAVES" className="py-4" />
          )}

          {!isLoading && saves.length === 0 && (
            <EmptyState
              hideDial
              title="NO SAVED SIMULATIONS ON FILE."
              description="Save a run from the simulator toolbar to see it here."
            />
          )}

          {saves.map((save) => (
            <div
              key={save.id}
              className="p-3 border border-sf-line bg-sf-surface hover:bg-sf-surface-elevated hover:border-sf-line-emphasis transition-colors duration-base"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-t1 truncate">{save.name}</p>
                  <p className="font-mono text-[12px] text-t4 mt-0.5">
                    {new Date(save.updated_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onLoad(save);
                    onOpenChange(false);
                  }}
                  className="shrink-0 min-h-hit text-sf-primary-text hover:bg-sf-primary/[0.12] hover:text-t1"
                >
                  <Play className="w-3.5 h-3.5 mr-1" />
                  LOAD
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
