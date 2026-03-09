import { Link, useNavigate } from "react-router-dom";
import { Plus, Globe, Wrench, BookOpen, Compass, Map, Star, Leaf, Users, Sparkles, ScrollText, Layers, Rocket } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useWorlds } from "@/hooks/use-worlds";
import { useAuth } from "@/contexts/AuthContext";
import { getToolsByCategory, type ToolCategory } from "@/lib/tool-wiki-data";
import { getToolDisplayName } from "@/lib/tools-config";
import { cn } from "@/lib/utils";

// ─── Travel & Spacecraft tools (split from civilizations) ─────────────

const TRAVEL_TOOL_IDS = new Set([
  "spacecraft-designer",
  "propulsion-consequences-map",
  "space-expansion-modeler",
  "time-dilation",
  "gravitas",
]);

// ─── Nav category config (differs from wiki categories for UX) ────────

interface NavCategory {
  id: string;
  label: string;
  icon: typeof Star;
  color: string;
}

const NAV_CATEGORIES: NavCategory[] = [
  { id: "stars-systems", label: "Stars & Systems", icon: Star, color: "text-amber-400" },
  { id: "worlds", label: "Worlds", icon: Globe, color: "text-blue-400" },
  { id: "life", label: "Life", icon: Leaf, color: "text-emerald-400" },
  { id: "travel", label: "Travel & Spacecraft", icon: Rocket, color: "text-orange-400" },
  { id: "civilizations", label: "Civilizations", icon: Users, color: "text-violet-400" },
  { id: "mythology", label: "Mythology", icon: ScrollText, color: "text-blue-300" },
  { id: "integration", label: "Integration", icon: Layers, color: "text-teal-400" },
];

/** Get tools for a nav category (splits civilizations into travel + civ) */
function getNavCategoryTools(navCatId: string) {
  if (navCatId === "travel") {
    return getToolsByCategory("civilizations" as ToolCategory).filter(
      (t) => TRAVEL_TOOL_IDS.has(t.id)
    );
  }
  if (navCatId === "civilizations") {
    return getToolsByCategory("civilizations" as ToolCategory).filter(
      (t) => !TRAVEL_TOOL_IDS.has(t.id)
    );
  }
  return getToolsByCategory(navCatId as ToolCategory);
}

// ─── Tool route mapping ───────────────────────────────────────────────

const TOOL_ROUTES: Record<string, string> = {
  "environmental-chain-reaction": "/tools/environmental-chain-reaction",
  "spacecraft-designer": "/tools/spacecraft-designer",
  "propulsion-consequences-map": "/tools/propulsion-consequences-map",
  "planetary-profile": "/tools/planetary-profile",
  "space-expansion-modeler": "/tools/space-expansion-modeler",
  "drake-equation-calculator": "/tools/drake-equation-calculator",
  "xenomythology-framework-builder": "/tools/xenomythology-framework-builder",
  "evolutionary-biology": "/tools/evolutionary-biology",
  "star-system-builder": "/tools/star-system-builder",
  "empire-designer": "/tools/empire-designer",
  "technology-consequences": "/tools/technology-consequences",
  "species-interaction-matrix": "/tools/species-interaction-matrix",
  "one-big-lie": "/tools/one-big-lie",
  "time-dilation": "/tools/time-dilation",
  "habitable-zone-calculator": "/tools/habitable-zone-calculator",
  "lexdrift": "/tools/lexdrift",
  "surface-gravity-calculator": "/tools/surface-gravity-calculator",
  "timeline": "/tools/timeline",
  "sensorium": "/tools/sensorium",
  "gravitas": "/tools/gravitas",
  "kardashev-scale": "/tools/kardashev-scale",
  "rogue": "/simulators/rogue",
  "tidelock": "/simulators/tidelock",
  "exosky": "/simulators/exosky",
  "exoforge": "/simulators/exoforge",
  "stellar-cartographer": "/tools/stellar-cartographer",
};

// Short display name (without the brand prefix)
function shortName(toolId: string): string {
  const full = getToolDisplayName(toolId);
  // e.g. "Cascade: Environmental Chain Reaction" → "Cascade"
  const colon = full.indexOf(":");
  return colon > 0 ? full.substring(0, colon) : full;
}

// ─── Nav link style ───────────────────────────────────────────────────

const navLinkClass =
  "sf-nav-link text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors duration-300 leading-none";

const triggerClass =
  "sf-nav-link text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors duration-300 bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent data-[active]:bg-transparent h-auto p-0 gap-1 rounded-none leading-none";

// ─── Component ────────────────────────────────────────────────────────

interface HeaderNavigationProps {
  isSubscribed: boolean;
}

const HeaderNavigation = ({ isSubscribed }: HeaderNavigationProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { worlds } = useWorlds();

  return (
    <NavigationMenu className="hidden md:flex items-center">
      <NavigationMenuList className="gap-5 items-center space-x-0">
        {/* ── Worlds dropdown ─────────────────────────────── */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className={triggerClass}>
            Worlds
          </NavigationMenuTrigger>
          <NavigationMenuContent className="">
            <div className="w-[280px] p-3">
              {user && worlds.length > 0 ? (
                <>
                  <p className="text-[10px] font-medium uppercase tracking-[1.5px] text-tier-3 px-2 mb-2">
                    Your Worlds
                  </p>
                  <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                    {worlds.slice(0, 8).map((world) => (
                      <NavigationMenuLink key={world.id} asChild>
                        <Link
                          to={`/world/${world.id}`}
                          className="flex items-center gap-2 px-2 py-1.5 text-sm text-tier-2 hover:text-tier-1 hover:bg-white/5 rounded-sm transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                          <span className="truncate">{world.name}</span>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                    {worlds.length > 8 && (
                      <NavigationMenuLink asChild>
                        <Link
                          to="/worlds"
                          className="flex items-center gap-2 px-2 py-1.5 text-xs text-tier-4 hover:text-tier-2 transition-colors"
                        >
                          +{worlds.length - 8} more...
                        </Link>
                      </NavigationMenuLink>
                    )}
                  </div>
                  <div className="border-t border-white/8 mt-2 pt-2">
                    <NavigationMenuLink asChild>
                      <Link
                        to="/worlds"
                        className="flex items-center gap-2 px-2 py-1.5 text-xs text-primary/80 hover:text-primary transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        All Worlds
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <button
                        onClick={() => navigate("/worlds?create=true")}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs text-primary/80 hover:text-primary transition-colors w-full text-left"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create New World
                      </button>
                    </NavigationMenuLink>
                  </div>
                </>
              ) : user ? (
                <div className="text-center py-4">
                  <p className="text-xs text-tier-3 mb-3">No worlds yet</p>
                  <NavigationMenuLink asChild>
                    <button
                      onClick={() => navigate("/worlds?create=true")}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-xs text-primary hover:text-primary/80 transition-colors mx-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create Your First World
                    </button>
                  </NavigationMenuLink>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-tier-3 mb-2">Sign in to create worlds</p>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/auth"
                      className="text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      Authenticate
                    </Link>
                  </NavigationMenuLink>
                </div>
              )}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* ── Tools dropdown ──────────────────────────────── */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className={triggerClass}>
            Tools
          </NavigationMenuTrigger>
          <NavigationMenuContent className="">
            <div className="w-[420px] p-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {NAV_CATEGORIES.map((cat) => {
                  const tools = getNavCategoryTools(cat.id);
                  if (tools.length === 0) return null;
                  const Icon = cat.icon;
                  return (
                    <div key={cat.id}>
                      <p className={cn("text-[10px] font-medium uppercase tracking-[1.5px] px-1 mb-1 flex items-center gap-1.5", cat.color)}>
                        <Icon className="w-3 h-3" />
                        {cat.label}
                      </p>
                      <div className="space-y-0">
                        {tools.map((tool) => {
                          const route = TOOL_ROUTES[tool.id];
                          if (!route) return null;
                          return (
                            <NavigationMenuLink key={tool.id} asChild>
                              <Link
                                to={route}
                                className="block px-1 py-1 text-[11px] text-tier-2 hover:text-tier-1 hover:bg-white/5 rounded-sm transition-colors truncate"
                              >
                                {shortName(tool.id)}
                              </Link>
                            </NavigationMenuLink>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-white/8 mt-3 pt-2">
                <NavigationMenuLink asChild>
                  <Link
                    to="/guide/tools"
                    className="flex items-center gap-2 px-1 py-1.5 text-xs text-primary/80 hover:text-primary transition-colors"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Tool Reference
                  </Link>
                </NavigationMenuLink>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* ── Guide dropdown ──────────────────────────────── */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className={triggerClass}>
            Guide
          </NavigationMenuTrigger>
          <NavigationMenuContent className="">
            <div className="w-[220px] p-3 space-y-0.5">
              <NavigationMenuLink asChild>
                <Link
                  to="/guide"
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-tier-2 hover:text-tier-1 hover:bg-white/5 rounded-sm transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-primary/60" />
                  Field Manual
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link
                  to="/getting-started"
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-tier-2 hover:text-tier-1 hover:bg-white/5 rounded-sm transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                  Getting Started
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link
                  to="/guide/tools"
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-tier-2 hover:text-tier-1 hover:bg-white/5 rounded-sm transition-colors"
                >
                  <Wrench className="w-3.5 h-3.5 text-primary/60" />
                  Tool Reference
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link
                  to="/learn"
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-tier-2 hover:text-tier-1 hover:bg-white/5 rounded-sm transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-primary/60" />
                  SF University
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link
                  to="/roadmap"
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-tier-2 hover:text-tier-1 hover:bg-white/5 rounded-sm transition-colors"
                >
                  <Map className="w-3.5 h-3.5 text-primary/60" />
                  Roadmap
                </Link>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* ── Flat links ──────────────────────────────────── */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link to="/learn" className={navLinkClass}>
              Learn
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link to="/workshop" className={navLinkClass}>
              Workshop
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {!isSubscribed && (
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link to="/pricing" className={navLinkClass}>
                Pricing
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link to="/contact" className={navLinkClass}>
              Contact
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default HeaderNavigation;
