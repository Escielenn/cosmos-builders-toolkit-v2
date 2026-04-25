import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Eyebrow — small uppercase label above a heading. April 2026 handoff.
 *
 * Two flavors:
 *   font="heading" (default) — Jura 500 weight, 0.2em tracking
 *   font="mono"              — JetBrains Mono 400, 0.18em tracking; accepts a
 *                              `prefix` (e.g. "// 01 ·") in teal
 *
 * Tone: t3 (default, muted) or teal (accent).
 */
const eyebrowVariants = cva("inline-flex items-center gap-sf-2 uppercase leading-none", {
  variants: {
    font: {
      heading: "font-heading text-[11px] tracking-[0.2em] font-medium",
      mono: "font-mono text-[11px] tracking-[0.18em] font-normal",
    },
    tone: {
      t3: "text-t3",
      teal: "text-sf-teal",
      t4: "text-t4",
    },
  },
  defaultVariants: {
    font: "heading",
    tone: "t3",
  },
});

export interface EyebrowProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof eyebrowVariants> {
  /** mono-prefix, e.g. "// 01" or "§" — rendered in teal before the label */
  prefix?: string;
  children: React.ReactNode;
}

const Eyebrow = React.forwardRef<HTMLDivElement, EyebrowProps>(
  ({ className, font, tone, prefix, children, ...props }, ref) => (
    <div ref={ref} className={cn(eyebrowVariants({ font, tone }), className)} {...props}>
      {prefix ? (
        <span className="font-mono text-sf-teal tracking-[0.18em]" aria-hidden>
          {prefix}
        </span>
      ) : null}
      <span>{children}</span>
    </div>
  )
);
Eyebrow.displayName = "Eyebrow";

export { Eyebrow, eyebrowVariants };
