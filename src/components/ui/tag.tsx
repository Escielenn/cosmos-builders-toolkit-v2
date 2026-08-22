import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Tag, inline mono pill, April 2026 handoff, borders solidified Aug 2026.
 *
 * 2px border-radius (the only element in the app allowed to round). Uppercase
 * JetBrains Mono, 12px/0.10em tracking (matches text-sf-mono). Background
 * keeps a 6% accent tint; the border is solid (canonical accent stop, no
 * alpha — alpha borders composite unpredictably over the starfield/grain/
 * video layers, per 10-LEGIBILITY.md).
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
  "inline-flex items-center gap-1 border px-2 py-0.5 rounded-sf-tag font-mono text-[12px] leading-none uppercase tracking-[0.10em] whitespace-nowrap select-none",
  {
    variants: {
      variant: {
        teal: "bg-sf-teal/[0.06] border-sf-teal text-sf-teal",
        amber: "bg-sf-amber/[0.06] border-sf-amber text-sf-amber",
        azure: "bg-sf-azure/[0.06] border-sf-azure text-sf-azure",
        violet: "bg-sf-violet/[0.06] border-sf-violet text-sf-violet",
        emerald: "bg-sf-emerald/[0.06] border-sf-emerald text-sf-emerald",
        stellar: "bg-sf-stellar/[0.06] border-sf-stellar text-sf-stellar",
        crimson: "bg-sf-crimson/[0.06] border-sf-crimson text-sf-crimson",
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
