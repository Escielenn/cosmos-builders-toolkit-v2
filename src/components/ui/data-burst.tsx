import { cn } from "@/lib/utils";
import type { DataBurstConfig, DataBurstAnimation } from "@/lib/data-bursts/types";

interface DataBurstProps {
  content: string;
  position: React.CSSProperties;
  variant?: DataBurstConfig["variant"];
  animation?: DataBurstAnimation;
  parallax?: number;
  className?: string;
}

const animationClasses: Record<string, string> = {
  breathe: "sf-data-burst--breathe",
  flicker: "sf-data-burst--flicker",
  typewriter: "sf-data-burst--typewriter",
};

export const DataBurst = ({
  content,
  position,
  variant = "default",
  animation,
  parallax,
  className,
}: DataBurstProps) => {
  const style: React.CSSProperties & Record<string, unknown> = { ...position };
  if (parallax) {
    style["--burst-depth"] = parallax;
  }
  return (
    <span
      className={cn(
        "sf-data-burst",
        `sf-data-burst--${variant}`,
        animation && animation !== "none" && animation !== "live" && animationClasses[animation],
        parallax && "sf-burst-parallax",
        className
      )}
      style={style}
      aria-hidden="true"
    >
      {content}
    </span>
  );
};

interface PageBurstsProps {
  bursts: DataBurstConfig[];
  className?: string;
}

export const PageBursts = ({ bursts, className }: PageBurstsProps) => (
  <div
    className={cn(
      "absolute inset-0 pointer-events-none select-none z-0",
      className
    )}
    aria-hidden="true"
  >
    {bursts.map((burst, i) => (
      burst.animation === "live" ? (
        <LiveDataBurst
          key={i}
          content={burst.content}
          position={burst.position}
          variant={burst.variant}
          parallax={burst.parallax}
        />
      ) : (
        <DataBurst
          key={i}
          content={burst.content}
          position={burst.position}
          variant={burst.variant}
          animation={burst.animation}
          parallax={burst.parallax}
        />
      )
    ))}
  </div>
);

/* ── Live Data Burst ─────────────────────────────────────────────── */

import { useState, useEffect } from "react";

interface LiveDataBurstProps {
  content: string;
  position: React.CSSProperties;
  variant?: DataBurstConfig["variant"];
  parallax?: number;
  className?: string;
}

/**
 * Slowly mutates the last few digits of numeric values every 2-4s.
 * Respects prefers-reduced-motion (shows static content).
 */
export const LiveDataBurst = ({
  content,
  position,
  variant = "default",
  parallax,
  className,
}: LiveDataBurstProps) => {
  const [display, setDisplay] = useState(content);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const mutate = () => {
      setDisplay((prev) =>
        prev.replace(/\d(?=\d{0,2}(?:\s|$|[^\d]))/g, (match) => {
          if (Math.random() > 0.3) return match;
          const n = parseInt(match, 10);
          const delta = Math.random() > 0.5 ? 1 : -1;
          return String(Math.max(0, Math.min(9, n + delta)));
        })
      );
    };

    const delay = 2000 + Math.random() * 2000;
    const id = setInterval(mutate, delay);
    return () => clearInterval(id);
  }, []);

  const style: React.CSSProperties & Record<string, unknown> = { ...position };
  if (parallax) {
    style["--burst-depth"] = parallax;
  }

  return (
    <span
      className={cn(
        "sf-data-burst",
        `sf-data-burst--${variant}`,
        parallax && "sf-burst-parallax",
        className
      )}
      style={style}
      aria-hidden="true"
    >
      {display}
    </span>
  );
};
