import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Border, focus ring, and disabled colors come from the global
          // input/select/textarea and :focus-visible rules in tokens.css.
          // DM Sans for words, JetBrains Mono for numbers (the type system's
          // split: mono is for numbers, coordinates and IDs, never prose).
          type === "number" ? "font-mono" : "font-sans",
          "flex h-11 w-full sf-field px-4 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-t1 placeholder:font-heading placeholder:uppercase placeholder:tracking-[0.08em] disabled:cursor-not-allowed transition-colors duration-base",
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
