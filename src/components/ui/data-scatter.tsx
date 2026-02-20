import { cn } from "@/lib/utils";

const DATA_POINTS = [
  { text: "RA 14h 39m 36.5s", top: "12%", left: "8%" },
  { text: "DEC −60° 50′ 02″", top: "28%", right: "5%" },
  { text: "λ = 21.106 cm", bottom: "18%", left: "3%" },
  { text: "z = 0.0231", top: "45%", right: "12%" },
  { text: "T_eff = 5778 K", bottom: "35%", left: "15%" },
];

interface DataScatterProps {
  className?: string;
  /** Limit to fewer data points */
  count?: number;
}

const DataScatter = ({ className, count = 5 }: DataScatterProps) => (
  <div
    className={cn("absolute inset-0 pointer-events-none select-none overflow-hidden", className)}
    aria-hidden="true"
  >
    {DATA_POINTS.slice(0, count).map((point) => (
      <span
        key={point.text}
        className="absolute font-mono text-[7px] tracking-[1px] text-[rgba(255,179,71,0.08)] leading-none"
        style={{
          top: point.top,
          left: point.left,
          right: point.right,
          bottom: point.bottom,
        }}
      >
        {point.text}
      </span>
    ))}
  </div>
);

export default DataScatter;
