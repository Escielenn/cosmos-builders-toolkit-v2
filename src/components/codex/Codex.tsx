import { useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader } from "@/components/ui/loader";
import { useCodexData } from "@/hooks/use-codex-data";
import { useCreateEntry, useDeleteEntry, useUpdateEntry, useMoveEntry } from "@/hooks/use-world-entries";
import CodexSearch from "./CodexSearch";
import CodexSection from "./CodexSection";
import CodexCustomSection from "./CodexCustomSection";
import CodexRecentEdits from "./CodexRecentEdits";
import CodexQuickAccess from "./CodexQuickAccess";
import CodexCompletionBar from "./CodexCompletionBar";
import CodexCollapsed from "./CodexCollapsed";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CodexElement, CodexSection_Entity } from "@/services/world-data";
import { ENTITY_TYPE_LABELS, ENTITY_TYPE_ICONS } from "@/services/world-data";
import { useWorldLayoutContext } from "@/contexts/WorldLayoutContext";
import WorldIconRenderer from "@/components/world/WorldIconRenderer";
import FirstTimeHint from "@/components/onboarding/FirstTimeHint";
import { useHintDismissed } from "@/hooks/use-hint-dismissed";
import { BookOpen, Eye, FileText, Layers, LayoutGrid, Tag, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Tool route mapping
// ---------------------------------------------------------------------------

const TOOL_ROUTES: Record<string, string> = {
  "planetary-profile": "planetary-profile",
  "environmental-chain-reaction": "environmental-chain-reaction",
  "spacecraft-designer": "spacecraft-designer",
  "propulsion-consequences-map": "propulsion-consequences-map",
  "drake-equation-calculator": "drake-equation-calculator",
  "xenomythology-framework-builder": "xenomythology-framework-builder",
  "evolutionary-biology": "evolutionary-biology",
  "star-system-builder": "star-system-builder",
  "empire-designer": "empire-designer",
  "technology-consequences": "technology-consequences",
  "species-interaction-matrix": "species-interaction-matrix",
  "one-big-lie": "one-big-lie",
  "time-dilation": "time-dilation",
  "space-expansion-modeler": "space-expansion-modeler",
  "habitable-zone-calculator": "habitable-zone-calculator",
  "lexdrift": "lexdrift",
  "surface-gravity-calculator": "surface-gravity-calculator",
  "timeline": "timeline",
  "sensorium": "sensorium",
  "gravitas": "gravitas",
  "kardashev-scale": "kardashev-scale",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CodexProps {
  worldId: string;
  collapsed: boolean;
  onCollapse: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Codex = ({ worldId, collapsed, onCollapse }: CodexProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const layoutContext = useWorldLayoutContext();
  const { data: codexData, isLoading, error } = useCodexData(worldId);

  const createEntry = useCreateEntry(worldId);
  const deleteEntry = useDeleteEntry(worldId);
  const updateEntry = useUpdateEntry(worldId);
  const moveEntry = useMoveEntry(worldId);

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CodexElement | null>(null);
  const [codexHintDismissed] = useHintDismissed("codex");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Pinned items, persisted per world
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`sf-codex-pinned-${worldId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const handleToggleSticky = useCallback((element: CodexElement) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(element.id)) {
        next.delete(element.id);
      } else {
        next.add(element.id);
      }
      localStorage.setItem(`sf-codex-pinned-${worldId}`, JSON.stringify([...next]));
      return next;
    });
  }, [worldId]);

  // Group by: cascade (default) or entity type
  const [groupBy, setGroupBy] = useState<"cascade" | "entity">(() => {
    try {
      return (localStorage.getItem(`sf-codex-groupby-${worldId}`) as "cascade" | "entity") || "cascade";
    } catch {
      return "cascade";
    }
  });

  const handleGroupByChange = useCallback(
    (mode: "cascade" | "entity") => {
      setGroupBy(mode);
      localStorage.setItem(`sf-codex-groupby-${worldId}`, mode);
    },
    [worldId]
  );

  // Default view preference
  const [defaultView, setDefaultView] = useState<"wiki" | "tool">(() => {
    try {
      return (localStorage.getItem(`sf-world-view-${worldId}`) as "wiki" | "tool") || "tool";
    } catch {
      return "tool";
    }
  });

  const handleDefaultViewChange = useCallback(
    (view: string) => {
      const v = view as "wiki" | "tool";
      setDefaultView(v);
      localStorage.setItem(`sf-world-view-${worldId}`, v);
    },
    [worldId]
  );

  // Determine active element from URL
  const activeElementId = useMemo(() => {
    // Check if we're on a tool page: /worlds/:id/tools/:toolName?worksheetId=xxx
    const match = location.pathname.match(/\/worlds\/[^/]+\/tools\/([^/]+)/);
    if (match) {
      const searchParams = new URLSearchParams(location.search);
      return searchParams.get("worksheetId");
    }
    return null;
  }, [location]);

  // Navigate to tool page for an element
  const navigateToTool = useCallback(
    (element: CodexElement) => {
      if (element.toolSource) {
        const toolRoute = TOOL_ROUTES[element.toolSource];
        if (toolRoute) {
          const params = element.toolDataId ? `?worksheetId=${element.toolDataId}` : "";
          navigate(`/worlds/${worldId}/tools/${toolRoute}${params}`);
        }
      }
    },
    [navigate, worldId]
  );

  // Navigate to wiki page for an element
  const navigateToWiki = useCallback(
    (element: CodexElement) => {
      if (element.kind === "entry" && element.entryId) {
        navigate(`/worlds/${worldId}/codex/${element.entryId}`);
      } else if (element.kind === "worksheet") {
        // Worksheet elements: navigate to entry if linked, otherwise tool
        if (element.entryId) {
          navigate(`/worlds/${worldId}/codex/${element.entryId}`);
        } else {
          navigateToTool(element);
        }
      }
    },
    [navigate, worldId, navigateToTool]
  );

  // Default click handler, respects defaultView preference
  const navigateToElement = useCallback(
    (element: CodexElement) => {
      // Writing entries → navigate to Writing Prompts
      if (element.kind === "writing") {
        navigate(`/write/${element.id}`);
        return;
      }
      // World notes → navigate to dashboard notes section
      if (element.kind === "note") {
        navigate(`/worlds/${worldId}#notes`);
        return;
      }
      // Custom entries (no tool source) always go to wiki page
      if (element.kind === "entry" && !element.toolSource) {
        navigateToWiki(element);
        return;
      }
      if (defaultView === "wiki") {
        navigateToWiki(element);
      } else {
        navigateToTool(element);
      }
    },
    [defaultView, navigateToWiki, navigateToTool, navigate, worldId]
  );

  // Search + tag filter
  const filterElements = useCallback(
    (elements: CodexElement[]) => {
      let result = elements;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(
          (el) =>
            el.title.toLowerCase().includes(q) ||
            el.type.toLowerCase().includes(q) ||
            el.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      if (activeTags.length > 0) {
        result = result.filter((el) =>
          activeTags.some((tag) => el.tags.includes(tag))
        );
      }
      return result;
    },
    [searchQuery, activeTags]
  );

  // CRUD handlers
  const handleCreateFolder = useCallback(() => {
    createEntry.mutate({ title: "New Folder", entryType: "lore" });
  }, [createEntry]);

  const handleCreateEntry = useCallback(() => {
    createEntry.mutate({ title: "New Entry", entryType: "note" });
  }, [createEntry]);

  const handleDelete = useCallback((element: CodexElement) => {
    if (element.kind === "entry") {
      setDeleteTarget(element);
    }
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTarget?.entryId) {
      deleteEntry.mutate(deleteTarget.entryId);
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteEntry]);

  const handleRename = useCallback(
    (element: CodexElement, newTitle: string) => {
      if (element.entryId) {
        updateEntry.mutate({ entryId: element.entryId, title: newTitle });
      }
    },
    [updateEntry]
  );

  const handleReorder = useCallback(
    (activeId: string, overId: string, dropIntoFolder?: string | null) => {
      const entries = codexData?.customEntries ?? [];
      const entry = entries.find((e) => e.id === activeId);
      if (!entry?.entryId) return;

      // Dropping into a folder, move entry under that parent
      if (dropIntoFolder) {
        const folderEl = entries.find((e) => e.id === dropIntoFolder);
        if (folderEl?.entryId) {
          moveEntry.mutate({
            entryId: entry.entryId,
            newParentId: folderEl.entryId,
            newSortOrder: 0,
          });
        }
        return;
      }

      // Normal sibling reorder
      const topLevel = entries.filter((e) => (e.depth ?? 0) === 0);
      const oldIndex = topLevel.findIndex((e) => e.id === activeId);
      const newIndex = topLevel.findIndex((e) => e.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      moveEntry.mutate({
        entryId: entry.entryId,
        newParentId: null,
        newSortOrder: newIndex,
      });
    },
    [codexData?.customEntries, moveEntry]
  );

  // Collapsed state
  if (collapsed) {
    return (
      <CodexCollapsed
        sections={codexData?.cascadeSections ?? []}
        onExpand={onCollapse}
      />
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader size="sm" />
      </div>
    );
  }

  // Error
  if (error || !codexData) {
    return (
      <div className="p-3">
        <p className="font-mono text-[12px] uppercase tracking-wider text-sf-crimson-text">
          Registry unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Collapse button */}
      <div className="px-3 pt-2 pb-1">
        <button
          onClick={onCollapse}
          className="sf-fill-sweep sf-fill-sweep--secondary w-full flex items-center justify-center h-6 border border-sf-line-interactive text-t3 hover:text-t2 transition-colors"
          aria-label="Collapse Registry"
        >
          <span className="text-[12px]">◀</span>
        </button>
      </div>

      {/* World name */}
      <button
        onClick={() => navigate(`/worlds/${worldId}`)}
        className="px-3 py-1.5 text-left flex items-center gap-2"
      >
        {layoutContext?.worldIcon && (
          <WorldIconRenderer iconId={layoutContext.worldIcon} className="w-4 h-4 text-primary shrink-0" />
        )}
        {/* The world's own name, in the writer's voice — not a system label. */}
        <span className="font-serif text-[17px] italic text-t1 block truncate">
          {codexData.worldName}
        </span>
      </button>

      {/* World Notes shortcut */}
      <button
        type="button"
        onClick={() => navigate(`/worlds/${worldId}#notes`)}
        className="px-3 py-1 w-full text-left flex items-center gap-2 text-t3 hover:text-t2 transition-colors"
      >
        <FileText className="w-3.5 h-3.5" />
        <span className="font-serif text-[14px] italic">World notes</span>
      </button>

      {/* Codex hint */}
      <div className="px-3">
        <FirstTimeHint hintId="codex" variant="compact" icon={BookOpen} />
      </div>

      {/* Search */}
      <CodexSearch value={searchQuery} onChange={setSearchQuery} />

      {/* Group-by toggle */}
      <div className="px-3 pb-1 flex items-center gap-1">
        <button
          onClick={() => handleGroupByChange("cascade")}
          className={`flex items-center gap-1 px-2 py-1 text-[12px] uppercase tracking-[1.5px] transition-colors ${
            groupBy === "cascade"
              ? "text-sf-primary-text bg-sf-primary/8 border border-sf-primary"
              : "text-t4 hover:text-t3"
          }`}
          title="Group by cascade layer"
        >
          <Layers className="w-3 h-3" />
          Cascade
        </button>
        <button
          onClick={() => handleGroupByChange("entity")}
          className={`flex items-center gap-1 px-2 py-1 text-[12px] uppercase tracking-[1.5px] transition-colors ${
            groupBy === "entity"
              ? "text-sf-primary-text bg-sf-primary/8 border border-sf-primary"
              : "text-t4 hover:text-t3"
          }`}
          title="Group by entity type"
        >
          <LayoutGrid className="w-3 h-3" />
          Entity
        </button>
      </div>

      {/* Tag filter chips */}
      {codexData.worldTags.length > 0 && (
        <div className="px-3 pb-1.5">
          <div className="flex flex-wrap gap-1">
            {codexData.worldTags.slice(0, 12).map((tag) => (
              <button
                key={tag}
                onClick={() =>
                  setActiveTags((prev) =>
                    prev.includes(tag)
                      ? prev.filter((t) => t !== tag)
                      : [...prev, tag]
                  )
                }
                className={`flex items-center gap-1 px-1.5 py-0.5 text-[12px] tracking-wider border transition-colors ${
                  activeTags.includes(tag)
                    ? "bg-sf-primary/10 border-sf-primary text-sf-primary-text"
                    : "border-sf-line-interactive text-t4 hover:text-t3"
                }`}
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
                {activeTags.includes(tag) && <X className="w-2.5 h-2.5" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {/* Cascade sections (default view) */}
        {groupBy === "cascade" && codexData.cascadeSections.map((section) => {
          const filtered = filterElements(section.elements);
          if (searchQuery && filtered.length === 0) return null;
          return (
            <CodexSection
              key={section.key}
              section={{ ...section, elements: filtered }}
              activeElementId={activeElementId}
              onElementClick={navigateToElement}
              onOpenWiki={navigateToWiki}
              onOpenTool={navigateToTool}
              onDelete={handleDelete}
              onRename={handleRename}
              onSticky={handleToggleSticky}
              pinnedIds={pinnedIds}
            />
          );
        })}

        {/* Entity type sections (alt view) */}
        {groupBy === "entity" && codexData.entitySections.map((section) => {
          const filtered = filterElements(section.elements);
          if ((searchQuery || activeTags.length > 0) && filtered.length === 0) return null;
          return (
            <CodexSection
              key={section.key}
              section={{ ...section, elements: filtered } as any}
              activeElementId={activeElementId}
              onElementClick={navigateToElement}
              onOpenWiki={navigateToWiki}
              onOpenTool={navigateToTool}
              onDelete={handleDelete}
              onRename={handleRename}
              onSticky={handleToggleSticky}
              pinnedIds={pinnedIds}
            />
          );
        })}

        {/* No results feedback */}
        {(searchQuery || activeTags.length > 0) && (() => {
          const sections = groupBy === "cascade" ? codexData.cascadeSections : codexData.entitySections;
          const allEmpty = sections.every((s) => filterElements(s.elements).length === 0) &&
            filterElements(codexData.customEntries).length === 0;
          return allEmpty ? (
            <div className="px-3 py-6 text-center">
              <p className="font-mono text-[12px] uppercase tracking-wider text-t4">
                No matches found
              </p>
            </div>
          ) : null;
        })()}

        {/* Custom section */}
        <CodexCustomSection
          elements={filterElements(codexData.customEntries)}
          activeElementId={activeElementId}
          pinnedIds={pinnedIds}
          onElementClick={navigateToElement}
          onOpenWiki={navigateToWiki}
          onOpenTool={navigateToTool}
          onDelete={handleDelete}
          onRename={handleRename}
          onReorder={handleReorder}
          onSticky={handleToggleSticky}
          onCreateFolder={handleCreateFolder}
          onCreateEntry={handleCreateEntry}
        />

        {/* Recent edits */}
        {!searchQuery && (
          <CodexRecentEdits
            items={codexData.recentEdits}
            onItemClick={navigateToElement}
          />
        )}

        {/* Quick access */}
        {!searchQuery && <CodexQuickAccess worldId={worldId} />}
      </div>

      {/* Completion bar */}
      <CodexCompletionBar percent={codexData.completionPercent} />

      {/* Default view hint (only after codex hint dismissed) */}
      {codexHintDismissed && (
        <div className="px-3">
          <FirstTimeHint hintId="default-view" variant="compact" icon={Eye} />
        </div>
      )}

      {/* Default view setting */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] uppercase tracking-wider text-t4 whitespace-nowrap">
            Default view:
          </span>
          <Select value={defaultView} onValueChange={handleDefaultViewChange}>
            <SelectTrigger className="h-5 text-[12px] flex-1 border-sf-line-interactive bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tool" className="text-[12px]">Tool</SelectItem>
              <SelectItem value="wiki" className="text-[12px]">Wiki</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.title ?? ""}
        itemType="worksheet"
      />
    </div>
  );
};

export default Codex;
