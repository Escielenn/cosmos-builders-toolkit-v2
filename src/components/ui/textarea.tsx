import * as React from "react";

import { cn } from "@/lib/utils";
import { BracketPanel } from "@/components/ui/bracket-panel";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <BracketPanel size="sm" color="default">
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-[2px] border border-input bg-background px-3 py-2 text-sm font-mono placeholder:font-heading placeholder:uppercase placeholder:tracking-[0.08em] placeholder:text-t3/50 focus-visible:outline-none focus-visible:border-white/15 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
          className,
        )}
        ref={ref}
        {...props}
      />
    </BracketPanel>
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
