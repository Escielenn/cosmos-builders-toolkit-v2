import {
  Globe,
  Rocket,
  Atom,
  Calculator,
  Users,
  BookOpen,
  Cpu,
  Crown,
  Check,
  Clock,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const freeTools = [
  {
    id: "environmental-chain-reaction",
    title: "Environmental Chain Reaction",
    description: "Map how planetary parameters cascade into biology, psychology, culture, and mythology.",
    icon: Globe,
    status: "available",
  },
  {
    id: "spacecraft-designer",
    title: "Lived-In Spacecraft Designer",
    description: "Design ships that feel inhabited with cultural context and life support realities.",
    icon: Rocket,
    status: "available",
  },
  {
    id: "propulsion-consequences-map",
    title: "Propulsion Consequences Map",
    description: "Trace how your propulsion system shapes economics, politics, and society.",
    icon: Atom,
    status: "available",
  },
];

const proTools = [
  {
    id: "planetary-profile",
    title: "Planetary Profile Template",
    description: "Define your world's stellar environment, physical characteristics, and habitability.",
    icon: Globe,
    status: "available",
  },
  {
    id: "drake-equation-calculator",
    title: "Drake Equation Calculator",
    description: "Calculate the number of civilizations in your galaxy for cosmic context.",
    icon: Calculator,
    status: "available",
  },
  {
    id: "xenomythology-framework-builder",
    title: "Xenomythology Framework Builder",
    description: "Create alien mythological systems derived from species biology and environment.",
    icon: Sparkles,
    status: "available",
  },
  {
    id: "species-creator",
    title: "Species Creator",
    description: "Design alien species with consistent biology and evolutionary history.",
    icon: Users,
    status: "coming-soon",
  },
  {
    id: "culture-designer",
    title: "Culture Designer",
    description: "Build societies with coherent values, rituals, and social structures.",
    icon: BookOpen,
    status: "coming-soon",
  },
  {
    id: "technology-mapper",
    title: "Technology Mapper",
    description: "Map technological capabilities and their societal impacts.",
    icon: Cpu,
    status: "coming-soon",
  },
];

interface ToolPreviewCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  status: string;
  isPro?: boolean;
}

const ToolPreviewCard = ({ title, description, icon: Icon, status, isPro }: ToolPreviewCardProps) => {
  return (
    <GlassPanel className={`p-5 h-full ${isPro ? 'opacity-90' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isPro ? 'bg-amber-500/10' : 'bg-primary/10'
        }`}>
          <Icon className={`w-5 h-5 ${isPro ? 'text-amber-500' : 'text-primary'}`} />
        </div>
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
      <h3 className="font-display font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
    </GlassPanel>
  );
};

const ToolShowcase = () => {
  return (
    <section className="mb-16">
      {/* Free Tools Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-display text-2xl font-semibold">Free Forever</h2>
          <Badge variant="secondary" className="bg-green-500/20 text-green-600 dark:text-green-400">
            <Check className="w-3 h-3 mr-1" />
            3 Tools
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {freeTools.map((tool) => (
            <ToolPreviewCard key={tool.id} {...tool} />
          ))}
        </div>
      </div>

      {/* Pro Tools Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-display text-2xl font-semibold">Pro Tools</h2>
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Crown className="w-3 h-3 mr-1" />
            6 Tools
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proTools.map((tool) => (
            <ToolPreviewCard key={tool.id} {...tool} isPro />
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
