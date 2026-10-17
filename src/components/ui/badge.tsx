import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-none border px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-sf-primary bg-sf-primary text-sf-on-primary",
        secondary: "border-sf-line bg-sf-surface-elevated text-t2",
        destructive: "border-sf-crimson bg-sf-crimson/[0.06] text-sf-crimson-text",
        outline: "border-sf-line-interactive text-t1",
        glow: "bg-sf-primary/[0.06] border-sf-primary text-sf-primary-text",
        "glow-amber": "bg-sf-amber/[0.06] border-sf-amber text-sf-amber-text",
        /** Retired alias: renders as glow (primary). Do not use in new code. */
        "glow-cyan": "bg-sf-primary/[0.06] border-sf-primary text-sf-primary-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
