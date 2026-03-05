import { useState, useCallback, useMemo } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import CodexElementRow from "./CodexElementRow";
import CodexContextMenu from "./CodexContextMenu";
import type { CodexSection as CodexSectionType, CodexElement } from "@/services/world-data";

interface CodexSectionProps {
  section: CodexSectionType;
  activeElementId?: string | null;
  pinnedIds?: Set<string>;
  onElementClick: (element: CodexElement) => void;
  onOpenWiki?: (element: CodexElement) => void;
  onOpenTool?: (element: CodexElement) => void;
  onDelete?: (element: CodexElement) => void;
  onRename?: (element: CodexElement, newTitle: string) => void;
  onSticky?: (element: CodexElement) => void;
}

const CodexSection = ({
  section,
  activeElementId,
  onElementClick,
  onOpenWiki,
  onOpenTool,
  onDelete,
  onRename,
  onSticky,
  pinnedIds,
}: CodexSectionProps) => {
  const [expanded, setExpanded] = useState(section.isExpanded);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  // Sort pinned items first
  const sortedElements = useMemo(() => {
    if (!pinnedIds || pinnedIds.size === 0) return section.elements;
    return [...section.elements].sort((a, b) => {
      const aPinned = pinnedIds.has(a.id);
      const bPinned = pinnedIds.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [section.elements, pinnedIds]);

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
        <span className="font-heading text-[11px] uppercase tracking-[3px] text-primary/60 flex-1">
          {section.label}
        </span>
        {section.elements.length > 0 && (
          <span className="font-mono text-[9px] text-muted-foreground/30">
            {section.elements.length}
          </span>
        )}
      </button>

      {/* Elements */}
      {expanded && (
        <div>
          {sortedElements.length === 0 ? (
            <p className="px-3 py-1.5 text-[11px] text-muted-foreground/25 italic">
              No data on file. Use a tool to generate entries.
            </p>
          ) : (
            sortedElements.map((el, idx) => (
              <CodexContextMenu
                key={el.id}
                element={el}
                onOpenWiki={onOpenWiki}
                onOpenTool={onOpenTool}
                onDelete={onDelete}
                onRename={onRename && el.kind === "entry" ? () => setRenamingId(el.id) : undefined}
                onSticky={onSticky}
                isPinned={pinnedIds?.has(el.id)}
              >
                <CodexElementRow
                  element={el}
                  depth={1}
                  isLast={idx === sortedElements.length - 1}
                  isActive={activeElementId === el.id}
                  isPinned={pinnedIds?.has(el.id)}
                  onClick={onElementClick}
                  onRename={onRename}
                  isRenaming={renamingId === el.id}
                  onRenameComplete={() => setRenamingId(null)}
                />
              </CodexContextMenu>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CodexSection;
