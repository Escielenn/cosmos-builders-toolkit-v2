import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // April 2026 handoff: zero radius, teal focus ring at 35% opacity.
          "flex h-10 w-full rounded-none border border-sf-border bg-background px-3 py-2 text-base font-mono file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:font-heading placeholder:uppercase placeholder:tracking-[0.08em] placeholder:text-t3/50 focus-visible:outline-none focus-visible:border-sf-teal/[0.35] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors duration-base",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
