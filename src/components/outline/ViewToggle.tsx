import { cn } from "@/lib/utils";

export type OutlineView = "framework" | "freeform" | "graph";

interface ViewToggleProps {
  activeView: OutlineView;
  onViewChange: (view: OutlineView) => void;
}

const VIEWS: { id: OutlineView; label: string }[] = [
  { id: "framework", label: "FRAMEWORK" },
  { id: "freeform", label: "FREEFORM" },
  { id: "graph", label: "GRAPH" },
];

const ViewToggle = ({ activeView, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex items-center border-b border-border/50">
      {VIEWS.map(({ id, label }) => {
        const isActive = activeView === id;
        return (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={cn(
              "sf-fill-sweep sf-fill-sweep--primary",
              "relative px-4 py-2.5 font-heading text-[10px] uppercase tracking-sf-wide",
              "transition-colors border-b-2",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default ViewToggle;
