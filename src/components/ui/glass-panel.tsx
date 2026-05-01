import * as React from "react";
import { cn } from "@/lib/utils";

type PanelLayer = "void" | "surface" | "elevated";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hover?: boolean;
  /** StellarForge light arc accent at bottom edge */
  lightArc?: boolean;
  /** April 2026 handoff, three layers, never stack four deep */
  layer?: PanelLayer;
  /** April 2026 handoff, teal L-shaped corner brackets (focal panels only) */
  bracket?: boolean;
}

const LAYER_CLASS: Record<PanelLayer, string> = {
  void: "bg-sf-void",
  surface: "bg-sf-surface/90",
  elevated: "bg-sf-surface-elevated",
};

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  (
    {
      className,
      glow = false,
      hover = false,
      lightArc = false,
      layer,
      bracket = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-panel relative",
          glow && "glass-panel-glow",
          hover && "sf-card-hover",
          bracket && "sf-bracket",
          layer && LAYER_CLASS[layer],
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

