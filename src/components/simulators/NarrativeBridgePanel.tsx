/**
 * NarrativeBridgePanel — Slide-out panel bridging simulation physics to narrative.
 *
 * After running a simulation, offers guided cascade questions:
 * Environment → Biology → Culture → Mythology.
 *
 * Uses the simulator aesthetic (cyan on black), rendered by the React
 * wrapper page (not inside the iframe).
 *
 * Spec: StellarForge_Simulator_Addendum — Narrative Bridge
 */

import { useState, useCallback } from "react";
import { PenLine, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SimulatorNarrativeConfig } from "@/lib/simulator-narrative-questions";

interface NarrativeBridgePanelProps {
  config: SimulatorNarrativeConfig;
  /** Current values (keyed by question id) */
  notes: Record<string, string>;
  /** Callback when notes change */
  onNotesChange: (notes: Record<string, string>) => void;
  /** Whether to show the panel */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NarrativeBridgePanel({
  config,
  notes,
  onNotesChange,
  open,
  onOpenChange,
}: NarrativeBridgePanelProps) {
  const updateNote = useCallback(
    (id: string, value: string) => {
      onNotesChange({ ...notes, [id]: value });
    },
    [notes, onNotesChange]
  );

  if (!open) {
    return (
      <button
        onClick={() => onOpenChange(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-[#09090B]/90 border border-white/[0.08] border-r-0 px-2 py-4 hover:bg-[#09090B] transition-colors group"
        title="Narrative Bridge"
      >
        <span className="font-heading text-[9px] uppercase tracking-[2px] text-[#00D4FF]/50 group-hover:text-[#00D4FF] transition-colors [writing-mode:vertical-lr] rotate-180">
          Narrative Bridge
        </span>
        <ChevronRight className="w-3 h-3 text-[#00D4FF]/30 group-hover:text-[#00D4FF]/60 mt-2 mx-auto" />
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 z-30 w-80 bg-[#09090B]/95 backdrop-blur-xl border-l border-white/[0.08] overflow-y-auto animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#09090B]/95 backdrop-blur-xl px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenLine className="w-3.5 h-3.5 text-[#00D4FF]" />
            <span className="font-heading text-[10px] uppercase tracking-[2px] text-[#00D4FF]">
              Narrative Bridge
            </span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-tier-4 hover:text-tier-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-tier-3 mt-1.5 leading-relaxed">
          {config.contextTemplate}
        </p>
      </div>

      {/* Questions */}
      <div className="px-4 py-4 space-y-5">
        {config.questions.map((q) => (
          <div key={q.id}>
            <label
              className="font-heading text-[10px] uppercase tracking-[2px] block mb-1.5"
              style={{ color: q.layerColor }}
            >
              {q.layer}
            </label>
            <p className="text-[11px] text-tier-3 leading-relaxed mb-2">
              {q.prompt}
            </p>
            <Textarea
              value={notes[q.id] ?? ""}
              onChange={(e) => updateNote(q.id, e.target.value)}
              placeholder="Write your thoughts..."
              className="min-h-[80px] bg-white/[0.03] border-white/[0.08] text-tier-2 text-xs resize-y"
            />
          </div>
        ))}

        {/* Filled count indicator */}
        <div className="pt-2 border-t border-white/[0.06]">
          <p className="font-mono text-[9px] text-tier-4 uppercase tracking-wider">
            {Object.values(notes).filter((v) => v.trim()).length} / {config.questions.length} notes written
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing narrative bridge state.
 */
export function useNarrativeBridge() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});

  return {
    open,
    setOpen,
    notes,
    setNotes,
    panelProps: {
      notes,
      onNotesChange: setNotes,
      open,
      onOpenChange: setOpen,
    },
  };
}
