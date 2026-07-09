import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-medium ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary: solid cyan with fill-sweep
        default: "bg-primary text-primary-foreground sf-btn-lift",
        // Destructive: crimson with white fill-sweep (same pattern as primary)
        destructive: "bg-destructive text-destructive-foreground sf-btn-lift",
        // Outline: transparent with border, primary fill-sweep
        outline: "border border-muted-foreground bg-transparent sf-fill-sweep sf-fill-sweep--primary hover:border-primary hover:text-primary",
        // Secondary: elevated surface with neutral fill-sweep
        secondary: "bg-secondary text-secondary-foreground sf-fill-sweep sf-fill-sweep--secondary",
        // Ghost: minimal with subtle fill-sweep
        ghost: "sf-fill-sweep sf-fill-sweep--secondary hover:text-primary",
        // Link: sweep underline on hover
        link: "text-primary sf-text-link",
        // StellarForge signature: uppercase, letter-spaced, primary fill-sweep
        sf: "bg-transparent border border-muted-foreground text-t1 uppercase tracking-[0.15em] text-xs font-medium sf-fill-sweep sf-fill-sweep--primary hover:border-primary hover:text-primary",
        /* ── April 2026 handoff ── zero-radius, teal-filled primary */
        "sf-primary":
          "border border-sf-teal bg-sf-teal text-[hsl(var(--accent-on-accent))] font-sans font-medium uppercase tracking-[1.2px] transition-base ease-sf-out hover:shadow-sf-glow-teal hover:-translate-y-[1px] active:translate-y-0",
        /* ── April 2026 handoff ── transparent outline ghost */
        "sf-ghost":
          "border border-sf-border-strong bg-transparent text-t1 font-sans font-medium uppercase tracking-[1.2px] transition-base ease-sf-out hover:border-sf-teal hover:text-sf-teal-bright hover:shadow-sf-inset-teal",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
        /* ── April 2026 handoff sizes ── match tracking-[1.2px] text sizes from the spec */
        "sf-sm": "h-9 text-[11px] px-4 py-2",
        "sf-md": "h-10 text-[13px] px-[22px] py-3",
        "sf-lg": "h-12 text-[14px] px-7 py-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp type={asChild ? undefined : type} className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };