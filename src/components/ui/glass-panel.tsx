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
          hover && "sf-card-hover",
          className
        )}
        {...props}
      >
        {children}
        {lightArc && (
          <div
            className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent pointer-events-none"
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
);
GlassPanel.displayName = "GlassPanel";

export { GlassPanel };
