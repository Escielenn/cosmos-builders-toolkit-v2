import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * StatusPill, dot + label, color-coded to phase. April 2026 handoff.
 *
 * Use in the top bar, footer, and status rows. The dot is a 6×6 filled circle;
 * the label is mono 11px uppercase. Matches the Tag recipe (6/15/100 opacity)
 * but adds semantic phase presets.
 *
 * Phase presets:
 *   signal  , stellar blue (scanning / locating)
 *   ignite  , amber (parameters loaded, pre-launch)
 *   ignition, teal (live / transmitting)
 *   orbit   , violet (steady state / cruising)
 */
const statusPillVariants = cva(
  "inline-flex items-center gap-sf-2 border px-sf-2 py-sf-1 rounded-sf-tag font-mono text-[11px] leading-none uppercase tracking-[0.18em] whitespace-nowrap select-none",
  {
    variants: {
      variant: {
        teal: "bg-sf-teal/[0.06] border-sf-teal/[0.15] text-sf-teal",
        amber: "bg-sf-amber/[0.06] border-sf-amber/[0.15] text-sf-amber",
        azure: "bg-sf-azure/[0.06] border-sf-azure/[0.15] text-sf-azure",
        violet: "bg-sf-violet/[0.06] border-sf-violet/[0.15] text-sf-violet",
        emerald: "bg-sf-emerald/[0.06] border-sf-emerald/[0.15] text-sf-emerald",
        stellar: "bg-sf-stellar/[0.06] border-sf-stellar/[0.15] text-sf-stellar",
        crimson: "bg-sf-crimson/[0.06] border-sf-crimson/[0.15] text-sf-crimson",
        signal: "bg-sf-stellar/[0.06] border-sf-stellar/[0.15] text-sf-stellar",
        ignite: "bg-sf-amber/[0.06] border-sf-amber/[0.15] text-sf-amber",
        ignition: "bg-sf-teal/[0.06] border-sf-teal/[0.15] text-sf-teal",
        orbit: "bg-sf-violet/[0.06] border-sf-violet/[0.15] text-sf-violet",
      },
      pulse: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "teal",
      pulse: false,
    },
  }
);

const dotVariants = cva("inline-block h-1.5 w-1.5 rounded-full", {
  variants: {
    variant: {
      teal: "bg-sf-teal",
      amber: "bg-sf-amber",
      azure: "bg-sf-azure",
      violet: "bg-sf-violet",
      emerald: "bg-sf-emerald",
      stellar: "bg-sf-stellar",
      crimson: "bg-sf-crimson",
      signal: "bg-sf-stellar",
      ignite: "bg-sf-amber",
      ignition: "bg-sf-teal",
      orbit: "bg-sf-violet",
    },
    pulse: {
      true: "animate-sf-pulse",
      false: "",
    },
  },
  defaultVariants: {
    variant: "teal",
    pulse: false,
  },
});

export interface StatusPillProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof statusPillVariants> {
  label: string;
}

const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ className, variant, pulse, label, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(statusPillVariants({ variant, pulse }), className)}
      {...props}
    >
      <span aria-hidden className={cn(dotVariants({ variant, pulse }))} />
      {label}
    </span>
  )
);
StatusPill.displayName = "StatusPill";

export { StatusPill, statusPillVariants };
