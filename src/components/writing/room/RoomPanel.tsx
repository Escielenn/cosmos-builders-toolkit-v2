// ---------------------------------------------------------------------------
// RoomPanel, the one shell every writing-room tool opens in.
//
// A non-modal instrument panel: it hangs under the Manuscript's bar on the
// right (a bottom drawer on phones), the prose stays live beside it, and the
// writer keeps typing while a meter fills or a suggestion list shortens. No
// scrim, no focus trap. Escape (with focus inside) or the close button shuts
// it and hands focus back to the page.
//
// One panel at a time (room-store.panel). Sits on `elevated`, tier z-40.
// ---------------------------------------------------------------------------

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { closePanel, roomEditor, useRoom } from "@/lib/writing/room-store";

export interface RoomPanelProps {
  /** Short Jura label, written in caps ("WRITING ASSISTANT"). */
  title: string;
  /** Accessible name when it should differ from the title. */
  label?: string;
  children: ReactNode;
}

export function RoomPanel({ title, label, children }: RoomPanelProps): JSX.Element | null {
  const anchorTop = useRoom((s) => s.anchorTop);
  const ref = useRef<HTMLDivElement>(null);

  // Keyboard users land on the panel; pointer users have already clicked.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  if (typeof document === "undefined") return null;
  const top = Math.max(56, anchorTop ?? 104);

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-label={label ?? title}
      tabIndex={-1}
      data-room-panel
      onKeyDown={(e) => {
        if (e.key !== "Escape" || e.defaultPrevented) return;
        e.stopPropagation();
        closePanel();
        roomEditor()?.commands.focus();
      }}
      style={{ ["--room-top" as string]: `${top}px` }}
      className="fixed inset-x-0 bottom-0 z-40 flex max-h-[72dvh] flex-col border-t border-sf-line bg-sf-surface-elevated/95 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur-sf-panel outline-none animate-in fade-in-0 duration-base sm:inset-x-auto sm:bottom-auto sm:right-3 sm:top-[var(--room-top)] sm:max-h-[calc(100dvh-var(--room-top)-44px)] sm:w-[400px] sm:border sm:pb-0"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-sf-line-hairline pl-4">
        <h2 className="font-heading text-sf-eyebrow uppercase text-t2">{title}</h2>
        <button
          type="button"
          onClick={closePanel}
          aria-label={`Close ${(label ?? title).toLowerCase()}`}
          className="flex min-h-hit min-w-hit items-center justify-center text-t3 transition-colors duration-fast hover:text-t1"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="sf-sb min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>,
    document.body,
  );
}

/** A titled block inside a panel: Jura eyebrow over a hairline. */
export function PanelSection({
  title,
  aside,
  children,
}: {
  title?: string;
  aside?: ReactNode;
  children: ReactNode;
}): JSX.Element {
  return (
    <section className="border-b border-sf-line-hairline px-4 py-3 last:border-b-0">
      {title && (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h3 className="font-heading text-sf-eyebrow uppercase text-t4">{title}</h3>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export default RoomPanel;
