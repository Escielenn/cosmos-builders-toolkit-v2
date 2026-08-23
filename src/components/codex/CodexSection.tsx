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
          <ChevronDown className="w-2.5 h-2.5 text-primary shrink-0" />
        ) : (
          <ChevronRight className="w-2.5 h-2.5 text-t3 shrink-0" />
        )}
        {/* WRITER register: a writer's binder, not an instrument readout, so
            layers read as words. LAYER_LABELS are already title case
            ("Environment") — the CSS `uppercase` was doing the shouting. */}
        <span className="font-serif text-[15px] italic text-primary flex-1">
          {section.label}
        </span>
        {section.elements.length > 0 && (
          <span className="font-mono text-[12px] text-t4">
            {section.elements.length}
          </span>
        )}
      </button>

      {/* Elements */}
      {expanded && (
        <div>
          {sortedElements.length === 0 ? (
            <p className="px-3 py-1.5 text-[12px] text-t4 italic">
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
