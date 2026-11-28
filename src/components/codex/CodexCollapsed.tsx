import { cn } from "@/lib/utils";
import type { CodexSection } from "@/services/world-data";

interface CodexCollapsedProps {
  sections: CodexSection[];
  onExpand: () => void;
}

// Layer colors for the dot indicators
// 1.9 F-07: the one cascade scheme. Colour is the layer's meaning and never
// moves (CLAUDE.md); "technology" and "narrative" are legacy layer keys.
const LAYER_DOT_COLORS: Record<string, string> = {
  physics: "bg-sf-amber",
  environment: "bg-sf-azure",
  biology: "bg-sf-emerald",
  psychology: "bg-sf-magenta",
  culture: "bg-sf-violet",
  mythology: "bg-sf-stellar",
  technology: "bg-sf-violet",
  narrative: "bg-sf-teal",
};

const CodexCollapsed = ({ sections, onExpand }: CodexCollapsedProps) => {
  return (
    <div className="flex flex-col items-center pt-2 gap-1">
      {/* Expand button */}
      <button
        onClick={onExpand}
        className="sf-fill-sweep sf-fill-sweep--secondary w-8 h-7 flex items-center justify-center border border-transparent text-t3 hover:text-t1 hover:border-sf-line-emphasis transition-colors mb-2"
        aria-label="Expand sidebar"
      >
        <span className="text-[12px]">▶</span>
      </button>

      {/* Section dots */}
      {sections.map((section) => (
        <div
          key={section.key}
          className="flex flex-col items-center gap-0.5 py-1"
          title={section.label}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-none",
              section.elements.length > 0
                ? LAYER_DOT_COLORS[section.key] ?? "bg-muted-foreground/30"
                : "border border-sf-line"
            )}
          />
        </div>
      ))}
    </div>
  );
};

export default CodexCollapsed;
