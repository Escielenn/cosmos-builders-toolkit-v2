import { useEffect, useState } from "react";

/**
 * SolCounter, integer days since StellarForge epoch (2020-01-01 UTC).
 * Non-interactive, ambient.
 *
 * Format: `SOL 19,327`
 */
const SF_EPOCH_MS = Date.UTC(2020, 0, 1); // 2020-01-01 00:00 UTC

export function SolCounter({ className }: { className?: string }) {
  const [sol, setSol] = useState(() => computeSol(Date.now()));

  useEffect(() => {
    // Update every 5 minutes, integer day-counter, no need for per-second.
    const t = setInterval(() => setSol(computeSol(Date.now())), 300_000);
    return () => clearInterval(t);
  }, []);

  return (
    <span
      className={`font-mono text-[12px] tracking-[0.18em] text-t4 whitespace-nowrap ${className ?? ""}`}
      aria-hidden
      title="Sol count, days since 2020-01-01"
    >
      SOL {sol.toLocaleString("en-US")}
    </span>
  );
}

function computeSol(ms: number): number {
  return Math.floor((ms - SF_EPOCH_MS) / 86_400_000);
}
