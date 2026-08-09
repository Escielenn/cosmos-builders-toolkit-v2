import * as React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VelocityDial } from "@/components/ambient/VelocityDial";

/**
 * EmptyState, centered composition for zero-data states. April 2026 handoff.
 *
 * Uses the VelocityDial as the centerpiece (ambient telemetry while nothing
 * is loaded). Mono eyebrow, display-font title, Ship's Voice subtitle, single
 * primary CTA. Never "Oops! Nothing here yet!", always a mission-control
 * style index announcement.
 *
 * Usage:
 *   <EmptyState
 *     eyebrow="// WORLD INDEX"
 *     title="INDEX: EMPTY"
 *     description="NO WORLDS ON FILE. BEGIN SURVEY WHEN READY."
 *     actionLabel="BEGIN SURVEY"
 *     actionTo="/worlds/new"
 *   />
 */
interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Mono eyebrow, e.g. "// WORLD INDEX" */
  eyebrow?: string;
  /** Display-font H1, e.g. "INDEX: EMPTY" */
  title: string;
  /** Mono uppercase subtitle, e.g. "BEGIN SURVEY WHEN READY." */
  description?: string;
  /** Primary action button label */
  actionLabel?: string;
  /** If provided, action becomes a <Link to=...> */
  actionTo?: string;
  /** If provided, action calls this click handler */
  onAction?: () => void;
  /** Hide the velocity dial centerpiece (e.g. on dense lists) */
  hideDial?: boolean;
}

export function EmptyState({
  eyebrow,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  hideDial = false,
  className,
  ...props
}: EmptyStateProps) {
  const action = actionLabel ? (
    actionTo ? (
      <Button asChild variant="sf-primary" size="sf-md">
        <Link to={actionTo}>{actionLabel}</Link>
      </Button>
    ) : (
      <Button onClick={onAction} variant="sf-primary" size="sf-md">
        {actionLabel}
      </Button>
    )
  ) : null;

  return (
    <div
      className={cn(
        "relative w-full flex flex-col items-center justify-center gap-6 py-16 px-6 text-center",
        className,
      )}
      {...props}
    >
      {!hideDial && <VelocityDial className="w-40" />}

      {eyebrow && (
        <p className="font-mono text-[12px] tracking-[0.18em] uppercase text-sf-teal">
          {eyebrow}
        </p>
      )}

      <h2 className="font-display text-3xl md:text-4xl font-light tracking-sf-title uppercase text-t1">
        {title}
      </h2>

      {description && (
        <p className="font-mono text-[12px] tracking-[0.18em] uppercase text-t3 max-w-md">
          {description}
        </p>
      )}

      {action}
    </div>
  );
}
