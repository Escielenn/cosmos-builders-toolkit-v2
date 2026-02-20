import * as React from "react";
import { cn } from "@/lib/utils";

interface BracketPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Corner bracket color accent */
  color?: "default" | "teal" | "stellar" | "amber";
}

const BracketPanel = React.forwardRef<HTMLDivElement, BracketPanelProps>(
  ({ className, color = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("sf-bracket-panel", className)}
        data-bracket-color={color}
        {...props}
      >
        <span className="sf-bracket-corner sf-bracket-tl" aria-hidden="true" />
        <span className="sf-bracket-corner sf-bracket-tr" aria-hidden="true" />
        <span className="sf-bracket-corner sf-bracket-bl" aria-hidden="true" />
        <span className="sf-bracket-corner sf-bracket-br" aria-hidden="true" />
        {children}
      </div>
    );
  }
);
BracketPanel.displayName = "BracketPanel";

export { BracketPanel };
