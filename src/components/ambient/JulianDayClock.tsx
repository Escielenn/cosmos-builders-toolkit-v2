import { useEffect, useState } from "react";

/**
 * JulianDayClock — renders the current Julian Date in mono.
 * Updates every 60s. Non-interactive, ambient telemetry.
 *
 * Format: `JD 2461158.5`
 */
export function JulianDayClock({ className }: { className?: string }) {
  const [jd, setJD] = useState(() => computeJD(Date.now()));

  useEffect(() => {
    const t = setInterval(() => setJD(computeJD(Date.now())), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <span
      className={`font-mono text-[11px] tracking-[0.18em] text-t4 whitespace-nowrap ${className ?? ""}`}
      aria-hidden
      title="Julian Date (days since Jan 1 4713 BC 12:00 UT)"
    >
      JD {jd.toFixed(3)}
    </span>
  );
}

function computeJD(ms: number): number {
  // Unix epoch (1970-01-01 00:00:00 UTC) = JD 2440587.5
  return 2440587.5 + ms / 86_400_000;
}
