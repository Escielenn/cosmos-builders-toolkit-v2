import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * KeyValueRow, `label :  value` line for telemetry panels. April 2026
 * handoff §09. Both sides mono.
 *
 * Usage:
 *   <KeyValueRow label="γ" value="1.414" />
 *   <KeyValueRow label="Δv" value="4.22e7 m/s" accent="amber" />
 */
interface KeyValueRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Visual accent for the value side */
  accent?: "t1" | "teal" | "amber" | "emerald" | "crimson" | "stellar";
  /** Show the colon separator (default true) */
  colon?: boolean;
}

const VALUE_TONE = {
  t1: "text-t1",
  teal: "text-sf-teal",
  amber: "text-sf-amber",
  emerald: "text-sf-emerald",
  crimson: "text-sf-crimson",
  stellar: "text-sf-stellar",
} as const;

export const KeyValueRow = React.forwardRef<HTMLDivElement, KeyValueRowProps>(
  ({ label, value, accent = "t1", colon = true, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-baseline justify-between gap-3 font-mono text-[13px] tracking-[0.12em] leading-snug",
        className,
      )}
      {...props}
    >
      <span className="text-t4 uppercase whitespace-nowrap">
        {label}
        {colon && <span className="text-t5">{" : "}</span>}
      </span>
      <span className={cn("tabular-nums text-right truncate", VALUE_TONE[accent])}>
        {value}
      </span>
    </div>
  ),
);
KeyValueRow.displayName = "KeyValueRow";
