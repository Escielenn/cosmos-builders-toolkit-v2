// ---------------------------------------------------------------------------
// WritingSidebar, unified tabbed sidebar for the writing space.
//
// Merges ChapterTree + WritingEntityPanel into a single 280px rail with
// two tabs: "Chapters" (doc management) and "Entities" (world reference).
// Collapses to an 8px rail with toggle button. Ctrl+[ toggles.
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  BookOpen,
  Dna,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChapterTree, type ChapterTreeProps } from "./ChapterTree";
import { WritingEntityPanel, type WritingEntityPanelProps } from "./WritingEntityPanel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SidebarTab = "chapters" | "entities";

export interface WritingSidebarProps {
  open: boolean;
  onToggle: () => void;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  chapterProps: Omit<ChapterTreeProps, "open" | "onToggle">;
  entityProps: Omit<WritingEntityPanelProps, "open" | "onToggle">;
}

const SIDEBAR_WIDTH = 280;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WritingSidebar({
  open,
  onToggle,
  activeTab,
  onTabChange,
  chapterProps,
  entityProps,
}: WritingSidebarProps) {
  // Collapsed rail
  if (!open) {
    return (
      <aside
        className={cn(
          "shrink-0 w-8 h-full border-r border-white/5",
          "bg-[hsl(222_25%_9%_/_0.6)] flex flex-col items-center py-2 gap-2"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-t4 hover:text-t2"
          onClick={onToggle}
          aria-label="Open sidebar"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </Button>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "shrink-0 h-full flex flex-col border-r border-white/5",
        "bg-[hsl(222_25%_9%_/_0.8)]"
      )}
      style={{ width: SIDEBAR_WIDTH }}
    >
      {/* Tab bar + collapse */}
      <div className="flex items-center border-b border-white/5 shrink-0">
        <button
          type="button"
          onClick={() => onTabChange("chapters")}
          className={cn(
            "flex items-center gap-1.5 flex-1 px-3 py-2 text-[11px] font-heading uppercase tracking-[1.2px] transition-colors",
            activeTab === "chapters"
              ? "text-sf-teal border-b-2 border-[#15C17B]"
              : "text-t4 hover:text-t2 border-b-2 border-transparent"
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Chapters
        </button>
        <button
          type="button"
          onClick={() => onTabChange("entities")}
          className={cn(
            "flex items-center gap-1.5 flex-1 px-3 py-2 text-[11px] font-heading uppercase tracking-[1.2px] transition-colors",
            activeTab === "entities"
              ? "text-sf-teal border-b-2 border-[#15C17B]"
              : "text-t4 hover:text-t2 border-b-2 border-transparent"
          )}
        >
          <Dna className="w-3.5 h-3.5" />
          Entities
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-t4 hover:text-t2 mx-1 shrink-0"
          onClick={onToggle}
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chapters" ? (
          <ChapterTree {...chapterProps} open={true} onToggle={onToggle} embedded />
        ) : (
          <WritingEntityPanel {...entityProps} open={true} onToggle={onToggle} embedded />
        )}
      </div>
    </aside>
  );
}
