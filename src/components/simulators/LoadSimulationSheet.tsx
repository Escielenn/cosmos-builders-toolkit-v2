/**
 * LoadSimulationSheet — Shows saved simulations for replay.
 *
 * Renders in a side sheet, listing saved simulation states with
 * name, date, and a load button.
 *
 * Spec: StellarForge_Simulator_Addendum — Simulation Save & Replay
 */

import { FolderOpen, Play } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
      <SheetContent side="right" className="w-80 bg-sf-surface border-white/[0.08]">
        <SheetHeader>
          <SheetTitle className="font-heading text-sm font-light uppercase tracking-[3px] text-[#00D4FF] flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Saved Simulations
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {isLoading && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-tier-4 text-center py-4">
              Loading...
            </p>
          )}

          {!isLoading && saves.length === 0 && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-tier-4 text-center py-4">
              No saved simulations
            </p>
          )}

          {saves.map((save) => (
            <div
              key={save.id}
              className="p-3 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-tier-1 truncate">{save.name}</p>
                  <p className="font-mono text-[9px] text-tier-4 mt-0.5">
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
                  className="shrink-0 text-[#00D4FF] hover:text-[#00D4FF]/80"
                >
                  <Play className="w-3.5 h-3.5 mr-1" />
                  Load
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
