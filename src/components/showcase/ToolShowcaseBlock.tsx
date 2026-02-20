import { Crown, Check, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/glass-panel";
import { getToolIcon } from "@/components/icons/tool-icons";
import { scrollReveal, viewportOnce } from "@/lib/animations";

// Import mockup components
import DrakeMockup from "./mockups/DrakeMockup";
import ECRMockup from "./mockups/ECRMockup";
import ScreenshotMockup, { ScreenshotPlaceholder } from "./mockups/ScreenshotMockup";

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
  const MockupComponent = getMockupComponent(toolId, title);

  return (
    <motion.div
      className={`
        flex flex-col gap-8 items-center
        ${imageSide === "left" ? "lg:flex-row" : "lg:flex-row-reverse"}
      `}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={scrollReveal}
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
              <ToolIcon className="w-14 h-14 rounded-sm" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-heading font-light text-xl md:text-2xl uppercase tracking-wider">
                {title}
              </h3>
              {isPro && (
                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 sf-shimmer">
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
    </motion.div>
  );
};

/**
 * Get the appropriate mockup component for a tool.
 *
 * Animated mockups are used for tools that have matching visualizations:
 * - Drake: Has real animated sliders in the tool
 * - ECR: Will have cascade preview visualization added to the tool
 *
 * Screenshot mockups are used for other tools (once user provides screenshots).
 * Until screenshots are provided, a placeholder is shown.
 */
function getMockupComponent(toolId: string, title: string): React.ComponentType {
  // Tools with animated mockups that match actual tool features
  if (toolId === "drake-equation-calculator") {
    return DrakeMockup;
  }
  if (toolId === "environmental-chain-reaction") {
    return ECRMockup;
  }

  // Tools awaiting screenshots - show placeholder for now
  // Once user provides screenshots in public/screenshots/, update these paths
  const screenshotPaths: Record<string, string> = {
    "planetary-profile": "/screenshots/planetary.png",
    "xenomythology-framework-builder": "/screenshots/xenomyth.png",
    "evolutionary-biology": "/screenshots/evobio.png",
    "spacecraft-designer": "/screenshots/spacecraft.png",
    "propulsion-consequences-map": "/screenshots/propulsion.png",
    "star-system-builder": "/screenshots/starsystem.png",
    "empire-designer": "/screenshots/empire.png",
    "technology-consequences": "/screenshots/techcons.png",
    "species-interaction-matrix": "/screenshots/species.png",
  };

  const screenshotPath = screenshotPaths[toolId];
  if (screenshotPath) {
    // Return a component that tries to load the screenshot
    return () => <ScreenshotMockup src={screenshotPath} toolName={title} />;
  }

  // Fallback placeholder
  return () => <ScreenshotPlaceholder toolName={title} />;
}

export default ToolShowcaseBlock;
