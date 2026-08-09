import { useEffect, useState } from "react";

/**
 * LunarPhase, current moon phase glyph + label. April 2026 handoff §15.
 *
 * Non-interactive, purely ambient. Shows phase as a filled/shaded circle
 * plus mono label (NEW, WAXING CRESCENT, FIRST QUARTER, ...).
 *
 * Uses a simple synodic-month approximation; exact within a day or two,
 * which is plenty for chrome.
 */
const SYNODIC_MONTH = 29.53058867; // days
// Reference new moon, 2000 Jan 6 18:14 UTC, JD 2451550.1.
const REF_JD = 2451550.1;

const PHASES = [
  { label: "NEW", glyph: "●" },
  { label: "WAXING CRESCENT", glyph: "☽" },
  { label: "FIRST QUARTER", glyph: "◐" },
  { label: "WAXING GIBBOUS", glyph: "◐" },
  { label: "FULL", glyph: "○" },
  { label: "WANING GIBBOUS", glyph: "◑" },
  { label: "LAST QUARTER", glyph: "◑" },
  { label: "WANING CRESCENT", glyph: "☾" },
] as const;

function computePhase(ms: number): (typeof PHASES)[number] {
  const jd = 2440587.5 + ms / 86_400_000;
  const elapsed = (jd - REF_JD) % SYNODIC_MONTH;
  const frac = elapsed / SYNODIC_MONTH; // 0..1 cycle
  const idx = Math.floor(frac * PHASES.length) % PHASES.length;
  return PHASES[idx];
}

export function LunarPhase({ className }: { className?: string }) {
  const [phase, setPhase] = useState(() => computePhase(Date.now()));

  useEffect(() => {
    const t = setInterval(() => setPhase(computePhase(Date.now())), 3_600_000); // hourly
    return () => clearInterval(t);
  }, []);

  return (
    <span
      className={`font-mono text-[12px] tracking-[0.18em] uppercase text-t4 whitespace-nowrap inline-flex items-center gap-1.5 ${className ?? ""}`}
      aria-hidden
      title="Current lunar phase"
    >
      <span className="text-sf-stellar/80 text-[13px]">{phase.glyph}</span>
      {phase.label}
    </span>
  );
}
