import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Outlet, useLocation, useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Loader } from "@/components/ui/loader";
import { LoadingState } from "@/components/ui/loading-state";
import { useWorld } from "@/hooks/use-world";
import { useSubscription } from "@/hooks/use-subscription";
import Codex from "@/components/codex/Codex";
import EntitySidebar from "@/components/world/EntitySidebar";
import WorldSpaceNav from "@/components/world/WorldSpaceNav";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { useDeleteEntity, useEntities } from "@/hooks/use-entity-graph";
import { WorldLayoutProvider } from "@/contexts/WorldLayoutContext";
import { WorldThemeProvider } from "@/contexts/WorldThemeContext";
import {
  CodexSidebarContainer,
  CodexResizeHandle,
  useCodexSheetMode,
  CODEX_MIN_WIDTH,
  CODEX_MAX_WIDTH,
} from "@/components/world/CodexSidebarContainer";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { BookOpen, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { isWorldManuscriptPath } from "@/lib/manuscript-path";

type SidebarTab = "codex" | "entities";

/** The sidebar's two tabs. Ids stay as stored in localStorage; labels follow
 *  13-THE-LIFT §1 (the worksheet list is "Worksheets", the things in a world
 *  are Codex "Entries"). */
const SIDEBAR_TABS: { id: SidebarTab; label: string; title: string; Icon: typeof BookOpen }[] = [
  { id: "codex", label: "Worksheets", title: "Worksheets in this world", Icon: BookOpen },
  { id: "entities", label: "Entries", title: "Codex entries in this world", Icon: Network },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HEADER_HEIGHT = 64; // matches Header h-16
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = CODEX_MIN_WIDTH;
const MAX_WIDTH = CODEX_MAX_WIDTH;
const CODEX_ID = "sf-codex-sidebar";
const COLLAPSED_WIDTH = 48;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WorldLayout = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: world, isLoading, error } = useWorld(worldId);
  // The Manuscript (1.5 #26) keeps the site header and the space nav like
  // every other world route (15-PAGE-CHROME §1) but drops the world sidebar:
  // its binder is that surface's index. Focus mode hides header and nav.
  const manuscript = !!worldId && isWorldManuscriptPath(pathname, worldId);
  const manuscriptRef = useRef(manuscript);
  manuscriptRef.current = manuscript;
  const [chromeHidden, setChromeHidden] = useState(false);
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

  // Below md the sidebar is a left Sheet, closed by default (item 29: the
  // 260px column left ~115px of content at 375px). Desktop is unchanged.
  const sheetMode = useCodexSheetMode();
  const [sheetOpen, setSheetOpen] = useState(false);
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);
  const { hasEverLoaded: audioVisible, minimized: audioMinimized } = useAudioPlayer();
  const sheetTriggerBottom = audioVisible
    ? audioMinimized ? "bottom-[76px]" : "bottom-[100px]"
    : "bottom-10";

  // Sidebar state, persisted in localStorage. In the Sheet the sidebar is
  // always full width, whatever the desktop preference says.
  const [collapsedPref, setCollapsed] = useState(() => {
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
  const collapsed = sheetMode ? false : collapsedPref;

  useEffect(() => {
    localStorage.setItem("sf-codex-collapsed", String(collapsedPref));
  }, [collapsedPref]);

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

  // Editor click navigation. Two extensions dispatch here: WikiLinkExtension
  // (`sf-navigate-element`, a [[wiki link]]) and EntityMention
  // (`sf-navigate-entity`, an @mention). Before F3 they pointed at two
  // different entity models and only the first had a listener at all — the
  // second was dispatched into nothing (AMENDMENTS 2026-09-03). One graph,
  // one destination: the entity's Codex page.
  useEffect(() => {
    if (!worldId) return;
    const handler = (e: Event) => {
      // The Manuscript opens a mention beside the prose instead (Write.tsx).
      if (manuscriptRef.current) return;
      const detail = (e as CustomEvent).detail;
      const id = detail?.elementId ?? detail?.entityId;
      if (id) navigate(`/worlds/${worldId}/codex/${id}`);
    };
    window.addEventListener("sf-navigate-element", handler);
    window.addEventListener("sf-navigate-entity", handler);
    return () => {
      window.removeEventListener("sf-navigate-element", handler);
      window.removeEventListener("sf-navigate-entity", handler);
    };
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
    // In the Sheet, "collapse" means put the Sheet away.
    if (sheetMode) {
      setSheetOpen(false);
      return;
    }
    setCollapsed((prev) => !prev);
  }, [sheetMode]);

  // Loading / error states: same frame as the loaded page (site header, no
  // world nav yet because there is no world to navigate).
  if (isLoading || !worldId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center" style={{ height: `calc(100dvh - ${HEADER_HEIGHT}px)`, marginTop: HEADER_HEIGHT }}>
          <LoadingState message="LOADING WORLD FILE..." />
        </div>
      </div>
    );
  }

  if (error || !world) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center" style={{ height: `calc(100dvh - ${HEADER_HEIGHT}px)`, marginTop: HEADER_HEIGHT }}>
          <p className="font-mono text-sf-mono uppercase text-sf-crimson-text">
            // WORLD DATA UNAVAILABLE. RETRY WHEN READY.
          </p>
        </div>
      </div>
    );
  }

  const layoutValue = {
    worldId,
    worldName: world.name,
    worldIcon: world.icon || "globe",
    isWorldLayout: true as const,
    setChromeHidden,
  };

  // 15-PAGE-CHROME §1: one frame on every world route. Site header, then the
  // world nav directly beneath it, then the space. Focus mode (Manuscript
  // only) is the one thing that hides the header and the nav.
  const showChrome = !(manuscript && chromeHidden);
  const frameOffset = showChrome ? HEADER_HEIGHT : 0;

  return (
    <WorldLayoutProvider value={layoutValue}>
      <WorldThemeProvider theme={world.theme} isPro={isSubscribed}>
        <div className="min-h-screen bg-background">
          {showChrome && <Header />}

          <div
            className="grid grid-rows-[auto_minmax(0,1fr)]"
            data-world-frame={manuscript ? "manuscript" : "space"}
            style={{ height: `calc(100dvh - ${frameOffset}px)`, marginTop: frameOffset }}
          >
            {showChrome ? <WorldSpaceNav worldId={worldId} /> : <div />}

            {manuscript ? (
              // The Manuscript keeps its own full-height grid (topbar, binder,
              // page, rail, footer). The binder is its index, so the world
              // sidebar stands aside here. Outside .sf-world-layout on purpose:
              // the world accent override never reached the Studio.
              <div className="min-h-0">
                <Outlet />
              </div>
            ) : (
              <div className="sf-world-layout min-h-0">
                {/* Sidebar: inline column at md+, left Sheet below md */}
                <CodexSidebarContainer
                  sheetMode={sheetMode}
                  open={sheetOpen}
                  onOpenChange={setSheetOpen}
                  triggerBottomClassName={sheetTriggerBottom}
                >
                <aside
                  id={CODEX_ID}
                  aria-label="World index"
                  className={`sf-codex sf-sb ${collapsed ? "sf-codex--collapsed" : ""} ${sheetMode ? "sf-codex--sheet" : ""}`}
                  style={sheetMode ? undefined : { width: collapsed ? COLLAPSED_WIDTH : width }}
                >
                  {/* Tab toggle, hidden when collapsed */}
                  {!collapsed && (
                    <div className="flex border-b border-sf-line-hairline" role="tablist" aria-label="World sidebar">
                      {SIDEBAR_TABS.map(({ id, label, title, Icon }) => {
                        const selected = sidebarTab === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            role="tab"
                            id={`sf-sidebar-tab-${id}`}
                            aria-selected={selected}
                            aria-controls="sf-sidebar-panel"
                            tabIndex={selected ? 0 : -1}
                            onClick={() => handleSidebarTabChange(id)}
                            onKeyDown={(e) => {
                              // Arrow keys move between the two tabs (WAI-ARIA tabs).
                              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                              e.preventDefault();
                              const next = SIDEBAR_TABS[(SIDEBAR_TABS.findIndex((t) => t.id === id) + 1) % SIDEBAR_TABS.length];
                              handleSidebarTabChange(next.id);
                              document.getElementById(`sf-sidebar-tab-${next.id}`)?.focus();
                            }}
                            className={cn(
                              "flex min-h-hit flex-1 items-center justify-center gap-1.5 border-b-2 px-2 font-heading text-[12px] font-medium uppercase tracking-wide transition-colors duration-base",
                              selected
                                ? "border-sf-primary bg-sf-primary/[0.06] text-sf-primary-text"
                                : "border-transparent text-t3 hover:text-t1"
                            )}
                            title={title}
                          >
                            <Icon className="h-3 w-3" aria-hidden />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Active sidebar content */}
                  <div
                    id="sf-sidebar-panel"
                    role={collapsed ? undefined : "tabpanel"}
                    aria-labelledby={collapsed ? undefined : `sf-sidebar-tab-${sidebarTab}`}
                    className="h-full"
                  >
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
                        onEntityClick={(entityId) => navigate(`/worlds/${worldId}/codex/${entityId}`)}
                        onCreateEntity={() => navigate(`/worlds/${worldId}/codex?view=web&create=true`)}
                        onDeleteEntity={setDeleteEntityId}
                      />
                    )
                  )}
                  </div>
                </aside>
                </CodexSidebarContainer>

                {/* Resize handle: drag, or focus and use the arrow keys */}
                {!collapsed && !sheetMode && (
                  <CodexResizeHandle
                    width={width}
                    onWidthChange={setWidth}
                    onMouseDown={startResize}
                    controls={CODEX_ID}
                  />
                )}

                {/* Main content */}
                <main id="main" tabIndex={-1} className="sf-world-main sf-sb">
                  <Outlet />
                </main>
              </div>
            )}
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
