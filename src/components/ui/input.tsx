import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[2px] border border-input bg-background px-3 py-2 text-base font-mono file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:font-heading placeholder:uppercase placeholder:tracking-[0.08em] placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:border-white/15 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors duration-200",
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
