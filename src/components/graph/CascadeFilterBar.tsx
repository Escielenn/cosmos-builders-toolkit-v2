// ---------------------------------------------------------------------------
// CascadeFilterBar, Six toggle buttons, one per cascade stage.
// Click = solo, Shift+click = toggle, double-click = reset all.
// ---------------------------------------------------------------------------

import { useCallback } from "react";
import {
  CASCADE_STAGES,
  CASCADE_STAGE_COLORS,
  CASCADE_STAGE_LABELS,
  type CascadeStage,
} from "@/services/entity-graph-types";

interface CascadeFilterBarProps {
  /** Currently active (visible) stages */
  activeStages: Set<CascadeStage>;
  onChange: (stages: Set<CascadeStage>) => void;
}

const ALL_STAGES = new Set(CASCADE_STAGES);

export function CascadeFilterBar({
  activeStages,
  onChange,
}: CascadeFilterBarProps) {
  const allActive = activeStages.size === CASCADE_STAGES.length;

  const handleClick = useCallback(
    (stage: CascadeStage, e: React.MouseEvent) => {
      if (e.shiftKey) {
        // Toggle this stage
        const next = new Set(activeStages);
        if (next.has(stage)) {
          next.delete(stage);
          // Don't allow empty set, keep at least one
          if (next.size === 0) next.add(stage);
        } else {
          next.add(stage);
        }
        onChange(next);
      } else {
        // Solo this stage (or reset if already solo)
        if (activeStages.size === 1 && activeStages.has(stage)) {
          onChange(new Set(ALL_STAGES));
        } else {
          onChange(new Set([stage]));
        }
      }
    },
    [activeStages, onChange]
  );

  const handleDoubleClick = useCallback(() => {
    onChange(new Set(ALL_STAGES));
  }, [onChange]);

  return (
    <div
      className="flex items-center gap-0.5"
      style={{
        background: "rgba(15,15,16,0.92)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "4px 6px",
      }}
      onDoubleClick={handleDoubleClick}
    >
      {CASCADE_STAGES.map((stage) => {
        const color = CASCADE_STAGE_COLORS[stage];
        const isActive = activeStages.has(stage);

        return (
          <button
            key={stage}
            type="button"
            onClick={(e) => handleClick(stage, e)}
            className="flex items-center gap-1 px-2 py-1 transition-all duration-150"
            style={{
              background: isActive ? `${color}10` : "transparent",
              border: `1px solid ${isActive ? `${color}30` : "transparent"}`,
              opacity: isActive ? 1 : 0.35,
            }}
            title={`${CASCADE_STAGE_LABELS[stage]}, Click to solo, Shift+click to toggle`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: color }}
            />
            <span
              className="text-[11px] font-heading uppercase tracking-[1px]"
              style={{ color: isActive ? color : "rgba(255,255,255,0.35)" }}
            >
              {CASCADE_STAGE_LABELS[stage].slice(0, 4)}
            </span>
          </button>
        );
      })}

      {!allActive && (
        <button
          type="button"
          onClick={() => onChange(new Set(ALL_STAGES))}
          className="ml-1 text-[10px] text-t4 hover:text-t3 uppercase tracking-[1px] font-sans transition-colors"
        >
          Reset
        </button>
      )}
    </div>
  );
}
