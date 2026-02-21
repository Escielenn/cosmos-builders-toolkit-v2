import { useState, useCallback } from "react";
import { ChevronRight, ChevronDown, Plus } from "lucide-react";
import CodexElementRow from "./CodexElementRow";
import type { CodexElement } from "@/services/world-data";

interface CodexCustomSectionProps {
  elements: CodexElement[];
  activeElementId?: string | null;
  onElementClick: (element: CodexElement) => void;
  onElementContextMenu: (e: React.MouseEvent, element: CodexElement) => void;
  onCreateFolder: () => void;
  onCreateEntry: () => void;
}

const CodexCustomSection = ({
  elements,
  activeElementId,
  onElementClick,
  onElementContextMenu,
  onCreateFolder,
  onCreateEntry,
}: CodexCustomSectionProps) => {
  const [expanded, setExpanded] = useState(true);

  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  return (
    <div className="mb-0.5">
      {/* Section header */}
      <button
        onClick={toggle}
        className="sf-fill-sweep sf-fill-sweep--secondary w-full flex items-center gap-1.5 px-3 py-1.5 text-left"
      >
        {expanded ? (
          <ChevronDown className="w-2.5 h-2.5 text-muted-foreground/40 shrink-0" />
        ) : (
          <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/40 shrink-0" />
        )}
        <span className="font-heading text-[9px] uppercase tracking-[3px] text-muted-foreground/50 flex-1">
          Custom
        </span>
        {elements.length > 0 && (
          <span className="font-mono text-[8px] text-muted-foreground/30">
            {elements.length}
          </span>
        )}
      </button>

      {expanded && (
        <div>
          {elements.length === 0 ? (
            <p className="px-3 py-1.5 text-[10px] text-muted-foreground/25 italic">
              No entries on file.
            </p>
          ) : (
            elements.map((el, idx) => (
              <CodexElementRow
                key={el.id}
                element={el}
                depth={1}
                isLast={idx === elements.length - 1}
                isActive={activeElementId === el.id}
                onClick={onElementClick}
                onContextMenu={onElementContextMenu}
              />
            ))
          )}

          {/* Create buttons */}
          <div className="flex gap-1 px-3 py-1.5">
            <button
              onClick={onCreateFolder}
              className="sf-fill-sweep sf-fill-sweep--secondary flex items-center gap-1 px-2 py-1 border border-border/15 text-[9px] font-heading uppercase tracking-wider text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
              New Folder
            </button>
            <button
              onClick={onCreateEntry}
              className="sf-fill-sweep sf-fill-sweep--secondary flex items-center gap-1 px-2 py-1 border border-border/15 text-[9px] font-heading uppercase tracking-wider text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
              New Entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodexCustomSection;
