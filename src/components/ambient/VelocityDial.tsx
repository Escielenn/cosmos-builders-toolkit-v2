/**
 * VelocityDial, ambient telemetry dial (April 2026 handoff).
 *
 * Cycles every 3.4s through four real reference frames. Non-interactive , 
 * drop in footers, loading states, or empty states as mission-control flavor.
 *
 * Port of design_handoff_April_2026/reference-components/VelocityDial.tsx.
 */
import { useEffect, useState } from "react";

type Frame = { name: string; v: string; u: string; pct: number };

const FRAMES: Frame[] = [
  { name: "EARTH ROTATION", v: "0.465", u: "km/s", pct: 0.05 },
  { name: "SOLAR ORBIT", v: "29.78", u: "km/s", pct: 0.22 },
  { name: "SOLAR APEX", v: "19.4", u: "km/s", pct: 0.15 },
  { name: "GALACTIC ORBIT", v: "230", u: "km/s", pct: 0.88 },
];

export function VelocityDial({ className }: { className?: string }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % FRAMES.length), 3400);
    return () => clearInterval(t);
  }, []);

  const f = FRAMES[idx];
  const deg = -135 + 270 * f.pct;

  const start = -Math.PI * 1.25;
  const end = start + Math.PI * 1.5 * f.pct;
  const r = 60;
  const cx = 100;
  const cy = 100;
  const arcD =
    `M ${cx + Math.cos(start) * r} ${cy + Math.sin(start) * r} ` +
    `A ${r} ${r} 0 ${end - start > Math.PI ? 1 : 0} 1 ` +
    `${cx + Math.cos(end) * r} ${cy + Math.sin(end) * r}`;

  return (
    <div
      className={`relative aspect-square bg-sf-void border border-sf-border p-5 ${className ?? ""}`}
      aria-hidden
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="veloArc" x1="0" x2="1">
            <stop offset="0" stopColor="#15C17B" stopOpacity="0.1" />
            <stop offset="1" stopColor="#15C17B" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Tick ring */}
        {Array.from({ length: 60 }).map((_, i) => {
          const a = -Math.PI * 1.25 + (i / 59) * Math.PI * 1.5;
          const x1 = 100 + Math.cos(a) * 82;
          const y1 = 100 + Math.sin(a) * 82;
          const x2 = 100 + Math.cos(a) * (i % 5 === 0 ? 72 : 76);
          const y2 = 100 + Math.sin(a) * (i % 5 === 0 ? 72 : 76);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={i % 5 === 0 ? "#6B7484" : "#2E3548"}
              strokeWidth={i % 5 === 0 ? 1.2 : 0.8}
            />
          );
        })}

        {/* Base + filled arc */}
        <path
          d={`M ${100 + Math.cos(-Math.PI * 1.25) * 60} ${100 + Math.sin(-Math.PI * 1.25) * 60} A 60 60 0 1 1 ${100 + Math.cos(Math.PI * 0.25) * 60} ${100 + Math.sin(Math.PI * 0.25) * 60}`}
          fill="none"
          stroke="#2E3548"
          strokeWidth={3}
        />
        <path d={arcD} fill="none" stroke="url(#veloArc)" strokeWidth={3} strokeLinecap="round" />

        {/* Needle */}
        <line
          x1={100}
          y1={100}
          x2={100}
          y2={40}
          stroke="#15C17B"
          strokeWidth={1.5}
          style={{
            transformOrigin: "100px 100px",
            transform: `rotate(${deg}deg)`,
            transition: "transform 2400ms cubic-bezier(0.4,0,0.2,1)",
          }}
        />
        <circle cx={100} cy={100} r={5} fill="#0A0E17" stroke="#15C17B" strokeWidth={1.5} />
        <circle cx={100} cy={100} r={1.5} fill="#15C17B" />
      </svg>

      <div className="absolute left-1/2 top-[62%] -translate-x-1/2 text-center">
        <div className="font-mono text-[9.5px] text-t4 tracking-[2px]">{f.name}</div>
        <div className="font-display font-light text-[26px] text-t1 tracking-[0.04em] mt-1">
          {f.v}
          <span className="text-[12px] text-t4 ml-1">{f.u}</span>
        </div>
      </div>

      <div className="absolute left-3.5 top-3.5 font-mono text-[9px] text-sf-teal tracking-[2px]">
        VELOCITY
      </div>
      <div className="absolute right-3.5 top-3.5 font-mono text-[9px] text-t5 tracking-[2px]">
        REF-FRAME
      </div>
    </div>
  );
}
