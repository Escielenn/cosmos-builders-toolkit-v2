import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  // Focus ring and disabled colors come from the global :focus-visible /
  // :disabled rules in tokens.css — no component ring/opacity needed.
  "inline-flex items-center justify-center rounded-none text-sm font-medium transition-colors hover:bg-muted hover:text-t3 disabled:pointer-events-none data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-sf-line-interactive bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 min-h-hit px-3",
        sm: "h-9 min-h-hit px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root type="button" ref={ref} className={cn(toggleVariants({ variant, size, className }))} {...props} />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
