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
        <Calculator className="w-4 h-4 text-sf-crimson" />
        <span className="font-medium text-sm">Drake Context</span>
      </div>

      {drake.hasData ? (
        <div className="space-y-3">
          {/* N Value */}
          {drake.nValue !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-t3">
                Civilizations (N):
              </span>
              <span className="font-mono text-sf-crimson font-medium">
                {Math.round(drake.nValue).toLocaleString()}
              </span>
            </div>
          )}

          {/* Interpretation */}
          {drake.interpretation && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-t3">Galaxy:</span>
              <Badge
                variant="secondary"
                className="text-xs bg-sf-crimson/10 text-sf-crimson"
              >
                {drake.interpretation}
              </Badge>
            </div>
          )}

          {/* Counts */}
          <div className="pt-2 border-t border-sf-line-interactive space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-t3 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Planets:
              </span>
              <span className="font-mono text-sf-primary-text">
                {drake.planetCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-t3 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Species:
              </span>
              <span className="font-mono text-sf-emerald">
                {drake.speciesCount}
              </span>
            </div>
          </div>

          {/* Suggestion */}
          {drake.suggestion && (
            <div className="pt-2 border-t border-sf-line-interactive">
              <div className="flex items-start gap-2 p-2 bg-muted/30 rounded text-xs text-t3">
                <Lightbulb className="w-3 h-3 mt-0.5 text-sf-amber shrink-0" />
                <span>{drake.suggestion}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-t3">
          {drake.suggestion}
        </p>
      )}
    </GlassPanel>
  );
};

export default DrakeContextCard;
