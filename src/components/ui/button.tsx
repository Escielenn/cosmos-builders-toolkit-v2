import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Focus ring and disabled colors come from the global :focus-visible / :disabled
  // rules in src/styles/tokens.css — a component rule here would suppress them.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-medium transition-all duration-300 ease-out disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary: solid cyan with fill-sweep
        default: "bg-primary text-primary-foreground sf-btn-lift",
        // Destructive: crimson with white fill-sweep (same pattern as primary)
        destructive: "bg-destructive text-destructive-foreground sf-btn-lift",
        // Outline: transparent with border, primary fill-sweep
        outline: "border border-sf-line-interactive bg-transparent sf-fill-sweep sf-fill-sweep--primary hover:border-primary hover:text-primary",
        // Secondary: elevated surface with neutral fill-sweep
        secondary: "bg-secondary text-secondary-foreground sf-fill-sweep sf-fill-sweep--secondary",
        // Ghost: minimal with subtle fill-sweep
        ghost: "sf-fill-sweep sf-fill-sweep--secondary hover:text-primary",
        // Link: sweep underline on hover
        link: "text-primary sf-text-link",
        // StellarForge signature: uppercase, letter-spaced, primary fill-sweep
        sf: "bg-transparent border border-sf-line-interactive text-t1 uppercase tracking-[0.15em] text-xs font-medium sf-fill-sweep sf-fill-sweep--primary hover:border-primary hover:text-primary",
        /* ── April 2026 handoff ── zero-radius, teal-filled primary */
        "sf-primary":
          "border border-sf-teal bg-sf-teal text-[hsl(var(--accent-on-accent))] font-sans font-medium uppercase tracking-[1.2px] transition-base ease-sf-out hover:shadow-sf-glow-teal hover:-translate-y-[1px] active:translate-y-0",
        /* ── April 2026 handoff ── transparent outline ghost */
        "sf-ghost":
          "border border-sf-line-interactive bg-transparent text-t1 font-sans font-medium uppercase tracking-[1.2px] transition-base ease-sf-out hover:border-sf-teal hover:text-sf-teal-bright hover:shadow-sf-inset-teal",
      },
      size: {
        /* Heights target a comfortable desktop hit area; every size clears the
           44px hit-target minimum via min-h-hit, even where the visual height
           (padding-driven) reads more compact. */
        default: "h-11 min-h-hit px-5 py-2",
        sm: "h-10 min-h-hit px-4",
        lg: "h-12 px-8",
        icon: "h-11 w-11",
        /* ── April 2026 handoff sizes ── match tracking-[1.2px] text sizes from the spec */
        "sf-sm": "h-10 min-h-hit text-[12px] px-4 py-2",
        "sf-md": "h-11 text-[14px] px-[22px] py-3",
        "sf-lg": "h-12 text-[15px] px-8 py-4",
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