import { cn } from "@/lib/utils";
import type { CodexSection } from "@/services/world-data";

interface CodexCollapsedProps {
  sections: CodexSection[];
  onExpand: () => void;
}

// Layer colors for the dot indicators
const LAYER_DOT_COLORS: Record<string, string> = {
  environment: "bg-primary/50",
  biology: "bg-sf-emerald/50",
  psychology: "bg-sf-amber/50",
  culture: "bg-sf-azure/50",
  mythology: "bg-sf-violet/50",
  technology: "bg-sf-crimson/50",
  narrative: "bg-sf-amber-warm/50",
};

const CodexCollapsed = ({ sections, onExpand }: CodexCollapsedProps) => {
  return (
    <div className="flex flex-col items-center pt-2 gap-1">
      {/* Expand button */}
      <button
        onClick={onExpand}
        className="sf-fill-sweep sf-fill-sweep--secondary w-8 h-7 flex items-center justify-center border border-sf-line-interactive text-t3 hover:text-t1 transition-colors mb-2"
        aria-label="Expand Registry"
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
              "w-2 h-2 rounded-full",
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
