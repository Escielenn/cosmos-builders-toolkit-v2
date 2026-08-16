/**
 * NarrativeBridgePanel, Slide-out panel bridging simulation physics to narrative.
 *
 * After running a simulation, offers guided cascade questions:
 * Environment → Biology → Culture → Mythology.
 *
 * Uses the simulator aesthetic (cyan on black), rendered by the React
 * wrapper page (not inside the iframe).
 *
 * Spec: StellarForge_Simulator_Addendum, Narrative Bridge
 */

import { useState, useCallback } from "react";
import { PenLine, X, ChevronLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);

  const updateNote = useCallback(
    (id: string, value: string) => {
      onNotesChange({ ...notes, [id]: value });
      setSaved(false);
    },
    [notes, onNotesChange]
  );

  const handleSave = useCallback(() => {
    // Notes are stored in React state and passed to PublishToWorldDialog.
    // Persist to localStorage as a backup so they survive page refreshes.
    try {
      const key = `sf-narrative-${config.simulatorType}`;
      localStorage.setItem(key, JSON.stringify(notes));
    } catch {}
    setSaved(true);
    toast({ title: "Notes saved", description: "Narrative notes saved locally." });
  }, [notes, config.simulatorType, toast]);

  const filledCount = Object.values(notes).filter((v) => v.trim()).length;

  // Collapsed state, tab button on the right edge.
  // April 2026 handoff: highly visible at rest (sf-teal 80% + glow + chevron),
  // with a filled-count badge so the user knows there's content waiting.
  if (!open) {
    return (
      <button
        onClick={() => onOpenChange(true)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-sf-teal/[0.08] border border-sf-teal/40 border-r-0 px-2.5 py-5 hover:bg-sf-teal/[0.16] hover:border-sf-teal/70 transition-colors duration-base group shadow-[0_0_18px_rgba(21,193,123,0.18)]"
        title="Open Narrative Bridge"
        aria-label="Open Narrative Bridge"
      >
        <ChevronLeft className="w-3.5 h-3.5 text-sf-teal group-hover:text-white mb-2 mx-auto" />
        <span className="font-heading text-[13px] font-medium uppercase tracking-[2px] text-sf-teal group-hover:text-white transition-colors [writing-mode:vertical-lr] rotate-180 inline-block">
          Narrative Bridge
        </span>
        {filledCount > 0 && (
          <span
            className="absolute -left-2 -top-2 min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-sf-tag bg-sf-teal text-[13px] font-mono font-medium text-[#08110C] tabular-nums tracking-tight"
            aria-label={`${filledCount} answered`}
          >
            {filledCount}
          </span>
        )}
      </button>
    );
  }

  // Expanded panel
  return (
    <div className="absolute right-0 top-0 bottom-0 z-30 w-80 max-w-[92vw] bg-sf-void/95 backdrop-blur-sf-side border-l border-sf-border overflow-y-auto animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-sf-void/95 backdrop-blur-sf-side px-4 py-3 border-b border-white/[0.35]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenLine className="w-3.5 h-3.5 text-sf-teal" />
            <span className="font-heading text-[13px] uppercase tracking-[2px] text-sf-teal">
              Narrative Bridge
            </span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-t4 hover:text-t2 transition-colors p-1"
            aria-label="Close Narrative Bridge"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[13px] text-t3 mt-1.5 leading-relaxed">
          {config.contextTemplate}
        </p>
      </div>

      {/* Questions */}
      <div className="px-4 py-4 space-y-5">
        {config.questions.map((q) => (
          <div key={q.id}>
            <label
              className="font-heading text-[13px] uppercase tracking-[2px] block mb-1.5"
              style={{ color: q.layerColor }}
            >
              {q.layer}
            </label>
            <p className="text-[13px] text-t3 leading-relaxed mb-2">
              {q.prompt}
            </p>
            <Textarea
              value={notes[q.id] ?? ""}
              onChange={(e) => updateNote(q.id, e.target.value)}
              placeholder="Write your thoughts..."
              className="min-h-[80px] bg-white/[0.03] border-sf-border text-t2 text-xs resize-y"
            />
          </div>
        ))}

        {/* General Notes, freeform textarea */}
        <div>
          <label className="font-heading text-[13px] uppercase tracking-[2px] text-sf-teal/70 block mb-1.5">
            General Notes
          </label>
          <textarea
            value={notes["general_notes"] ?? ""}
            onChange={(e) => updateNote("general_notes", e.target.value)}
            placeholder="Free-form notes, observations, story ideas..."
            className="w-full font-sans text-[14px] leading-relaxed text-t2 placeholder:text-t4 bg-white/[0.03] border border-sf-border rounded-[6px] px-[14px] py-3 min-h-[120px] resize-y focus:outline-none focus:border-[rgba(21,193,123,0.25)] transition-colors"
          />
        </div>

        {/* Footer: save + count */}
        <div className="pt-3 border-t border-white/[0.35] space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[12px] text-t4 uppercase tracking-wider">
              {filledCount} / {config.questions.length} notes written
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={filledCount === 0}
              className="h-6 text-[12px] uppercase tracking-wider px-2 gap-1 border-sf-teal/20 text-sf-teal hover:bg-sf-teal/10"
            >
              <Save className="w-3 h-3" />
              {saved ? "Saved" : "Save Notes"}
            </Button>
          </div>
          <p className="text-[12px] text-t5 leading-relaxed">
            Notes are included when you Publish to World.
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
