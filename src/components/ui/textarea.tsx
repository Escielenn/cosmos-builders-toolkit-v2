import * as React from "react";

import { cn } from "@/lib/utils";
import { BracketPanel } from "@/components/ui/bracket-panel";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <BracketPanel size="sm" color="default">
      <textarea
        className={cn(
          "flex min-h-[112px] w-full sf-field px-4 py-3 text-base font-sans leading-relaxed placeholder:font-heading placeholder:uppercase placeholder:tracking-[0.08em] placeholder:text-t3 focus-visible:outline-none focus-visible:border-sf-line-emphasis disabled:cursor-not-allowed transition-colors duration-base",
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
