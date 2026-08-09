import { memo, useState, useRef, useCallback, useEffect } from "react";
import { FileText, Folder, PenLine, Pin, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CodexElement } from "@/services/world-data";

interface CodexElementRowProps {
  element: CodexElement;
  depth?: number;
  isLast?: boolean;
  isActive?: boolean;
  isPinned?: boolean;
  onClick: (element: CodexElement) => void;
  onRename?: (element: CodexElement, newTitle: string) => void;
  /** Externally trigger rename mode (e.g. from context menu) */
  isRenaming?: boolean;
  onRenameComplete?: () => void;
}

const CodexElementRow = memo(({
  element,
  depth = 0,
  isLast = false,
  isActive = false,
  isPinned = false,
  onClick,
  onRename,
  isRenaming = false,
  onRenameComplete,
}: CodexElementRowProps) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(element.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Enter editing when externally triggered via isRenaming
  useEffect(() => {
    if (isRenaming && !editing && onRename && element.kind === "entry") {
      setEditValue(element.title);
      setEditing(true);
    }
  }, [isRenaming, editing, onRename, element]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (onRename && element.kind === "entry") {
      e.preventDefault();
      e.stopPropagation();
      setEditValue(element.title);
      setEditing(true);
    }
  }, [onRename, element]);

  const commitRename = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== element.title && onRename) {
      onRename(element, trimmed);
    }
    setEditing(false);
    onRenameComplete?.();
  }, [editValue, element, onRename, onRenameComplete]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      commitRename();
    } else if (e.key === "Escape") {
      setEditing(false);
      onRenameComplete?.();
    }
  }, [commitRename, onRenameComplete]);

  const sharedStyle = { paddingLeft: depth * 16 + 12 };

  // Inline rename mode, render as a div with input (no nested interactives)
  if (editing) {
    return (
      <div
        className={cn(
          "w-full flex items-center gap-1.5 py-[3px] pr-2 relative",
          isActive && "bg-primary/[0.04]"
        )}
        style={sharedStyle}
      >
        {isActive && (
          <span className="absolute left-0 top-1 bottom-1 w-[2px] bg-primary/60" />
        )}
        {depth > 0 && (
          <span className="font-mono text-[12px] text-white/[0.12] select-none shrink-0 w-3">
            {isLast ? "└" : "├"}
          </span>
        )}
        {element.kind === "entry" && element.type === "lore" ? (
          <Folder className="w-3 h-3 text-sf-amber/60 shrink-0" />
        ) : (
          <FileText className="w-3 h-3 text-t3/50 shrink-0" />
        )}
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          title="Rename entry"
          className="text-[14px] flex-1 leading-tight bg-transparent border-b border-primary/40 outline-none text-t1 px-0 py-0"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => onClick(element)}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "sf-fill-sweep sf-fill-sweep--secondary",
        "w-full flex items-center gap-1.5 py-[3px] pr-2 text-left group relative",
        isActive && "bg-primary/[0.04]"
      )}
      style={sharedStyle}
    >
      {/* Active indicator */}
      {isActive && (
        <span className="absolute left-0 top-1 bottom-1 w-[2px] bg-primary/60" />
      )}

      {/* Tree connector */}
      {depth > 0 && (
        <span className="font-mono text-[12px] text-white/[0.12] select-none shrink-0 w-3">
          {isLast ? "└" : "├"}
        </span>
      )}

      {/* Icon */}
      {element.kind === "writing" ? (
        <PenLine className="w-3 h-3 text-[#5B8DEF]/60 shrink-0" />
      ) : element.kind === "note" ? (
        <StickyNote className="w-3 h-3 text-primary/50 shrink-0" />
      ) : element.kind === "entry" && element.type === "lore" ? (
        <Folder className="w-3 h-3 text-sf-amber/60 shrink-0" />
      ) : element.kind === "entry" ? (
        <FileText className="w-3 h-3 text-t3/50 shrink-0" />
      ) : (
        <FileText className="w-3 h-3 text-t3/50 shrink-0" />
      )}

      {/* Title */}
      <span
        className={cn(
          "text-[14px] truncate flex-1 leading-tight",
          element.isDraft ? "text-t1/40" : "text-t1/75",
          isActive && "text-t1"
        )}
      >
        {element.title}
      </span>

      {/* Pin indicator */}
      {isPinned && (
        <Pin className="w-2.5 h-2.5 text-t5 shrink-0" />
      )}

      {/* Draft badge */}
      {element.isDraft && element.kind === "worksheet" && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-t3/30 shrink-0">
          Draft
        </span>
      )}

      {/* Completion dot */}
      <span
        className={cn(
          "w-1.5 h-1.5 shrink-0",
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
