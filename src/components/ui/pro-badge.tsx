import * as React from "react";
import { Tag } from "./tag";

/**
 * The one "this requires Pro" indicator. Before this component, the same
 * badge existed as 7 independent inline declarations across 2 unrelated
 * visual families (a violet outline and an amber filled/shimmer/Zap-icon
 * version) — genuine parallel truth for one semantic fact. Violet is the
 * documented canonical color for Pro badges (CLAUDE.md's accent table);
 * this wraps Tag's already-legibility-fixed violet variant rather than
 * hand-rolling a third styling.
 */
const ProBadge = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <Tag ref={ref} variant="violet" className={className} {...props}>
      PRO
    </Tag>
  )
);
ProBadge.displayName = "ProBadge";

export { ProBadge };
