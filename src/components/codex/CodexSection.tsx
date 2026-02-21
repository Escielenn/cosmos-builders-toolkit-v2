import { useState, useCallback } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import CodexElementRow from "./CodexElementRow";
import type { CodexSection as CodexSectionType, CodexElement } from "@/services/world-data";

interface CodexSectionProps {
  section: CodexSectionType;
  activeElementId?: string | null;
  onElementClick: (element: CodexElement) => void;
  onElementContextMenu: (e: React.MouseEvent, element: CodexElement) => void;
}

const CodexSection = ({
  section,
  activeElementId,
  onElementClick,
  onElementContextMenu,
}: CodexSectionProps) => {
  const [expanded, setExpanded] = useState(section.isExpanded);

  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  return (
    <div className="mb-0.5">
      {/* Section header */}
      <button
        onClick={toggle}
        className="sf-fill-sweep sf-fill-sweep--secondary w-full flex items-center gap-1.5 px-3 py-1.5 text-left"
      >
        {expanded ? (
          <ChevronDown className="w-2.5 h-2.5 text-primary/50 shrink-0" />
        ) : (
          <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/40 shrink-0" />
        )}
        <span className="font-heading text-[9px] uppercase tracking-[3px] text-primary/60 flex-1">
          {section.label}
        </span>
        {section.elements.length > 0 && (
          <span className="font-mono text-[8px] text-muted-foreground/30">
            {section.elements.length}
          </span>
        )}
      </button>

      {/* Elements */}
      {expanded && (
        <div>
          {section.elements.length === 0 ? (
            <p className="px-3 py-1.5 text-[10px] text-muted-foreground/25 italic">
              No data on file.
            </p>
          ) : (
            section.elements.map((el, idx) => (
              <CodexElementRow
                key={el.id}
                element={el}
                depth={1}
                isLast={idx === section.elements.length - 1}
                isActive={activeElementId === el.id}
                onClick={onElementClick}
                onContextMenu={onElementContextMenu}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CodexSection;
