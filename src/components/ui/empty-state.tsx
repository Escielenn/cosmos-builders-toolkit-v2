import * as React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VelocityDial } from "@/components/ambient/VelocityDial";

/**
 * EmptyState, centered composition for zero-data states. April 2026 handoff.
 *
 * Uses the VelocityDial as the centerpiece (ambient telemetry while nothing
 * is loaded). Optional mono eyebrow, a title, one plain sentence of help,
 * single primary CTA. 1.7 (Clarity first): the title and help are written in
 * sentence case and rendered as written; say what is missing and what to do.
 *
 * Usage:
 *   <EmptyState
 *     title="No worlds yet"
 *     description="Create a world to start building and writing."
 *     actionLabel="New world"
 *     actionTo="/worlds?create=true"
 *   />
 */
interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Mono eyebrow, e.g. "// WORLD INDEX" */
  eyebrow?: string;
  /** Display-font heading, sentence case, e.g. "No worlds yet" */
  title: string;
  /** One plain sentence: what to do next. */
  description?: string;
  /** Primary action button label */
  actionLabel?: string;
  /** If provided, action becomes a <Link to=...> */
  actionTo?: string;
  /** If provided, action calls this click handler */
  onAction?: () => void;
  /** Hide the velocity dial centerpiece (e.g. on dense lists) */
  hideDial?: boolean;
  /**
   * WRITER-register variant: title
   * renders in Lora italic serif (sentence case in the caller) instead of
   * MD Nichrome uppercase, for pages a writer inhabits rather than an
   * instrument surface. The eyebrow/description stay mono - only the title
   * carries the register shift.
   */
  warm?: boolean;
}

export function EmptyState({
  eyebrow,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  hideDial = false,
  warm = false,
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
        <p className="font-mono text-[12px] tracking-wide uppercase text-sf-primary-text">
          {eyebrow}
        </p>
      )}

      <h2
        className={cn(
          "text-3xl md:text-4xl font-light text-t1",
          warm ? "font-serif italic" : "font-display tracking-title",
        )}
      >
        {title}
      </h2>

      {description && (
        <p className="font-sans text-sf-body text-t2 max-w-md">
          {description}
        </p>
      )}

      {action}
    </div>
  );
}
