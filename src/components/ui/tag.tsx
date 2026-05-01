import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Tag, inline mono pill, April 2026 handoff.
 *
 * 2px border-radius (the only element in the app allowed to round). Uppercase
 * JetBrains Mono, 11px/0.18em tracking. Uses the 6% / 15% / 100% opacity glow
 * recipe: bg at 6%, border at 15%, text at 100%.
 *
 * Color is a cascade layer, never decorative:
 *   teal     , Integration / primary
 *   amber    , Physics / warnings
 *   azure    , creative direction / links
 *   violet   , Lore / phase ORBIT
 *   emerald  , data nodes / life
 *   stellar  , Worlds / phase SIGNAL
 *   crimson  , Stop / errors
 */
const tagVariants = cva(
  "inline-flex items-center gap-1 border px-2 py-0.5 rounded-sf-tag font-mono text-[11px] leading-none uppercase tracking-[0.18em] whitespace-nowrap select-none",
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
      },
    },
    defaultVariants: {
      variant: "teal",
    },
  }
);

export interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {}

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(tagVariants({ variant }), className)}
      {...props}
    >
      {children}
    </span>
  )
);
Tag.displayName = "Tag";

export { Tag, tagVariants };
