import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * StatGrid — 4-column grid of mono eyebrow + display value. April 2026
 * handoff §09. No cards, no borders between cells by default — just spacing.
 *
 * Usage:
 *   <StatGrid>
 *     <StatGrid.Cell label="MASS" value="1.47" unit="Earth masses" />
 *     <StatGrid.Cell label="GRAVITY" value="0.94" unit="g" accent="amber" />
 *   </StatGrid>
 */
interface StatGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 2 | 3 | 4;
}

const COLS: Record<NonNullable<StatGridProps["cols"]>, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

const StatGridRoot = React.forwardRef<HTMLDivElement, StatGridProps>(
  ({ cols = 4, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("grid grid-cols-1 gap-6", COLS[cols], className)}
      {...props}
    >
      {children}
    </div>
  ),
);
StatGridRoot.displayName = "StatGrid";

interface CellProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  unit?: string;
  /** Visual accent — applies to value text only */
  accent?: "teal" | "amber" | "azure" | "emerald" | "violet" | "stellar" | "crimson";
}

const VALUE_ACCENT = {
  teal: "text-t1",
  amber: "text-sf-amber",
  azure: "text-sf-azure",
  emerald: "text-sf-emerald",
  violet: "text-sf-violet",
  stellar: "text-sf-stellar",
  crimson: "text-sf-crimson",
} as const;

const StatCell = React.forwardRef<HTMLDivElement, CellProps>(
  ({ label, value, unit, accent = "teal", className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props}>
      <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-t4">
        {label}
      </span>
      <span className={cn("font-display font-light text-[34px] leading-none tracking-[0.02em]", VALUE_ACCENT[accent])}>
        {value}
        {unit && <span className="font-mono text-[12px] text-t4 ml-1.5 tracking-[0.12em]">{unit}</span>}
      </span>
    </div>
  ),
);
StatCell.displayName = "StatGrid.Cell";

export const StatGrid = Object.assign(StatGridRoot, { Cell: StatCell });
