import { Link, useNavigate } from "react-router-dom";
import { Plus, Globe, Wrench, BookOpen, Compass, Star, Leaf, Users, Sparkles, ScrollText, Layers, Rocket, BookMarked, Tag } from "lucide-react";
import { getToolIcon } from "@/components/icons/tool-icons";
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
import { getToolDisplayName, TOOL_ROUTES } from "@/lib/tools-config";
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
  { id: "stars-systems", label: "Stars & Systems", icon: Star, color: "text-sf-amber-text" },
  { id: "worlds", label: "Worlds", icon: Globe, color: "text-sf-azure-text" },
  { id: "life", label: "Life", icon: Leaf, color: "text-sf-emerald-text" },
  { id: "travel", label: "Travel & Spacecraft", icon: Rocket, color: "text-sf-amber-warm-text" },
  { id: "civilizations", label: "Civilizations", icon: Users, color: "text-sf-violet-text" },
  { id: "mythology", label: "Mythology", icon: ScrollText, color: "text-sf-stellar-text" },
  { id: "integration", label: "Integration", icon: Layers, color: "text-sf-teal-text" },
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

// Short display name (without the brand prefix)
function shortName(toolId: string): string {
  const full = getToolDisplayName(toolId);
  // e.g. "Cascade: Environmental Chain Reaction" → "Cascade"
  const colon = full.indexOf(":");
  return colon > 0 ? full.substring(0, colon) : full;
}

// ─── Nav link style ───────────────────────────────────────────────────

// Header nav labels: Jura eyebrow, the one header/footer heading style.
const navLinkClass =
  "sf-nav-link font-heading text-sf-eyebrow uppercase text-t3 hover:text-sf-primary-text transition-colors duration-base leading-none h-10 flex items-center";

// On an inner span: twMerge reads text-sf-eyebrow as a colour and would drop
// it against the trigger primitive's text-sm.
const navLabelClass = "font-heading text-sf-eyebrow uppercase";

const triggerClass =
  "sf-nav-link font-heading text-sf-eyebrow uppercase text-t3 hover:text-sf-primary-text transition-colors duration-base bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent data-[active]:bg-transparent h-auto p-0 gap-1 rounded-none leading-none";

// Menu section label: the same Jura eyebrow the footer columns use.
const menuLabelClass =
  "font-heading text-sf-eyebrow uppercase text-t4 px-2 mb-2 pb-1.5 border-b border-sf-line-hairline";

const menuItemClass =
  "flex items-start gap-2 px-2 py-2 min-h-hit text-sm text-t2 hover:text-t1 hover:bg-sf-surface-elevated rounded-none transition-colors";

// ─── Component ────────────────────────────────────────────────────────

interface HeaderNavigationProps {
  /**
   * "marketing": signed out. Product (Features, Tools, Pricing), Learn,
   * Community. "app": signed in. Worlds, Studio, Tools; marketing links live
   * in the profile menu and the footer (1.6, finding 9).
   */
  mode: "marketing" | "app";
}

const HeaderNavigation = ({ mode }: HeaderNavigationProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { worlds } = useWorlds();

  if (mode === "app") {
    return (
      <NavigationMenu className="hidden lg:flex items-center" aria-label="Primary">
        <NavigationMenuList className="gap-6 items-center space-x-0">
        {/* ── Worlds dropdown ─────────────────────────────── */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className={triggerClass}>
            <span className={navLabelClass}>Worlds</span>
          </NavigationMenuTrigger>
          <NavigationMenuContent className="">
            <div className="w-[280px] p-3">
              {user && worlds.length > 0 ? (
                <>
                  <p className={menuLabelClass}>
                    Your Worlds
                  </p>
                  <div className="max-h-[200px] overflow-y-auto sf-sb space-y-0.5">
                    {worlds.slice(0, 8).map((world) => (
                      <NavigationMenuLink key={world.id} asChild>
                        <Link
                          to={`/worlds/${world.id}`}
                          className="flex items-center gap-2 px-2 py-1.5 text-sm text-t2 hover:text-t1 hover:bg-sf-surface-elevated rounded-none transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5 text-sf-primary-text shrink-0" />
                          <span className="truncate">{world.name}</span>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                    {worlds.length > 8 && (
                      <NavigationMenuLink asChild>
                        <Link
                          to="/worlds"
                          className="flex items-center gap-2 px-2 py-1.5 text-xs text-t4 hover:text-t2 transition-colors"
                        >
                          +{worlds.length - 8} more...
                        </Link>
                      </NavigationMenuLink>
                    )}
                  </div>
                  <div className="border-t border-sf-line-hairline mt-2 pt-2">
                    <NavigationMenuLink asChild>
                      <Link
                        to="/worlds"
                        className="flex items-center gap-2 px-2 py-1.5 text-xs text-sf-primary-text hover:text-sf-primary-text transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        All Worlds
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <button
                        onClick={() => navigate("/worlds?create=true")}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs text-sf-primary-text hover:text-sf-primary-text transition-colors w-full text-left"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create New World
                      </button>
                    </NavigationMenuLink>
                  </div>
                </>
              ) : user ? (
                <div className="text-center py-4">
                  <p className="text-xs text-t3 mb-3">NO WORLDS ON FILE.</p>
                  <NavigationMenuLink asChild>
                    <button
                      onClick={() => navigate("/worlds?create=true")}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-xs text-sf-primary-text hover:text-t1 transition-colors mx-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Begin survey
                    </button>
                  </NavigationMenuLink>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-t3 mb-2">You need an account to create worlds</p>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/auth#create-account"
                      className="text-xs text-sf-primary-text hover:text-t1 transition-colors"
                    >
                      Sign Up / Log In
                    </Link>
                  </NavigationMenuLink>
                </div>
              )}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link to="/studio" className={navLinkClass}>
              Studio
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* ── Tools dropdown ──────────────────────────────── */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className={triggerClass}>
            <span className={navLabelClass}>Tools</span>
          </NavigationMenuTrigger>
          <NavigationMenuContent className="">
            <div className="w-[640px] p-5">
              <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                {NAV_CATEGORIES.map((cat) => {
                  const tools = getNavCategoryTools(cat.id);
                  if (tools.length === 0) return null;
                  const CatIcon = cat.icon;
                  return (
                    <div key={cat.id}>
                      <p className={cn("font-heading text-sf-eyebrow uppercase px-1 mb-2 flex items-center gap-1.5 pb-1.5 border-b border-sf-line-hairline", cat.color)}>
                        <CatIcon className="w-3 h-3" />
                        {cat.label}
                      </p>
                      <div className="space-y-0.5">
                        {tools.map((tool) => {
                          const route = TOOL_ROUTES[tool.id];
                          if (!route) return null;
                          const ToolIcon = getToolIcon(tool.id);
                          return (
                            <NavigationMenuLink key={tool.id} asChild>
                              <Link
                                to={route}
                                className="flex items-center gap-2 px-1.5 py-1.5 text-[13px] text-t2 hover:text-t1 hover:bg-sf-primary/[0.06] rounded-none transition-colors"
                              >
                                {ToolIcon ? (
                                  <ToolIcon className="w-4 h-4 shrink-0" />
                                ) : (
                                  <CatIcon className="w-4 h-4 shrink-0 text-t4" />
                                )}
                                <span className="truncate">{shortName(tool.id)}</span>
                              </Link>
                            </NavigationMenuLink>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-sf-line-hairline mt-4 pt-3 flex flex-wrap gap-x-6">
                <NavigationMenuLink asChild>
                  <Link
                    to="/tools"
                    className="flex items-center gap-2 px-1 py-1.5 text-xs text-sf-primary-text hover:text-sf-primary-text transition-colors"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    All Tools
                  </Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <Link
                    to="/guide/tools"
                    className="flex items-center gap-2 px-1 py-1.5 text-xs text-sf-primary-text hover:text-sf-primary-text transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Tool Reference
                  </Link>
                </NavigationMenuLink>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        </NavigationMenuList>
      </NavigationMenu>
    );
  }

  return (
    <NavigationMenu className="hidden lg:flex items-center" aria-label="Primary">
      <NavigationMenuList className="gap-6 items-center space-x-0">
        {/* ── Product dropdown ────────────────────────────── */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className={triggerClass}>
            <span className={navLabelClass}>Product</span>
          </NavigationMenuTrigger>
          <NavigationMenuContent className="">
            <div className="w-[300px] p-3 space-y-0.5">
              <p className={menuLabelClass}>Product</p>
              <NavigationMenuLink asChild>
                <Link to="/features" className={menuItemClass}>
                  <Sparkles className="w-3.5 h-3.5 text-sf-primary-text mt-1 shrink-0" />
                  <span>
                    Features
                    <span className="block text-[12px] text-t3">The Studio, the Codex and the instruments</span>
                  </span>
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link to="/tools" className={menuItemClass}>
                  <Wrench className="w-3.5 h-3.5 text-sf-primary-text mt-1 shrink-0" />
                  <span>
                    Tools
                    <span className="block text-[12px] text-t3">Every instrument, by cascade layer</span>
                  </span>
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link to="/pricing" className={menuItemClass}>
                  <Tag className="w-3.5 h-3.5 text-sf-primary-text mt-1 shrink-0" />
                  <span>
                    Pricing
                    <span className="block text-[12px] text-t3">Free, Pro and Vanguard</span>
                  </span>
                </Link>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* ── Learn dropdown ──────────────────────────────── */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className={triggerClass}>
            <span className={navLabelClass}>Learn</span>
          </NavigationMenuTrigger>
          <NavigationMenuContent className="">
            <div className="w-[260px] p-3 space-y-0.5">
              <p className={menuLabelClass}>Learn</p>
              <NavigationMenuLink asChild>
                <Link
                  to="/learn"
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-t2 hover:text-t1 hover:bg-sf-surface-elevated rounded-none transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-sf-primary-text" />
                  SF University
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link
                  to="/guide"
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-t2 hover:text-t1 hover:bg-sf-surface-elevated rounded-none transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-sf-primary-text" />
                  Field Manual
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link
                  to="/getting-started"
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-t2 hover:text-t1 hover:bg-sf-surface-elevated rounded-none transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sf-primary-text" />
                  Getting Started
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link
                  to="/guide/tools"
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-t2 hover:text-t1 hover:bg-sf-surface-elevated rounded-none transition-colors"
                >
                  <Wrench className="w-3.5 h-3.5 text-sf-primary-text" />
                  Tool Reference
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link
                  to="/bookshelf"
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-t2 hover:text-t1 hover:bg-sf-surface-elevated rounded-none transition-colors"
                >
                  <BookMarked className="w-3.5 h-3.5 text-sf-primary-text" />
                  Bookshelf
                </Link>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link to="/community" className={navLinkClass}>
              Community
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default HeaderNavigation;
