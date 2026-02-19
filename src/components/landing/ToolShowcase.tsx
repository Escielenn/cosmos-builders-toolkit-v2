import {
  Crown,
  Check,
  Clock,
  Rocket,
  Hourglass,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getToolIcon } from "@/components/icons/tool-icons";
import { scrollRevealStagger, fadeUpItem, scrollReveal, viewportOnce } from "@/lib/animations";

const freeTools = [
  {
    id: "environmental-chain-reaction",
    title: "Cascade: Environmental Chain Reaction",
    description: "Map how planetary parameters cascade into biology, psychology, culture, and mythology.",
    status: "available",
  },
  {
    id: "spacecraft-designer",
    title: "Vessel: Lived-In Spacecraft Designer",
    description: "Design ships that feel inhabited with cultural context and life support realities.",
    status: "available",
  },
  {
    id: "propulsion-consequences-map",
    title: "Impulse: Propulsion Consequences",
    description: "Trace how your propulsion system shapes economics, politics, and society.",
    status: "available",
  },
];

const proTools = [
  {
    id: "planetary-profile",
    title: "Genesis: Planetary Profile",
    description: "Define your world's stellar environment, physical characteristics, and habitability.",
    status: "available",
  },
  {
    id: "space-expansion-modeler",
    title: "Exodus: Space Expansion Modeler",
    description: "Model how competing forces shape humanity's expansion beyond Earth across phases of development.",
    status: "available",
  },
  {
    id: "drake-equation-calculator",
    title: "Signal: Drake Equation Calculator",
    description: "Calculate the number of civilizations in your galaxy for cosmic context.",
    status: "available",
  },
  {
    id: "xenomythology-framework-builder",
    title: "Mythos: Xenomythology Framework",
    description: "Create alien mythological systems derived from species biology and environment.",
    status: "available",
  },
  {
    id: "evolutionary-biology",
    title: "Phylo: Evolutionary Biology",
    description: "Design biologically plausible alien species with 13 sections covering biochemistry to psychology.",
    status: "available",
  },
  {
    id: "star-system-builder",
    title: "Orrery: Star System Builder",
    description: "Design multi-planet systems with stellar relationships and orbital mechanics.",
    status: "available",
  },
  {
    id: "empire-designer",
    title: "Dominion: Empire Designer",
    description: "Create political structures, governance systems, and internal factions.",
    status: "available",
  },
  {
    id: "technology-consequences",
    title: "Paradigm: Technology Consequences",
    description: "Map how any technology cascades through society, economy, and culture.",
    status: "available",
  },
  {
    id: "species-interaction-matrix",
    title: "Symbiosis: Species Interaction Matrix",
    description: "Define complex relationships between multiple alien species.",
    status: "available",
  },
  {
    id: "one-big-lie",
    title: "Axiom: The One Big Lie",
    description: "Declare your single physics violation and trace its consequences across your world.",
    status: "available",
  },
  {
    id: "time-dilation",
    title: "Paradox: Time Dilation Calculator",
    description: "Calculate relativistic time dilation with journey presets, propulsion caps, and story prompts.",
    status: "available",
  },
  {
    id: "habitable-zone-calculator",
    title: "Goldilocks: Habitable Zone Calculator",
    description: "Calculate habitable zone boundaries for any star and see how orbital position shapes your world.",
    status: "available",
  },
  {
    id: "lexdrift",
    title: "Lexdrift: Language Evolution",
    description: "Model how languages evolve during interstellar travel. Calculate divergence, predict change types, and generate sample texts.",
    status: "available",
  },
  {
    id: "surface-gravity-calculator",
    title: "Atlas: Surface Gravity Calculator",
    description: "Calculate surface gravity for any planet and trace how weight shapes biology, psychology, culture, and mythology.",
    status: "available",
  },
  {
    id: "timeline",
    title: "Timeline",
    description: "Plot events across deep time. Build multi-track timelines for characters, civilizations, and technologies.",
    status: "available",
  },
  {
    id: "sensorium",
    title: "Sensorium: Alien Sensory Systems",
    description: "Design evolutionarily plausible sensory systems for alien species. Derive senses from environmental constraints or validate custom selections.",
    status: "available",
  },
  {
    id: "gravitas",
    title: "Gravitas: Gravity Simulator",
    description: "Calculate gravity on spacecraft, habitats, and planets. Spin, thrust, orbital, and artificial gravity with experiential output.",
    status: "available",
  },
  {
    id: "stellar-cartographer",
    title: "Stellar Cartographer: Galaxy Mapper",
    description: "Interactive galaxy mapping tool. Generate procedural galaxies with 3D projection, empire territories, trade routes, and wormholes.",
    status: "available",
  },
];

const comingSoonByCategory = [
  {
    category: "Tools",
    items: [
      { title: "Character Development", subtitle: "Individual characters connected to your world" },

      { title: "AI Development", subtitle: "Explore artificial intelligence in your universe" },
      { title: "Generation Ship Designer", subtitle: "Design self-sustaining interstellar arks" },
      { title: "Quantum and Beyond", subtitle: "Technology beyond our understanding" },
      { title: "BDO: Big Dumb Object", subtitle: "Create megastructures and cosmic artifacts" },
      { title: "Warp Travel Calculator", subtitle: "Calculate warp-based journey parameters" },
      { title: "K-Scale (Kardashev Scale)", subtitle: "Classify civilizations by energy consumption" },
    ],
  },
  {
    category: "Cartographers",
    items: [
      { title: "Solar System Cartographer", subtitle: "Map solar systems" },
      { title: "Planet / Moon Cartographer", subtitle: "Map planetary and lunar surfaces" },
    ],
  },
  {
    category: "Calculators",
    items: [
      { title: "Orbital Mechanics / Year Calculator", subtitle: "Compute orbital periods and mechanics" },
      { title: "Atmosphere Composition Calculator", subtitle: "Model atmospheric compositions" },
    ],
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
    <GlassPanel lightArc hover className={`p-5 h-full ${isPro ? 'opacity-90' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        {CustomIcon ? (
          <CustomIcon className="w-12 h-12 rounded-full sf-card-icon" />
        ) : (
          <div className={`w-12 h-12 rounded-full flex items-center justify-center sf-card-icon ${
            isPro ? 'bg-amber-500/10' : 'bg-primary/10'
          }`}>
            <span className="text-xl">?</span>
          </div>
        )}
        <div className="flex gap-2">
          {isPro && (
            <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 sf-shimmer">
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
      <h3 className="font-heading font-light text-base mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
    </GlassPanel>
  );
};

const ToolShowcase = () => {
  return (
    <section className="mb-16">
      {/* Free Tools Section */}
      <div className="mb-12">
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={scrollReveal}
        >
          <h2 className="font-heading font-light text-2xl uppercase tracking-sf-wide">Free Forever</h2>
          <Badge variant="secondary" className="bg-green-500/20 text-green-600 dark:text-green-400 sf-badge-enter">
            <Check className="w-3 h-3 mr-1" />
            3 Tools
          </Badge>
        </motion.div>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={scrollRevealStagger}
        >
          {freeTools.map((tool) => (
            <motion.div key={tool.id} variants={fadeUpItem}>
              <ToolPreviewCard id={tool.id} {...tool} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Pro Tools Section */}
      <div className="mb-8">
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={scrollReveal}
        >
          <h2 className="font-heading font-light text-2xl uppercase tracking-sf-wide">Pro Tools</h2>
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 dark:text-amber-400 sf-badge-enter">
            <Crown className="w-3 h-3 mr-1" />
            18 Tools
          </Badge>
        </motion.div>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={scrollRevealStagger}
        >
          {proTools.map((tool) => (
            <motion.div key={tool.id} variants={fadeUpItem}>
              <ToolPreviewCard id={tool.id} {...tool} isPro />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Simulators Section */}
      <div className="mb-12">
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={scrollReveal}
        >
          <h2 className="font-heading font-light text-2xl uppercase tracking-sf-wide">Simulators</h2>
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 dark:text-amber-400 sf-badge-enter">
            <Crown className="w-3 h-3 mr-1" />
            Pro
          </Badge>
        </motion.div>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={scrollRevealStagger}
        >
          <motion.div variants={fadeUpItem}>
            <Link to="/rogue" className="block h-full">
              <GlassPanel lightArc hover className="p-5 h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-orange-500/20 sf-card-icon overflow-hidden">
                    <img src="/icons/035-black hole.svg" alt="" className="w-8 h-8" draggable={false} />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Crown className="w-3 h-3 mr-1" />
                    Pro
                  </Badge>
                </div>
                <h3 className="font-heading font-light text-base mb-2">Rogue: Wandering Object Encounters</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">N-body gravitational encounter simulator. Launch black holes at real star systems and watch chaos unfold.</p>
              </GlassPanel>
            </Link>
          </motion.div>
          <motion.div variants={fadeUpItem}>
            <Link to="/tools/tidelock" className="block h-full">
              <GlassPanel lightArc hover className="p-5 h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-blue-500/20 sf-card-icon overflow-hidden">
                    <img src="/icons/044-day and night.svg" alt="" className="w-8 h-8" draggable={false} />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Crown className="w-3 h-3 mr-1" />
                    Pro
                  </Badge>
                </div>
                <h3 className="font-heading font-light text-base mb-2">Tidelock: Locked World Simulator</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">Tidally locked world simulator. Explore habitable zones, atmospheric dynamics, and surface conditions on exoplanets.</p>
              </GlassPanel>
            </Link>
          </motion.div>
          <motion.div variants={fadeUpItem}>
            <Link to="/tools/exosky" className="block h-full">
              <GlassPanel lightArc hover className="p-5 h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20 sf-card-icon overflow-hidden">
                    <img src="/icons/016-constellation.svg" alt="" className="w-8 h-8" draggable={false} />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Crown className="w-3 h-3 mr-1" />
                    Pro
                  </Badge>
                </div>
                <h3 className="font-heading font-light text-base mb-2">Exosky: Alien Night Sky</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">Alien night sky simulator. View the stars from any exoplanet using real astronomical data and create your own constellations.</p>
              </GlassPanel>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Coming Soon Section */}
      <div className="mb-12">
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={scrollReveal}
        >
          <h2 className="font-heading font-light text-2xl uppercase tracking-sf-wide">Coming Soon</h2>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 dark:text-blue-400 sf-badge-enter">
            <Hourglass className="w-3 h-3 mr-1" />
            15 Planned
          </Badge>
        </motion.div>
        {comingSoonByCategory.map((cat) => (
          <div key={cat.category} className="mb-8 last:mb-0">
            <h3 className="font-heading font-light text-sm uppercase tracking-sf-wide text-muted-foreground mb-4">
              {cat.category}
            </h3>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={scrollRevealStagger}
            >
              {cat.items.map((tool) => (
                <motion.div key={tool.title} variants={fadeUpItem}>
                  <GlassPanel className="p-4 border-dashed border border-muted opacity-70">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-heading font-light text-sm">{tool.title}</h4>
                      <Badge variant="outline" className="text-[10px] shrink-0">Soon</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{tool.subtitle}</p>
                  </GlassPanel>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        className="text-center"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={scrollReveal}
      >
        <Button size="lg" className="gap-2" asChild>
          <Link to="/auth?tab=signup">
            <Rocket className="w-4 h-4" />
            Get Started Free
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground mt-3">
          No credit card required
        </p>
      </motion.div>
    </section>
  );
};

export default ToolShowcase;
