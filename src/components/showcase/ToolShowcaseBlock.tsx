import { Crown, Check, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/glass-panel";
import { getToolIcon } from "@/components/icons/tool-icons";

// Import mockup components
import DrakeMockup from "./mockups/DrakeMockup";
import PlanetaryMockup from "./mockups/PlanetaryMockup";
import XenomythMockup from "./mockups/XenomythMockup";
import EvoBioMockup from "./mockups/EvoBioMockup";
import ECRMockup from "./mockups/ECRMockup";
import SpacecraftMockup from "./mockups/SpacecraftMockup";
import PropulsionMockup from "./mockups/PropulsionMockup";

interface ToolShowcaseBlockProps {
  toolId: string;
  title: string;
  description: string;
  features: string[];
  isPro: boolean;
  imageSide: "left" | "right";
}

const ToolShowcaseBlock = ({
  toolId,
  title,
  description,
  features,
  isPro,
  imageSide,
}: ToolShowcaseBlockProps) => {
  const ToolIcon = getToolIcon(toolId);

  // Get the appropriate mockup component
  const MockupComponent = getMockupComponent(toolId);

  return (
    <div
      className={`
        flex flex-col gap-8 items-center
        ${imageSide === "left" ? "lg:flex-row" : "lg:flex-row-reverse"}
      `}
    >
      {/* Mockup */}
      <div className="w-full lg:w-3/5">
        <GlassPanel lightArc className="p-4 md:p-6 overflow-hidden">
          <div className="aspect-[4/3] relative">
            <MockupComponent />
          </div>
        </GlassPanel>
      </div>

      {/* Content */}
      <div className="w-full lg:w-2/5 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          {ToolIcon && (
            <div className="flex-shrink-0">
              <ToolIcon className="w-14 h-14" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-display font-light text-xl md:text-2xl uppercase tracking-wider">
                {title}
              </h3>
              {isPro && (
                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                  <Crown className="w-3 h-3 mr-1" />
                  Pro
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div>
          {isPro ? (
            <Button variant="outline" className="gap-2" asChild>
              <Link to="/pricing">
                <Lock className="w-4 h-4" />
                Unlock with Pro
              </Link>
            </Button>
          ) : (
            <Button className="gap-2" asChild>
              <Link to="/auth?tab=signup">
                Try This Tool
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Get the appropriate mockup component for a tool
 */
function getMockupComponent(toolId: string): React.ComponentType {
  const mockups: Record<string, React.ComponentType> = {
    "drake-equation-calculator": DrakeMockup,
    "planetary-profile": PlanetaryMockup,
    "xenomythology-framework-builder": XenomythMockup,
    "evolutionary-biology": EvoBioMockup,
    "environmental-chain-reaction": ECRMockup,
    "spacecraft-designer": SpacecraftMockup,
    "propulsion-consequences-map": PropulsionMockup,
  };

  return mockups[toolId] || PlaceholderMockup;
}

/**
 * Placeholder mockup for tools without a custom one
 */
const PlaceholderMockup = () => (
  <div className="w-full h-full flex items-center justify-center bg-sf-surface/50 rounded-lg">
    <span className="text-muted-foreground text-sm">Preview</span>
  </div>
);

export default ToolShowcaseBlock;
