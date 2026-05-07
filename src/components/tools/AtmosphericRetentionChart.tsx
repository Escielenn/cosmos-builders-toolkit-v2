import { cn } from "@/lib/utils";
import { Check, AlertTriangle, X } from "lucide-react";
import type { GasRetention } from "@/lib/surface-gravity/calculations";

interface AtmosphericRetentionChartProps {
  retentionData: GasRetention[];
  className?: string;
}

const STATUS_ICONS = {
  retained: Check,
  marginal: AlertTriangle,
  escapes: X,
};

const STATUS_LABELS = {
  retained: "Retained",
  marginal: "Marginal",
  escapes: "Escapes",
};

const AtmosphericRetentionChart = ({ retentionData, className }: AtmosphericRetentionChartProps) => {
  // Max escape parameter for bar scaling (cap at 12 for visual)
  const maxParam = 12;

  return (
    <div className={cn("space-y-3", className)}>
      {retentionData.map((gas) => {
        const Icon = STATUS_ICONS[gas.status];
        const barWidth = Math.min((gas.escapeParameter / maxParam) * 100, 100);
        const thresholdPos = (6 / maxParam) * 100; // retention threshold at λ=6

        return (
          <div key={gas.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Icon
                  className="w-3.5 h-3.5"
                  style={{ color: gas.statusColor }}
                  aria-label={STATUS_LABELS[gas.status]}
                />
                <span className="font-medium text-t1">{gas.formula}</span>
                <span className="text-t3 text-xs">{gas.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono" style={{ color: gas.statusColor }}>
                  {STATUS_LABELS[gas.status]}
                </span>
                <span className="text-t3 font-mono">
                  λ={gas.escapeParameter.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Bar */}
            <div className="relative h-2 rounded-full bg-muted/30 overflow-hidden">
              {/* Retention threshold line */}
              <div
                className="absolute top-0 h-full w-px bg-foreground/20 z-10"
                style={{ left: `${thresholdPos}%` }}
              />
              {/* Value bar */}
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: gas.statusColor,
                  opacity: 0.7,
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1 text-[10px] text-t3">
        <div className="flex items-center gap-1">
          <div className="w-px h-3 bg-foreground/20" />
          <span>λ=6 retention threshold</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-[#2ECC71]/70" />
          <span>Retained</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-[#FFA500]/70" />
          <span>Marginal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-[#E74C3C]/70" />
          <span>Escapes</span>
        </div>
      </div>
    </div>
  );
};

export default AtmosphericRetentionChart;
