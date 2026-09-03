import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Outlet, useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Loader } from "@/components/ui/loader";
import { LoadingState } from "@/components/ui/loading-state";
import { useWorld } from "@/hooks/use-world";
import { useSubscription } from "@/hooks/use-subscription";
import Codex from "@/components/codex/Codex";
import EntitySidebar from "@/components/world/EntitySidebar";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { useDeleteEntity, useEntities } from "@/hooks/use-entity-graph";
import { WorldLayoutProvider } from "@/contexts/WorldLayoutContext";
import { WorldThemeProvider } from "@/contexts/WorldThemeContext";
import { BookOpen, Network } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarTab = "codex" | "entities";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HEADER_HEIGHT = 64; // matches Header h-16
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const COLLAPSED_WIDTH = 48;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WorldLayout = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const { data: world, isLoading, error } = useWorld(worldId);
  const { isSubscribed } = useSubscription();

  // Sidebar tab, codex vs entities
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(() => {
    try {
      return (localStorage.getItem("sf-sidebar-tab") as SidebarTab) || "codex";
    } catch {
      return "codex";
    }
  });

  const handleSidebarTabChange = useCallback((tab: SidebarTab) => {
    setSidebarTab(tab);
    localStorage.setItem("sf-sidebar-tab", tab);
  }, []);

  // Entity deletion state
  const [deleteEntityId, setDeleteEntityId] = useState<string | null>(null);
  const deleteEntityMutation = useDeleteEntity(worldId);
  const { data: entitiesData } = useEntities(worldId);
  const deleteEntityName = useMemo(() => {
    if (!deleteEntityId || !entitiesData) return "";
    return entitiesData.find((e) => e.id === deleteEntityId)?.name ?? "";
  }, [deleteEntityId, entitiesData]);

  const confirmDeleteEntity = useCallback(() => {
    if (deleteEntityId) {
      deleteEntityMutation.mutate(deleteEntityId);
    }
    setDeleteEntityId(null);
  }, [deleteEntityId, deleteEntityMutation]);

  // Sidebar state, persisted in localStorage
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sf-codex-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [width, setWidth] = useState(() => {
    try {
      const saved = localStorage.getItem("sf-codex-width");
      return saved ? Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Number(saved))) : DEFAULT_WIDTH;
    } catch {
      return DEFAULT_WIDTH;
    }
  });

  // Persist state changes
  useEffect(() => {
    localStorage.setItem("sf-codex-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem("sf-codex-width", String(width));
  }, [width]);

  // Responsive: auto-collapse on tablet
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1024px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setCollapsed(true);
    };
    handler(mql);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Wiki-link click navigation: dispatched by WikiLinkExtension
  useEffect(() => {
    if (!worldId) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.elementId) {
        navigate(`/worlds/${worldId}/codex/${detail.elementId}`);
      }
    };
    window.addEventListener("sf-navigate-element", handler);
    return () => window.removeEventListener("sf-navigate-element", handler);
  }, [worldId, navigate]);

  // Resize drag
  const resizing = useRef(false);
  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      resizing.current = true;
      const startX = e.clientX;
      const startW = width;

      const onMove = (ev: MouseEvent) => {
        if (!resizing.current) return;
        const delta = ev.clientX - startX;
        const newW = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startW + delta));
        setWidth(newW);
      };

      const onUp = () => {
        resizing.current = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [width]
  );

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  // Loading / error states
  if (isLoading || !worldId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center" style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>
          <LoadingState message="LOADING WORLD FILE..." />
        </div>
      </div>
    );
  }

  if (error || !world) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center" style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-sf-crimson">
            // WORLD DATA UNAVAILABLE. RETRY WHEN READY.
          </p>
        </div>
      </div>
    );
  }

  return (
    <WorldLayoutProvider value={{ worldId, worldName: world.name, worldIcon: world.icon || "globe", isWorldLayout: true }}>
      <WorldThemeProvider theme={world.theme} isPro={isSubscribed}>
        <div className="min-h-screen bg-background">
          <Header />

          <div
            className="sf-world-layout"
            style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)`, marginTop: HEADER_HEIGHT }}
          >
            {/* Sidebar */}
            <aside
              className={`sf-codex ${collapsed ? "sf-codex--collapsed" : ""}`}
              style={{ width: collapsed ? COLLAPSED_WIDTH : width }}
            >
              {/* Tab toggle, hidden when collapsed */}
              {!collapsed && (
                <div className="flex border-b border-sf-border">
                  <button
                    onClick={() => handleSidebarTabChange("codex")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 font-heading text-[12px] font-medium uppercase tracking-[0.2em] transition-colors duration-base",
                      sidebarTab === "codex"
                        ? "text-sf-primary-text border-b-2 border-sf-primary bg-sf-primary/[0.06]"
                        : "text-t4 hover:text-t3"
                    )}
                    title="Registry (worksheets)"
                  >
                    <BookOpen className="w-3 h-3" />
                    Registry
                  </button>
                  <button
                    onClick={() => handleSidebarTabChange("entities")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 font-heading text-[12px] font-medium uppercase tracking-[0.2em] transition-colors duration-base",
                      sidebarTab === "entities"
                        ? "text-sf-primary-text border-b-2 border-sf-primary bg-sf-primary/[0.06]"
                        : "text-t4 hover:text-t3"
                    )}
                    title="Entity graph"
                  >
                    <Network className="w-3 h-3" />
                    Entities
                  </button>
                </div>
              )}

              {/* Active sidebar content */}
              {sidebarTab === "codex" ? (
                <Codex
                  worldId={worldId}
                  collapsed={collapsed}
                  onCollapse={toggleCollapse}
                />
              ) : (
                collapsed ? (
                  <Codex
                    worldId={worldId}
                    collapsed={collapsed}
                    onCollapse={toggleCollapse}
                  />
                ) : (
                  <EntitySidebar
                    worldId={worldId}
                    onEntityClick={(entityId) => navigate(`/worlds/${worldId}/connections?focus=${entityId}`)}
                    onCreateEntity={() => navigate(`/worlds/${worldId}/connections?create=true`)}
                    onDeleteEntity={setDeleteEntityId}
                  />
                )
              )}
            </aside>

            {/* Resize handle */}
            {!collapsed && (
              <div
                className="sf-codex-resize-handle"
                onMouseDown={startResize}
              />
            )}

            {/* Main content */}
            <main className="sf-world-main">
              <Outlet />
            </main>
          </div>
        </div>

        {/* Entity delete confirmation */}
        <DeleteConfirmDialog
          open={!!deleteEntityId}
          onOpenChange={(open) => !open && setDeleteEntityId(null)}
          onConfirm={confirmDeleteEntity}
          itemName={deleteEntityName}
          itemType="entity"
        />
      </WorldThemeProvider>
    </WorldLayoutProvider>
  );
};

export default WorldLayout;
