/**
 * ToolRail, the one right rail of a tool page (1.6 "Quiet Instrument",
 * finding 14).
 *
 * Tool pages used to mount two fixed overlays on the right edge (Navigation
 * and Readout, via ToolSidebar) plus two floating NAV / READOUT buttons on
 * smaller screens. They are now one rail, tabbed "Sections | Readout":
 *
 *  - xl and up: a sticky column inside the tool page's content grid, so it
 *    scrolls with the page frame and never floats over content.
 *  - below xl: the same element becomes a right-hand drawer, opened from the
 *    Sections button in the tool's action bar.
 *
 * ToolPageLayout owns the rail and provides ToolRailContext. The existing
 * page-level components (SectionNavigation, KeyChoicesSidebar, ToolSidebar,
 * RailReadout) find the context and portal their content into the rail's
 * two panels, so 21 tool pages adopt it without restructuring.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { List, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToolReadOnly } from "@/contexts/ToolPreviewContext";

export type RailSlot = "sections" | "readout";

interface ToolRailContextValue {
  nodes: Record<RailSlot, HTMLElement | null>;
  register: (slot: RailSlot) => () => void;
  /** Closes the drawer (below xl). No-op on the sticky rail. */
  close: () => void;
}

const ToolRailContext = createContext<ToolRailContextValue | null>(null);

export function useToolRail(): ToolRailContextValue | null {
  return useContext(ToolRailContext);
}

/**
 * Registers a slot with the rail and returns its portal target. Returns null
 * outside a ToolPageLayout (callers fall back to their legacy rendering).
 */
export function useRailSlot(slot: RailSlot): HTMLElement | null {
  const rail = useContext(ToolRailContext);
  const register = rail?.register;
  useEffect(() => (register ? register(slot) : undefined), [register, slot]);
  return rail?.nodes[slot] ?? null;
}

/** Custom readout content for tools that don't use KeyChoicesSidebar. */
export function RailReadout({ children }: { children: ReactNode }) {
  return useToolReadOnly() ? null : <RailReadoutPortal>{children}</RailReadoutPortal>;
}

function RailReadoutPortal({ children }: { children: ReactNode }) {
  const node = useRailSlot("readout");
  return node ? createPortal(<div className="space-y-3">{children}</div>, node) : null;
}

// ─── State (owned by ToolPageLayout) ─────────────────────────────────

export interface ToolRailState {
  context: ToolRailContextValue;
  counts: Record<RailSlot, number>;
  hasRail: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  tab: RailSlot;
  setTab: (tab: RailSlot) => void;
  setNode: (slot: RailSlot) => (el: HTMLElement | null) => void;
  triggerRef: RefObject<HTMLButtonElement>;
  railId: string;
}

export function useToolRailState(): ToolRailState {
  const [nodes, setNodes] = useState<Record<RailSlot, HTMLElement | null>>({ sections: null, readout: null });
  const [counts, setCounts] = useState<Record<RailSlot, number>>({ sections: 0, readout: 0 });
  const [open, setOpenState] = useState(false);
  const [tab, setTab] = useState<RailSlot>("sections");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const railId = `sf-tool-rail-${useId().replace(/:/g, "")}`;

  const register = useCallback((slot: RailSlot) => {
    setCounts((c) => ({ ...c, [slot]: c[slot] + 1 }));
    return () => setCounts((c) => ({ ...c, [slot]: Math.max(0, c[slot] - 1) }));
  }, []);

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    // Focus returns to the button that opened the drawer.
    if (!next) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const close = useCallback(() => {
    setOpenState((wasOpen) => {
      if (wasOpen) requestAnimationFrame(() => triggerRef.current?.focus());
      return false;
    });
  }, []);

  // Callback refs, stable per slot, so a mounted panel re-renders consumers.
  const setters = useMemo(
    () => ({
      sections: (el: HTMLElement | null) => setNodes((n) => (n.sections === el ? n : { ...n, sections: el })),
      readout: (el: HTMLElement | null) => setNodes((n) => (n.readout === el ? n : { ...n, readout: el })),
    }),
    [],
  );
  const setNode = useCallback((slot: RailSlot) => setters[slot], [setters]);

  const context = useMemo(() => ({ nodes, register, close }), [nodes, register, close]);

  // A rail with only one kind of content shows that one.
  const activeTab: RailSlot =
    counts[tab] > 0 ? tab : counts.sections > 0 ? "sections" : "readout";

  return {
    context,
    counts,
    hasRail: counts.sections + counts.readout > 0,
    open,
    setOpen,
    tab: activeTab,
    setTab,
    setNode,
    triggerRef,
    railId,
  };
}

export function ToolRailProvider({ state, children }: { state: ToolRailState; children: ReactNode }) {
  return <ToolRailContext.Provider value={state.context}>{children}</ToolRailContext.Provider>;
}

// ─── The trigger (action bar, below xl) ──────────────────────────────

export function ToolRailTrigger({ state }: { state: ToolRailState }) {
  if (!state.hasRail) return null;
  const label = state.counts.sections > 0 ? "Sections" : "Readout";
  return (
    <Button
      ref={state.triggerRef}
      variant="outline"
      size="sm"
      className="xl:hidden"
      aria-expanded={state.open}
      aria-controls={state.railId}
      aria-label={state.counts.sections > 0 && state.counts.readout > 0 ? "Sections and readout" : label}
      onClick={() => state.setOpen(!state.open)}
    >
      <List className="w-4 h-4 sm:mr-2" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

// ─── The rail ────────────────────────────────────────────────────────

const TAB_LABEL: Record<RailSlot, string> = { sections: "Sections", readout: "Readout" };

/**
 * `variant="preview"`: under the Pro clearance panel, a plain (non-sticky,
 * xl-only) list of what the instrument contains.
 */
export function ToolRail({ state, variant = "rail" }: { state: ToolRailState; variant?: "rail" | "preview" }) {
  const preview = variant === "preview";
  const { open, setOpen, tab, setTab, counts, hasRail, railId } = state;
  const visible = hasRail;
  const tabs = (["sections", "readout"] as const).filter((t) => counts[t] > 0);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Drawer behaviour (below xl): Escape closes, focus moves in on open.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // Crossing to xl turns the drawer back into the sticky column.
  useEffect(() => {
    if (!open || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(min-width: 1280px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [open, setOpen]);

  return (
    <>
      {open && visible && (
        <div
          aria-hidden
          className="no-print fixed inset-0 z-50 bg-[var(--sf-scrim)] xl:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        id={railId}
        aria-label="Instrument rail"
        className={cn(
          "no-print",
          !visible && "hidden",
          visible && preview && "mt-6 hidden xl:flex xl:flex-col",
          visible &&
            !preview &&
            "xl:sticky xl:top-[var(--sf-rail-top)] xl:flex xl:max-h-[var(--sf-rail-max)] xl:flex-col xl:self-start",
          visible && !preview && !open && "max-xl:hidden",
          visible &&
            !preview &&
            open &&
            "max-xl:fixed max-xl:inset-y-0 max-xl:right-0 max-xl:z-50 max-xl:flex max-xl:w-[min(20rem,88vw)] max-xl:flex-col max-xl:border-l max-xl:border-sf-line max-xl:bg-sf-surface-elevated",
        )}
      >
        <div className="flex items-stretch border-b border-sf-line-hairline">
          {tabs.length > 1 ? (
            <div role="tablist" aria-label="Instrument rail" className="flex flex-1">
              {tabs.map((t) => {
                const selected = tab === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    id={`${railId}-tab-${t}`}
                    aria-selected={selected}
                    aria-controls={`${railId}-panel-${t}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setTab(t)}
                    onKeyDown={(e) => {
                      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                      e.preventDefault();
                      const next = tabs[(tabs.indexOf(t) + 1) % tabs.length];
                      setTab(next);
                      document.getElementById(`${railId}-tab-${next}`)?.focus();
                    }}
                    className={cn(
                      "flex min-h-hit flex-1 items-center justify-center border-b-2 px-3 font-heading text-sf-eyebrow uppercase transition-colors duration-base ease-sf-out",
                      selected
                        ? "border-sf-primary text-sf-primary-text"
                        : "border-transparent text-t3 hover:text-t1",
                    )}
                  >
                    {TAB_LABEL[t]}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="flex min-h-hit flex-1 items-center px-3 font-heading text-sf-eyebrow uppercase text-t4">
              {preview ? "Inside this instrument" : TAB_LABEL[tabs[0] ?? "sections"]}
            </p>
          )}
          <button
            ref={closeRef}
            type="button"
            aria-label="Close rail"
            onClick={() => setOpen(false)}
            className="flex min-h-hit min-w-hit items-center justify-center text-t3 hover:text-t1 xl:hidden"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {(["sections", "readout"] as const).map((t) => (
          <div
            key={t}
            ref={state.setNode(t)}
            id={`${railId}-panel-${t}`}
            role={tabs.length > 1 ? "tabpanel" : undefined}
            aria-labelledby={tabs.length > 1 ? `${railId}-tab-${t}` : undefined}
            className={cn("min-h-0 flex-1 overflow-y-auto sf-sb px-1 py-3", tab !== t && "hidden")}
          />
        ))}
      </aside>
    </>
  );
}
