import { Calculator, Users, Globe, Lightbulb } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { useDrakeContext } from "@/hooks/use-drake-context";

interface DrakeContextCardProps {
  worldId: string;
}

const DrakeContextCard = ({ worldId }: DrakeContextCardProps) => {
  const drake = useDrakeContext(worldId);

  return (
    <GlassPanel className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-red-500" />
        <span className="font-medium text-sm">Drake Context</span>
      </div>

      {drake.hasData ? (
        <div className="space-y-3">
          {/* N Value */}
          {drake.nValue !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Civilizations (N):
              </span>
              <span className="font-mono text-red-500 font-medium">
                {Math.round(drake.nValue).toLocaleString()}
              </span>
            </div>
          )}

          {/* Interpretation */}
          {drake.interpretation && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Galaxy:</span>
              <Badge
                variant="secondary"
                className="text-xs bg-red-500/10 text-red-500"
              >
                {drake.interpretation}
              </Badge>
            </div>
          )}

          {/* Counts */}
          <div className="pt-2 border-t border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Planets:
              </span>
              <span className="font-mono text-cyan-500">
                {drake.planetCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                Species:
              </span>
              <span className="font-mono text-emerald-500">
                {drake.speciesCount}
              </span>
            </div>
          </div>

          {/* Suggestion */}
          {drake.suggestion && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-start gap-2 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
                <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                <span>{drake.suggestion}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {drake.suggestion}
        </p>
      )}
    </GlassPanel>
  );
};

export default DrakeContextCard;
