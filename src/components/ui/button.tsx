import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary: solid cyan with lift + glow on hover
        default: "bg-primary text-primary-foreground sf-btn-lift",
        // Destructive: crimson with subtle glow
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:translate-y-[-2px] hover:scale-[1.02] hover:shadow-[0_0_15px_hsl(var(--sf-glow-magenta))]",
        // Outline: transparent with border, cyan glow on hover (SF signature)
        outline: "border border-muted-foreground bg-transparent hover:border-primary hover:text-primary hover:shadow-[0_0_20px_hsl(var(--sf-glow-teal))] hover:bg-primary/[0.04]",
        // Secondary: elevated surface
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-[1.01]",
        // Ghost: minimal, just hover color shift
        ghost: "hover:bg-accent/10 hover:text-primary",
        // Link: underline on hover
        link: "text-primary underline-offset-4 hover:underline",
        // StellarForge signature button: uppercase, letter-spaced, transparent with glow
        sf: "bg-transparent border border-muted-foreground text-foreground uppercase tracking-[0.15em] text-xs font-medium hover:border-primary hover:text-primary hover:shadow-[0_0_20px_hsl(var(--sf-glow-teal))] hover:bg-primary/[0.04]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
