import { useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader } from "@/components/ui/loader";
import { useCodexData } from "@/hooks/use-codex-data";
import { useCreateEntry, useDeleteEntry } from "@/hooks/use-world-entries";
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
import type { CodexElement } from "@/services/world-data";

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
  const { data: codexData, isLoading, error } = useCodexData(worldId);

  const createEntry = useCreateEntry(worldId);
  const deleteEntry = useDeleteEntry(worldId);

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CodexElement | null>(null);

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

  // Navigate to wiki page for an element (Phase 4 — for now routes to tool)
  const navigateToWiki = useCallback(
    (element: CodexElement) => {
      // Phase 4 will add actual wiki page routes; for now fall back to tool
      navigateToTool(element);
    },
    [navigateToTool]
  );

  // Default click handler — respects defaultView preference
  const navigateToElement = useCallback(
    (element: CodexElement) => {
      if (defaultView === "wiki") {
        navigateToWiki(element);
      } else {
        navigateToTool(element);
      }
    },
    [defaultView, navigateToWiki, navigateToTool]
  );

  // Search filter
  const filterElements = useCallback(
    (elements: CodexElement[]) => {
      if (!searchQuery.trim()) return elements;
      const q = searchQuery.toLowerCase();
      return elements.filter(
        (el) =>
          el.title.toLowerCase().includes(q) ||
          el.type.toLowerCase().includes(q) ||
          el.tags.some((t) => t.toLowerCase().includes(q))
      );
    },
    [searchQuery]
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
        <p className="font-mono text-[9px] uppercase tracking-wider text-destructive/60">
          Codex unavailable.
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
          className="sf-fill-sweep sf-fill-sweep--secondary w-full flex items-center justify-center h-6 border border-border/15 text-muted-foreground/40 hover:text-foreground/70 transition-colors"
          aria-label="Collapse Codex"
        >
          <span className="text-[9px]">◀</span>
        </button>
      </div>

      {/* World name */}
      <button
        onClick={() => navigate(`/worlds/${worldId}`)}
        className="px-3 py-1.5 text-left"
      >
        <span className="font-heading text-[13px] uppercase tracking-[2px] text-foreground/80 block truncate">
          {codexData.worldName}
        </span>
      </button>

      {/* Search */}
      <CodexSearch value={searchQuery} onChange={setSearchQuery} />

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {/* Cascade sections */}
        {codexData.cascadeSections.map((section) => {
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
            />
          );
        })}

        {/* Custom section */}
        <CodexCustomSection
          elements={filterElements(codexData.customEntries)}
          activeElementId={activeElementId}
          onElementClick={navigateToElement}
          onOpenWiki={navigateToWiki}
          onOpenTool={navigateToTool}
          onDelete={handleDelete}
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

      {/* Default view setting */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/30 whitespace-nowrap">
            Default view:
          </span>
          <Select value={defaultView} onValueChange={handleDefaultViewChange}>
            <SelectTrigger className="h-5 text-[9px] flex-1 border-border/15 bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tool" className="text-[10px]">Tool</SelectItem>
              <SelectItem value="wiki" className="text-[10px]">Wiki</SelectItem>
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
