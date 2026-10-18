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
  /**
   * Inside another panel, a plain GlassPanel flattens into a group: no frame,
   * no second backdrop, a hairline rule above it instead (softening pass,
   * 2026-10-18: no box inside a box). Pass `nested="frame"` to keep the frame
   * for a card that genuinely needs one. Panels with `hover`, `bracket` or
   * `glow`, and any panel whose className sets its own border colour, keep
   * their frame regardless.
   */
  nested?: "flatten" | "frame";
}

/** How many GlassPanels enclose this one. 0 = top level. */
const PanelDepthContext = React.createContext(0);

const NESTED_GROUP =
  "relative border-0 border-t border-sf-line-hairline bg-transparent backdrop-blur-none shadow-none pt-4 first:border-t-0 first:pt-0";

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
      nested = "flatten",
      children,
      ...props
    },
    ref
  ) => {
    const depth = React.useContext(PanelDepthContext);
    const flatten = depth > 0 && nested === "flatten" && !glow && !hover && !bracket;
    if (flatten) {
      return (
        <PanelDepthContext.Provider value={depth + 1}>
          <div ref={ref} className={cn(NESTED_GROUP, className)} data-panel-nested="" {...props}>
            {children}
          </div>
        </PanelDepthContext.Provider>
      );
    }
    return (
      <PanelDepthContext.Provider value={depth + 1}>
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
      </PanelDepthContext.Provider>
    );
  }
);
GlassPanel.displayName = "GlassPanel";

export { GlassPanel, PanelDepthContext };

