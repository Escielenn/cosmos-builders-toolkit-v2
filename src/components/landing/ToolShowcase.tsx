import {
  Crown,
  Check,
  Clock,
  Rocket,
} from "lucide-react";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getToolIcon } from "@/components/icons/tool-icons";

const freeTools = [
  {
    id: "environmental-chain-reaction",
    title: "Environmental Chain Reaction",
    description: "Map how planetary parameters cascade into biology, psychology, culture, and mythology.",
    status: "available",
  },
  {
    id: "spacecraft-designer",
    title: "Lived-In Spacecraft Designer",
    description: "Design ships that feel inhabited with cultural context and life support realities.",
    status: "available",
  },
  {
    id: "propulsion-consequences-map",
    title: "Propulsion Consequences Map",
    description: "Trace how your propulsion system shapes economics, politics, and society.",
    status: "available",
  },
];

const proTools = [
  {
    id: "planetary-profile",
    title: "Planetary Profile Template",
    description: "Define your world's stellar environment, physical characteristics, and habitability.",
    status: "available",
  },
  {
    id: "drake-equation-calculator",
    title: "Drake Equation Calculator",
    description: "Calculate the number of civilizations in your galaxy for cosmic context.",
    status: "available",
  },
  {
    id: "xenomythology-framework-builder",
    title: "Xenomythology Framework Builder",
    description: "Create alien mythological systems derived from species biology and environment.",
    status: "available",
  },
  {
    id: "evolutionary-biology",
    title: "Evolutionary Biology Design Sheet",
    description: "Design biologically plausible alien species with 13 sections covering biochemistry to psychology.",
    status: "available",
  },
  {
    id: "star-system-builder",
    title: "Star System Builder",
    description: "Design multi-planet systems with stellar relationships and orbital mechanics.",
    status: "available",
  },
  {
    id: "empire-designer",
    title: "Empire/Government Designer",
    description: "Create political structures, governance systems, and internal factions.",
    status: "available",
  },
  {
    id: "technology-consequences",
    title: "Technology Consequences Map",
    description: "Map how any technology cascades through society, economy, and culture.",
    status: "available",
  },
  {
    id: "species-interaction-matrix",
    title: "Species Interaction Matrix",
    description: "Define complex relationships between multiple alien species.",
    status: "available",
  },
];

interface ToolPreviewCardProps {
  id: string;
  title: string;
  description: string;
  status: string;
  isPro?: boolean;
}

const ToolPreviewCard = ({ id, title, description, status, isPro }: ToolPreviewCardProps) => {
  const CustomIcon = getToolIcon(id);

  return (
    <GlassPanel lightArc className={`p-5 h-full ${isPro ? 'opacity-90' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        {CustomIcon ? (
          <CustomIcon className="w-12 h-12 rounded-lg" />
        ) : (
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            isPro ? 'bg-amber-500/10' : 'bg-primary/10'
          }`}>
            <span className="text-xl">?</span>
          </div>
        )}
        <div className="flex gap-2">
          {isPro && (
            <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Crown className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          )}
          {status === "coming-soon" && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Soon
            </Badge>
          )}
        </div>
      </div>
      <h3 className="font-display font-light text-base mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
    </GlassPanel>
  );
};

const ToolShowcase = () => {
  return (
    <section className="mb-16">
      {/* Free Tools Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="font-display font-light text-2xl uppercase tracking-sf-wide">Free Forever</h2>
          <Badge variant="secondary" className="bg-green-500/20 text-green-600 dark:text-green-400">
            <Check className="w-3 h-3 mr-1" />
            3 Tools
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {freeTools.map((tool) => (
            <ToolPreviewCard key={tool.id} id={tool.id} {...tool} />
          ))}
        </div>
      </div>

      {/* Pro Tools Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="font-display font-light text-2xl uppercase tracking-sf-wide">Pro Tools</h2>
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Crown className="w-3 h-3 mr-1" />
            8 Tools
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proTools.map((tool) => (
            <ToolPreviewCard key={tool.id} id={tool.id} {...tool} isPro />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Button size="lg" className="gap-2" asChild>
          <Link to="/auth?tab=signup">
            <Rocket className="w-4 h-4" />
            Get Started Free
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground mt-3">
          No credit card required
        </p>
      </div>
    </section>
  );
};

export default ToolShowcase;
