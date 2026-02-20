import { cn } from "@/lib/utils";

interface LoaderProps {
  /** Visual variant of the loader */
  variant?: "segments" | "bar" | "skeleton" | "inline";
  /** Loading message text (Ship's Voice style) */
  message?: string;
  /** 0–100 progress for 'bar' variant; omit for indeterminate */
  progress?: number;
  /** Size of the loader */
  size?: "sm" | "md" | "lg";
  /** Accent color */
  color?: "teal" | "amber" | "stellar";
  className?: string;
}

const SEGMENTS = 5;

const Loader = ({
  variant = "segments",
  message,
  progress,
  size = "md",
  color = "teal",
  className,
}: LoaderProps) => {
  const colorClass =
    color === "amber"
      ? "sf-loader--amber"
      : color === "stellar"
        ? "sf-loader--stellar"
        : "";

  const sizeClass =
    size === "sm"
      ? "sf-loader--sm"
      : size === "lg"
        ? "sf-loader--lg"
        : "";

  // ── Segments ──
  if (variant === "segments") {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div
          className={cn("sf-loader", sizeClass, colorClass)}
          role="status"
          aria-label={message || "Loading"}
        >
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <div key={i} className="sf-loader-segment" />
          ))}
        </div>
        {message && (
          <span className="sf-loading-message">{message}</span>
        )}
      </div>
    );
  }

  // ── Inline (inside buttons) ──
  if (variant === "inline") {
    return (
      <div
        className={cn("sf-loader sf-loader--inline", colorClass)}
        role="status"
        aria-label="Loading"
      >
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <div key={i} className="sf-loader-segment" />
        ))}
      </div>
    );
  }

  // ── Progress Bar ──
  if (variant === "bar") {
    const isDeterminate = progress !== undefined;
    const progressColorClass =
      color === "amber"
        ? "sf-progress--amber"
        : color === "stellar"
          ? "sf-progress--stellar"
          : "";
    const progressSizeClass = size === "lg" ? "sf-progress--lg" : "";

    return (
      <div className={cn("w-full", className)}>
        <div
          className={cn(
            "sf-progress",
            !isDeterminate && "sf-progress--indeterminate",
            progressColorClass,
            progressSizeClass,
          )}
          role="progressbar"
          aria-valuenow={isDeterminate ? progress : undefined}
          aria-valuemin={isDeterminate ? 0 : undefined}
          aria-valuemax={isDeterminate ? 100 : undefined}
          aria-label={message || "Loading"}
        >
          <div
            className="sf-progress-fill"
            style={isDeterminate ? { width: `${progress}%` } : undefined}
          />
        </div>
        {message && (
          <div className="sf-progress-label">{message}</div>
        )}
      </div>
    );
  }

  // ── Skeleton ──
  if (variant === "skeleton") {
    return (
      <div className={cn("sf-skeleton sf-skeleton--card", className)} role="status" aria-label="Loading content" />
    );
  }

  return null;
};

export { Loader };
export type { LoaderProps };
