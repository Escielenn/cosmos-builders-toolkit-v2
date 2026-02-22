import { useState, useCallback, useRef, useEffect } from "react";
import { Outlet, useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Loader } from "@/components/ui/loader";
import { useWorld } from "@/hooks/use-world";
import { useSubscription } from "@/hooks/use-subscription";
import Codex from "@/components/codex/Codex";
import { WorldLayoutProvider } from "@/contexts/WorldLayoutContext";
import { WorldThemeProvider } from "@/contexts/WorldThemeContext";

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

  // Sidebar state — persisted in localStorage
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
        navigate(`/worlds/${worldId}/pages/${detail.elementId}`);
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
          <Loader size="sm" />
        </div>
      </div>
    );
  }

  if (error || !world) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center" style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>
          <p className="font-mono text-[10px] uppercase tracking-wider text-destructive">
            World data unavailable. Retry.
          </p>
        </div>
      </div>
    );
  }

  return (
    <WorldLayoutProvider value={{ worldId, worldName: world.name, isWorldLayout: true }}>
      <WorldThemeProvider theme={world.theme} isPro={isSubscribed}>
        <div className="min-h-screen bg-background">
          <Header />

          <div
            className="sf-world-layout"
            style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)`, marginTop: HEADER_HEIGHT }}
          >
            {/* Codex Sidebar */}
            <aside
              className={`sf-codex ${collapsed ? "sf-codex--collapsed" : ""}`}
              style={{ width: collapsed ? COLLAPSED_WIDTH : width }}
            >
              <Codex
                worldId={worldId}
                collapsed={collapsed}
                onCollapse={toggleCollapse}
              />
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
      </WorldThemeProvider>
    </WorldLayoutProvider>
  );
};

export default WorldLayout;
