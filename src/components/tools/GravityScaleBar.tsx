import { cn } from "@/lib/utils";
import { REFERENCE_WORLDS } from "@/lib/surface-gravity/data";

interface GravityScaleBarProps {
  gravityRatio: number;
  className?: string;
}

const MAX_G = 6; // Scale goes to 6g

const GravityScaleBar = ({ gravityRatio, className }: GravityScaleBarProps) => {
  const clampedG = Math.min(gravityRatio, MAX_G);
  const userPercent = (clampedG / MAX_G) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>0g</span>
        <span>{MAX_G}g+</span>
      </div>

      {/* Scale bar */}
      <div className="relative h-8 rounded-md overflow-hidden bg-muted/30 border border-border/50">
        {/* Color zones */}
        <div className="absolute inset-0 flex">
          <div className="h-full bg-blue-500/10" style={{ width: `${(0.3 / MAX_G) * 100}%` }} />
          <div className="h-full bg-cyan-500/10" style={{ width: `${((0.7 - 0.3) / MAX_G) * 100}%` }} />
          <div className="h-full bg-green-500/10" style={{ width: `${((1.5 - 0.7) / MAX_G) * 100}%` }} />
          <div className="h-full bg-amber-500/10" style={{ width: `${((3.0 - 1.5) / MAX_G) * 100}%` }} />
          <div className="h-full bg-red-500/10 flex-1" />
        </div>

        {/* Reference world markers */}
        {REFERENCE_WORLDS.map((world) => {
          const percent = (world.gravity / MAX_G) * 100;
          if (percent > 100) return null;
          return (
            <div
              key={world.name}
              className="absolute top-0 h-full flex flex-col items-center justify-end"
              style={{ left: `${percent}%`, transform: "translateX(-50%)" }}
            >
              <div className="w-px h-3 bg-foreground/20" />
              <span className="text-[9px] text-muted-foreground leading-none mt-0.5 whitespace-nowrap">
                {world.label ?? world.name}
              </span>
            </div>
          );
        })}

        {/* User's planet marker */}
        <div
          className="absolute top-0 h-full flex items-center z-10"
          style={{ left: `${Math.min(userPercent, 99)}%`, transform: "translateX(-50%)" }}
        >
          <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
        </div>
      </div>

      {/* User value label */}
      <div className="flex justify-center">
        <span className="text-xs font-mono text-primary">
          {gravityRatio.toFixed(3)}g
          {gravityRatio > MAX_G && " (off scale)"}
        </span>
      </div>
    </div>
  );
};

export default GravityScaleBar;
