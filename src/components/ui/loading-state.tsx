import * as React from "react";
import { cn } from "@/lib/utils";
import { getLoadingMessage } from "@/lib/loading-messages";

/**
 * LoadingState, scanning-line loader (April 2026 handoff §11).
 *
 * A rectangular frame with a 1px teal line that sweeps top-to-bottom on
 * the `sf-scan` keyframe. Ship's Voice loading message underneath.
 *
 * Never use a spinner. Never "Loading...", pick from loading-messages.ts
 * by route or pass a custom `message` prop.
 *
 * Usage:
 *   <LoadingState />                       // auto-picks message by location.pathname
 *   <LoadingState message="CALIBRATING INSTRUMENTS..." />
 *   <LoadingState pathname="/tools/drake-equation-calculator" />
 */
interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Route to derive the flavor message from. Defaults to window.location.pathname. */
  pathname?: string;
  /** Hard-override the message. */
  message?: string;
  /** Scale: sm | md | lg */
  size?: "sm" | "md" | "lg";
  /** Hide the flavor text, render only the scanning frame. */
  silent?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<LoadingStateProps["size"]>, string> = {
  sm: "w-24 h-24",
  md: "w-40 h-40",
  lg: "w-64 h-64",
};

export function LoadingState({
  pathname,
  message,
  size = "md",
  silent = false,
  className,
  ...props
}: LoadingStateProps) {
  const flavor = message ?? getLoadingMessage(pathname ?? (typeof window !== "undefined" ? window.location.pathname : undefined));

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-5", className)}
      role="status"
      aria-live="polite"
      {...props}
    >
      <div className={cn("relative overflow-hidden border border-sf-line bg-sf-void/60", SIZE_CLASSES[size])}>
        {/* Corner brackets, 3px teal, one top-left + one bottom-right */}
        <span
          aria-hidden
          className="absolute top-0 left-0 w-3 h-3 border-t border-l border-sf-primary"
        />
        <span
          aria-hidden
          className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-sf-primary"
        />
        {/* Scanning line */}
        <div
          aria-hidden
          className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-sf-teal to-transparent shadow-sf-glow-teal animate-sf-scan"
          style={{ top: 0 }}
        />
        {/* Centered mono sigil */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[12px] tracking-[0.25em] text-sf-teal/60 uppercase">
            //TX
          </span>
        </div>
      </div>

      {!silent && (
        <p className="font-mono text-[12px] tracking-[0.18em] uppercase text-t3 text-center max-w-xs">
          {flavor}
        </p>
      )}
    </div>
  );
}
