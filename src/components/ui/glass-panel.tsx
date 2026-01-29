import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hover?: boolean;
  /** StellarForge light arc accent at bottom edge */
  lightArc?: boolean;
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, glow = false, hover = false, lightArc = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-panel relative",
          glow && "glass-panel-glow",
          hover && "transition-all duration-300 hover:scale-[1.02] hover:border-primary/30",
          // StellarForge light arc: gradient line at bottom edge
          lightArc && [
            "after:absolute after:bottom-0 after:left-[10%] after:right-[10%] after:h-px",
            "after:bg-gradient-to-r after:from-transparent after:via-primary/50 after:to-transparent",
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassPanel.displayName = "GlassPanel";

export { GlassPanel };
