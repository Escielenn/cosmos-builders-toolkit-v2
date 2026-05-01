import { useEffect, useState } from "react";

/**
 * CommitTicker, rotating fake "last commit" message for ambient flavor.
 * Picks one entry per day based on the day-of-year, so the string feels
 * stable per session but drifts across the week. April 2026 handoff §15.
 *
 * Non-interactive, non-essential. Drop into footer or long-form pages.
 */
const MESSAGES = [
  'fix: gravity tensor drift in low-g',
  'feat: cascade suggestion weighting',
  'refactor: velocity-frame sampling',
  'fix: atmosphere retention edge case for super-Earths',
  'chore: bump catalog cache TTL to 24h',
  'feat: xenomyth archetype v2 mapping',
  'fix: orbital-period rounding at 0.999c',
  'perf: memoize cascade graph layout',
  'feat: lunar-phase indicator',
  'fix: habitable-zone inner edge for M-dwarfs',
  'refactor: extract ParallaxStrips speed schedule',
  'chore: prune unused codex snapshots',
  'feat: sensorium acuity slider',
  'fix: evo-bio body-plan selection race',
];

function daysSinceEpoch(): number {
  const start = Date.UTC(2020, 0, 1);
  return Math.floor((Date.now() - start) / 86_400_000);
}

export function CommitTicker({ className }: { className?: string }) {
  const [idx, setIdx] = useState(() => daysSinceEpoch() % MESSAGES.length);

  useEffect(() => {
    // Rotate once per hour so long-running sessions see drift.
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % MESSAGES.length);
    }, 3_600_000);
    return () => clearInterval(t);
  }, []);

  return (
    <span
      className={`font-mono text-[11px] tracking-[0.18em] uppercase text-t5 whitespace-nowrap ${className ?? ""}`}
      aria-hidden
      title="Latest revision"
    >
      LAST · {MESSAGES[idx]}
    </span>
  );
}
