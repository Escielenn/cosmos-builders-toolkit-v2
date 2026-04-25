import { cn } from "@/lib/utils";
import type { CodexSection } from "@/services/world-data";

interface CodexCollapsedProps {
  sections: CodexSection[];
  onExpand: () => void;
}

// Layer colors for the dot indicators
const LAYER_DOT_COLORS: Record<string, string> = {
  environment: "bg-primary/50",
  biology: "bg-green-400/50",
  psychology: "bg-amber-400/50",
  culture: "bg-blue-400/50",
  mythology: "bg-purple-400/50",
  technology: "bg-red-400/50",
  narrative: "bg-yellow-400/50",
};

const CodexCollapsed = ({ sections, onExpand }: CodexCollapsedProps) => {
  return (
    <div className="flex flex-col items-center pt-2 gap-1">
      {/* Expand button */}
      <button
        onClick={onExpand}
        className="sf-fill-sweep sf-fill-sweep--secondary w-8 h-7 flex items-center justify-center border border-sf-border text-t3 hover:text-foreground transition-colors mb-2"
        aria-label="Expand Registry"
      >
        <span className="text-[10px]">▶</span>
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
                : "border border-muted-foreground/20"
            )}
          />
        </div>
      ))}
    </div>
  );
};

export default CodexCollapsed;
