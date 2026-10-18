import { useEffect, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { PanelLeftOpen } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// The Codex sidebar's container. At md and up it is the inline, resizable
// column it always was. Below md (a 375px phone left ~115px of content beside
// a 260px column) the same sidebar moves into a left Sheet, closed by default
// and opened by one 44px button. WorldLayout owns the sidebar's contents; this
// file only decides where they sit.
// ---------------------------------------------------------------------------

/** Tailwind `md`. Below this the sidebar is a Sheet. */
export const CODEX_SHEET_QUERY = "(max-width: 767px)";

export const CODEX_MIN_WIDTH = 200;
export const CODEX_MAX_WIDTH = 400;
/** Arrow-key step for the resize separator, and the Shift+Arrow step. */
export const CODEX_KEY_STEP = 16;
export const CODEX_KEY_STEP_LARGE = 64;

function readQuery(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(query).matches;
}

/**
 * True below `md`. Initialised synchronously from matchMedia so a phone never
 * paints one frame of the 260px column before switching to the Sheet.
 */
export function useCodexSheetMode(query: string = CODEX_SHEET_QUERY): boolean {
  const [matches, setMatches] = useState(() => readQuery(query));
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/**
 * The width a keypress on the resize separator moves to, or null when the key
 * is not a resize key. Arrows step, Shift+Arrow steps further, Home and End
 * jump to the bounds. Always clamped.
 */
export function nextCodexWidth(
  width: number,
  key: string,
  shiftKey = false,
  min: number = CODEX_MIN_WIDTH,
  max: number = CODEX_MAX_WIDTH,
): number | null {
  const step = shiftKey ? CODEX_KEY_STEP_LARGE : CODEX_KEY_STEP;
  let next: number;
  switch (key) {
    case "ArrowLeft":
    case "ArrowDown":
      next = width - step;
      break;
    case "ArrowRight":
    case "ArrowUp":
      next = width + step;
      break;
    case "Home":
      next = min;
      break;
    case "End":
      next = max;
      break;
    default:
      return null;
  }
  return Math.max(min, Math.min(max, next));
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

interface CodexSidebarContainerProps {
  /** Below md: render the sidebar inside a left Sheet. */
  sheetMode: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Bottom offset for the open button, so it clears the audio player bar. */
  triggerBottomClassName?: string;
  /** The sidebar itself (the `<aside>`). */
  children: ReactNode;
}

export function CodexSidebarContainer({
  sheetMode,
  open,
  onOpenChange,
  triggerBottomClassName = "bottom-10",
  children,
}: CodexSidebarContainerProps): JSX.Element {
  if (!sheetMode) return <>{children}</>;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open registry"
          className={cn(
            "fixed left-4 z-40 inline-flex min-h-hit min-w-hit items-center justify-center rounded-none border border-sf-line bg-sf-surface text-t2 backdrop-blur-sf-panel transition-colors duration-base ease-sf-out hover:border-sf-line-emphasis hover:text-t1 no-print",
            triggerBottomClassName,
          )}
        >
          <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        aria-describedby={undefined}
        className="flex w-[min(320px,85vw)] flex-col gap-0 overflow-hidden rounded-none border-sf-line bg-sf-void p-0 sm:max-w-none"
      >
        <SheetHeader className="flex min-h-[56px] shrink-0 flex-row items-center border-b border-sf-line-hairline px-4 pr-14 text-left">
          {/* Eyebrow on an inner span: twMerge reads text-sf-eyebrow as a
              colour and would drop it against SheetTitle's text-lg. */}
          <SheetTitle className="text-t4">
            <span className="font-heading text-sf-eyebrow uppercase">Registry</span>
          </SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Resize separator (desktop only)
// ---------------------------------------------------------------------------

interface CodexResizeHandleProps {
  width: number;
  onWidthChange: (width: number) => void;
  onMouseDown: (e: MouseEvent<HTMLDivElement>) => void;
  /** id of the sidebar this separator resizes. */
  controls?: string;
}

/**
 * A focusable window splitter (WAI-ARIA separator pattern). Mouse drag is
 * WorldLayout's; the keyboard path is here.
 */
export function CodexResizeHandle({
  width,
  onWidthChange,
  onMouseDown,
  controls,
}: CodexResizeHandleProps): JSX.Element {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const next = nextCodexWidth(width, e.key, e.shiftKey);
    if (next === null) return;
    e.preventDefault();
    if (next !== width) onWidthChange(next);
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label="Resize registry"
      aria-controls={controls}
      aria-valuenow={width}
      aria-valuemin={CODEX_MIN_WIDTH}
      aria-valuemax={CODEX_MAX_WIDTH}
      className="sf-codex-resize-handle"
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
    />
  );
}
