import { GlassPanel } from "@/components/ui/glass-panel";
import { Globe, Dna, Sparkles, GitBranch, Rocket, Zap, Calculator } from "lucide-react";
import { getToolColor } from "@/hooks/use-world-graph";
import { getToolDisplayName } from "@/lib/worksheet-links-config";

interface LegendItem {
  toolType: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const LEGEND_ITEMS: LegendItem[] = [
  { toolType: "planetary-profile", Icon: Globe },
  { toolType: "evolutionary-biology", Icon: Dna },
  { toolType: "environmental-chain-reaction", Icon: GitBranch },
  { toolType: "xenomythology-framework-builder", Icon: Sparkles },
  { toolType: "spacecraft-designer", Icon: Rocket },
  { toolType: "propulsion-consequences-map", Icon: Zap },
  { toolType: "drake-equation-calculator", Icon: Calculator },
];

const ConnectionLegend = () => {
  return (
    <GlassPanel className="p-4">
      <h3 className="font-medium text-sm mb-3">Tool Types</h3>
      <div className="space-y-2">
        {LEGEND_ITEMS.map(({ toolType, Icon }) => {
          const color = getToolColor(toolType);
          const name = getToolDisplayName(toolType);

          return (
            <div key={toolType} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `hsl(${color} / 0.2)` }}
              >
                <Icon
                  className="w-3 h-3"
                  style={{ color: `hsl(${color})` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{name}</span>
            </div>
          );
        })}
      </div>

      {/* Link Types */}
      <h3 className="font-medium text-sm mt-4 mb-3">Link Types</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-1 rounded-full"
            style={{ backgroundColor: "hsl(190 100% 50%)" }}
          />
          <span className="text-xs text-muted-foreground">Planet Link</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-1 rounded-full"
            style={{ backgroundColor: "hsl(153 100% 50%)" }}
          />
          <span className="text-xs text-muted-foreground">Species Link</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-1 rounded-full"
            style={{ backgroundColor: "hsl(328 100% 50%)" }}
          />
          <span className="text-xs text-muted-foreground">Environment Link</span>
        </div>
      </div>
    </GlassPanel>
  );
};

export default ConnectionLegend;
