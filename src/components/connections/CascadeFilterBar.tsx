// ---------------------------------------------------------------------------
// CascadeFilterBar — six toggles, one per cascade stage.
// Click = solo, Shift+click = toggle, double-click = reset all.
//
// Written for the retired /connections route and never mounted. Lifted into
// the Codex Web view's toolbar by F3, and re-dressed on the way: the alpha
// borders and the `opacity: 0.35` inactive state are gone (10-LEGIBILITY:
// no alpha borders, no opacity for states — an operable control has to stay
// readable when it is off).
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
        const next = new Set(activeStages);
        if (next.has(stage)) {
          next.delete(stage);
          // Never leave an empty set — an empty web reads as a broken one.
          if (next.size === 0) next.add(stage);
        } else {
          next.add(stage);
        }
        onChange(next);
      } else if (activeStages.size === 1 && activeStages.has(stage)) {
        onChange(new Set(ALL_STAGES));
      } else {
        onChange(new Set([stage]));
      }
    },
    [activeStages, onChange]
  );

  const handleDoubleClick = useCallback(() => {
    onChange(new Set(ALL_STAGES));
  }, [onChange]);

  return (
    <div
      className="flex items-center gap-0.5 border border-sf-line bg-sf-surface px-1.5 py-1"
      onDoubleClick={handleDoubleClick}
    >
      {CASCADE_STAGES.map((stage) => {
        const color = CASCADE_STAGE_COLORS[stage];
        const isActive = activeStages.has(stage);

        return (
          <button
            key={stage}
            type="button"
            aria-pressed={isActive}
            onClick={(e) => handleClick(stage, e)}
            className={`flex min-h-hit items-center gap-1.5 border px-2 transition-colors duration-150 ${
              isActive
                ? "border-sf-line-emphasis"
                : "border-transparent hover:border-sf-line-interactive"
            }`}
            title={`${CASCADE_STAGE_LABELS[stage]} — click to solo, shift-click to toggle`}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 shrink-0"
              style={{ background: isActive ? color : "var(--sf-disabled-line)" }}
            />
            <span
              className="font-heading text-[12px] uppercase tracking-[1px]"
              style={{ color: isActive ? color : "var(--t4)" }}
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
          className="ml-1 min-h-hit px-2 font-sans text-[12px] uppercase tracking-[1px] text-t3 transition-colors hover:text-t1"
        >
          Reset
        </button>
      )}
    </div>
  );
}
