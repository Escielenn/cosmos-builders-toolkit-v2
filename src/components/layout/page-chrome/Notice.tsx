import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Notice: the ONE inline notice (hints, empty-state explainers, cautions,
 * errors that aren't toasts). docs/stellarforge/15-PAGE-CHROME.md.
 *
 *   ┃ // LABEL                                   ×
 *   ┃ Body in DM Sans, sentence case, t2.
 *
 * A 2px left rule in the tone's hue is the only coloured edge; the rest of
 * the box sits on a soft `sf-line` frame. The label is the Ship's Voice part
 * (mono caps, short); the body is readable prose, never a wall of caps.
 */

export type NoticeTone = "info" | "caution" | "danger" | "success";

const TONE: Record<NoticeTone, { rule: string; label: string; fill: string }> = {
  info: { rule: "border-l-sf-primary", label: "text-sf-primary-text", fill: "bg-sf-primary/[0.04]" },
  caution: { rule: "border-l-sf-amber", label: "text-sf-amber-text", fill: "bg-sf-amber/[0.05]" },
  danger: { rule: "border-l-sf-crimson", label: "text-sf-crimson-text", fill: "bg-sf-crimson/[0.05]" },
  success: { rule: "border-l-sf-emerald", label: "text-sf-emerald-text", fill: "bg-sf-emerald/[0.04]" },
};

export interface NoticeProps {
  label?: string;
  children?: React.ReactNode;
  tone?: NoticeTone;
  icon?: React.ReactNode;
  onDismiss?: () => void;
  /** Right-aligned actions (buttons/links) under or beside the body. */
  actions?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export function Notice({
  label,
  children,
  tone = "info",
  icon,
  onDismiss,
  actions,
  compact = false,
  className,
}: NoticeProps): JSX.Element {
  const t = TONE[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "note"}
      className={cn(
        "relative border border-sf-line border-l-2",
        t.rule,
        t.fill,
        compact ? "px-3 py-2.5" : "px-4 py-3",
        onDismiss && "pr-12",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon && <span className={cn("mt-0.5 shrink-0", t.label)} aria-hidden>{icon}</span>}
        <div className="min-w-0 flex-1">
          {label && (
            <p className={cn("font-mono text-sf-mono uppercase", t.label)}>// {label.replace(/^\/\/\s*/, "")}</p>
          )}
          {children && (
            <div className={cn("font-sans text-t2", compact ? "text-sm" : "text-sf-small", label && "mt-1")}>
              {children}
            </div>
          )}
          {actions && <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute right-1 top-1 inline-flex min-h-hit min-w-hit items-center justify-center text-t4 transition-colors duration-fast hover:text-t1"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

export default Notice;
