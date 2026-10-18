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
    } catch {
      /* storage unavailable (private mode / quota); state stays in memory */
    }
    setSaved(true);
    toast({ title: "NOTES SAVED.", description: "STORED IN THIS BROWSER." });
  }, [notes, config.simulatorType, toast]);

  const filledCount = Object.values(notes).filter((v) => v.trim()).length;

  // Collapsed state, tab button on the right edge.
  // April 2026 handoff: highly visible at rest (sf-teal 80% + glow + chevron),
  // with a filled-count badge so the user knows there's content waiting.
  if (!open) {
    return (
      <button
        onClick={() => onOpenChange(true)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-sf-primary/[0.08] border border-sf-primary border-r-0 px-2.5 py-5 hover:bg-sf-primary/[0.16] transition-colors duration-base ease-sf-out group shadow-sf-glow-teal"
        title="Open Narrative Bridge"
        aria-label="Open Narrative Bridge"
      >
        <ChevronLeft className="w-3.5 h-3.5 text-sf-primary-text group-hover:text-t1 mb-2 mx-auto" />
        <span className="font-heading text-[13px] font-medium uppercase tracking-wide text-sf-primary-text group-hover:text-t1 transition-colors duration-base [writing-mode:vertical-lr] rotate-180 inline-block">
          Narrative Bridge
        </span>
        {filledCount > 0 && (
          <span
            className="absolute -left-2 -top-2 min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-sf-tag bg-sf-primary text-[13px] font-mono font-medium text-sf-on-primary tabular-nums tracking-tight"
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
    <div className="absolute right-0 top-0 bottom-0 z-30 w-80 max-w-[92vw] bg-sf-void/95 backdrop-blur-sf-side border-l border-sf-line overflow-y-auto sf-sb animate-in slide-in-from-right duration-slow">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-sf-void/95 backdrop-blur-sf-side px-4 py-3 border-b border-sf-line-hairline">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenLine className="w-3.5 h-3.5 text-sf-primary-text" />
            <span className="font-heading text-[13px] uppercase tracking-wide text-sf-primary-text">
              Narrative Bridge
            </span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-hit min-w-hit items-center justify-center text-t3 hover:text-t1 transition-colors duration-base"
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
              className="font-heading text-[13px] uppercase tracking-wide block mb-1.5"
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
              placeholder="Write your thoughts…"
              className="min-h-[80px] rounded-none text-t2 text-sf-body resize-y"
            />
          </div>
        ))}

        {/* General Notes, freeform textarea */}
        <div>
          <label className="font-heading text-[13px] uppercase tracking-wide text-sf-primary-text block mb-1.5">
            General Notes
          </label>
          <textarea
            value={notes["general_notes"] ?? ""}
            onChange={(e) => updateNote("general_notes", e.target.value)}
            placeholder="Free-form notes, observations, story ideas..."
            className="w-full font-sans text-sf-body leading-relaxed text-t2 placeholder:text-t3 sf-field px-[14px] py-3 min-h-[120px] resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sf-focus focus:border-sf-primary transition-colors"
          />
        </div>

        {/* Footer: save + count */}
        <div className="pt-3 border-t border-sf-line-hairline space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[12px] text-t4 uppercase tracking-wider">
              {filledCount} / {config.questions.length} NOTES WRITTEN
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={filledCount === 0}
              className="min-h-hit text-[12px] uppercase tracking-wider px-3 gap-1 border-sf-primary text-sf-primary-text hover:bg-sf-primary/[0.12]"
            >
              <Save className="w-3 h-3" />
              {saved ? "NOTES SAVED" : "SAVE NOTES"}
            </Button>
          </div>
          <p className="text-[12px] text-t4 leading-relaxed">
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
