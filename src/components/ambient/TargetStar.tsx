import { useEffect, useState } from "react";

/**
 * TargetStar — rotating "next destination" with light-year distance.
 * April 2026 handoff §15.
 *
 * Cycles through a fixed set of real nearby stars every 4 minutes. Non-
 * interactive ambient flavor.
 */
type Target = {
  name: string;
  ly: number;    // light-years
  spec: string;  // spectral class
};

const TARGETS: Target[] = [
  { name: "PROXIMA CENTAURI", ly: 4.24, spec: "M5.5Ve" },
  { name: "BARNARD'S STAR",    ly: 5.96, spec: "M4.0V" },
  { name: "WOLF 359",          ly: 7.86, spec: "M6V" },
  { name: "LALANDE 21185",     ly: 8.31, spec: "M2V" },
  { name: "SIRIUS A",          ly: 8.66, spec: "A1V" },
  { name: "ROSS 154",          ly: 9.69, spec: "M3.5V" },
  { name: "EPSILON ERIDANI",   ly: 10.5, spec: "K2V" },
  { name: "TAU CETI",          ly: 11.9, spec: "G8V" },
  { name: "TRAPPIST-1",        ly: 40.7, spec: "M8V" },
];

export function TargetStar({ className }: { className?: string }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * TARGETS.length));

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % TARGETS.length), 240_000); // 4 min
    return () => clearInterval(t);
  }, []);

  const t = TARGETS[idx];

  return (
    <span
      className={`font-mono text-[11px] tracking-[0.18em] uppercase text-t4 whitespace-nowrap ${className ?? ""}`}
      aria-hidden
      title="Next destination"
    >
      <span className="text-sf-teal">TARGET</span>
      <span className="text-t5"> · </span>
      {t.name}
      <span className="text-t5"> · </span>
      <span className="text-t2">{t.ly.toFixed(2)} ly</span>
      <span className="text-t5"> · </span>
      <span className="text-sf-amber-warm">{t.spec}</span>
    </span>
  );
}
