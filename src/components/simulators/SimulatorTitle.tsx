import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * SimulatorTitle: the one title block on a simulator canvas
 * (docs/stellarforge/15-PAGE-CHROME.md §1, "Simulator titles").
 *
 * Simulator canvases are full-bleed and carry no PageHeader; this is the
 * piece of chrome they keep, and it reads the same in every simulator:
 *
 *   NAME        MD Nichrome 300, 26px at 0.24em (20px at 0.12em on phones), uppercase, t1
 *   SUBTITLE    DM Sans 500, 12px, 0.12em, uppercase, t3
 *   CONTEXT     DM Sans 13px, primary -text (the system or planet in view)
 *   [status]    a status badge or any extra row
 *
 * The four static (iframe) sims match it through
 * public/tools/_shared/sim-title.css. Keep the two in step.
 *
 * It owns the canvas's h1, which is why this file is on the page-chrome
 * guard's allow-list (scripts/check-page-chrome.mjs).
 */
export interface SimulatorTitleProps {
  name: string;
  subtitle?: ReactNode;
  context?: ReactNode;
  /** Status badge or other row under the title. Add pointer-events-auto to anything clickable. */
  children?: ReactNode;
  /** Positioning. Defaults to the canvas's top-left corner (18px inset). */
  className?: string;
}

export function SimulatorTitle({ name, subtitle, context, children, className }: SimulatorTitleProps): JSX.Element {
  return (
    <div
      className={cn("pointer-events-none absolute left-[18px] top-[18px] z-10", className)}
      data-simulator-title
    >
      <h1 className="m-0 font-display text-[20px] font-light uppercase leading-[1.1] tracking-wide text-t1 md:text-[26px] md:tracking-ultra">
        {name}
      </h1>
      {subtitle && (
        <p className="mt-1.5 font-sans text-[12px] font-medium uppercase leading-[1.3] tracking-wide text-t3">
          {subtitle}
        </p>
      )}
      {context && <p className="mt-1 font-sans text-[13px] text-sf-primary-text">{context}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

export default SimulatorTitle;
