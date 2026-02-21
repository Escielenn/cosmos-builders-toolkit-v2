import { memo } from "react";
import { FileText, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CodexElement } from "@/services/world-data";

interface CodexElementRowProps {
  element: CodexElement;
  depth?: number;
  isLast?: boolean;
  isActive?: boolean;
  onClick: (element: CodexElement) => void;
  onContextMenu: (e: React.MouseEvent, element: CodexElement) => void;
}

const CodexElementRow = memo(({
  element,
  depth = 0,
  isLast = false,
  isActive = false,
  onClick,
  onContextMenu,
}: CodexElementRowProps) => {
  return (
    <button
      onClick={() => onClick(element)}
      onContextMenu={(e) => onContextMenu(e, element)}
      className={cn(
        "sf-fill-sweep sf-fill-sweep--secondary",
        "w-full flex items-center gap-1.5 py-[3px] pr-2 text-left group relative",
        isActive && "bg-primary/[0.04]"
      )}
      style={{ paddingLeft: depth * 16 + 12 }}
    >
      {/* Active indicator */}
      {isActive && (
        <span className="absolute left-0 top-1 bottom-1 w-[2px] bg-primary/60" />
      )}

      {/* Tree connector */}
      {depth > 0 && (
        <span className="font-mono text-[10px] text-white/[0.12] select-none shrink-0 w-3">
          {isLast ? "└" : "├"}
        </span>
      )}

      {/* Icon */}
      {element.kind === "entry" && element.type === "lore" ? (
        <Folder className="w-3 h-3 text-amber-400/60 shrink-0" />
      ) : element.kind === "entry" ? (
        <FileText className="w-3 h-3 text-muted-foreground/50 shrink-0" />
      ) : (
        <FileText className="w-3 h-3 text-muted-foreground/50 shrink-0" />
      )}

      {/* Title */}
      <span
        className={cn(
          "text-[12px] truncate flex-1 leading-tight",
          element.isDraft ? "text-foreground/40" : "text-foreground/75",
          isActive && "text-foreground/90"
        )}
      >
        {element.title}
      </span>

      {/* Draft badge */}
      {element.isDraft && element.kind === "worksheet" && (
        <span className="font-mono text-[7px] uppercase tracking-wider text-muted-foreground/30 shrink-0">
          Draft
        </span>
      )}

      {/* Completion dot */}
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          element.status === "complete" && "bg-primary/70",
          element.status === "partial" && "bg-amber-400/70",
          element.status === "empty" && "border border-muted-foreground/25"
        )}
      />
    </button>
  );
});

CodexElementRow.displayName = "CodexElementRow";

export default CodexElementRow;
