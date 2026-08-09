import { useState, useEffect } from "react";
import { User, LogIn, LogOut, ChevronDown, Zap, Menu, Globe, Wrench, BookOpen, Sparkles, Mail, Settings, Search, Image, Download, Library, Archive, Map, Compass, PenTool, Award, Users, Info } from "lucide-react";
import HeaderNavigation from "./HeaderNavigation";
import { APP_VERSION } from "@/config/version";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CubeLogo from "@/components/icons/CubeLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import BackgroundSelector from "@/components/settings/BackgroundSelector";
import AudioSelectorDialog from "@/components/audio/AudioSelectorDialog";
import SettingsDialog from "@/components/settings/SettingsDialog";
import GlobalSearch from "@/components/search/GlobalSearch";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import { useWorlds } from "@/hooks/use-worlds";

/**
 * Mobile navigation model.
 *
 * Grouped to mirror the desktop dropdowns in HeaderNavigation so the two
 * surfaces name the same destinations the same way. Previously this was a flat
 * 15-item list whose "Prompt Browser" pointed at /workshop#prompts while
 * desktop's pointed at /prompts, and whose "Tools" was a scroll-to-section that
 * did nothing away from the homepage.
 */
const MOBILE_NAV: {
  heading: string;
  items: { label: string; to: string; icon: typeof Globe }[];
}[] = [
  {
    heading: "Worlds",
    items: [
      { label: "My Worlds", to: "/worlds", icon: Globe },
      { label: "My Collection", to: "/collection", icon: Library },
      { label: "Archive", to: "/archive", icon: Archive },
    ],
  },
  {
    heading: "Tools",
    items: [{ label: "All Tools", to: "/guide/tools", icon: Wrench }],
  },
  {
    heading: "Studio",
    items: [
      { label: "Studio", to: "/studio", icon: PenTool },
      { label: "Daily Prompt", to: "/workshop", icon: Sparkles },
      { label: "Prompt Browser", to: "/prompts", icon: BookOpen },
    ],
  },
  {
    heading: "Learn",
    items: [
      { label: "SF University", to: "/learn", icon: BookOpen },
      { label: "Field Manual", to: "/guide", icon: Compass },
      { label: "Getting Started", to: "/getting-started", icon: Sparkles },
      { label: "Bookshelf", to: "/bookshelf", icon: Library },
    ],
  },
  {
    heading: "Community",
    items: [
      { label: "Community", to: "/community", icon: Users },
      { label: "Commendations", to: "/commendations", icon: Award },
    ],
  },
  {
    heading: "About",
    items: [
      { label: "About StellarForge", to: "/about", icon: Info },
      { label: "Roadmap", to: "/roadmap", icon: Map },
      { label: "Contact", to: "/contact", icon: Mail },
    ],
  },
];

const Header = () => {
  const { user, profile, signOut, loading } = useAuth();
  const { isSubscribed, isVanguard } = useSubscription();
  const { worlds } = useWorlds();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("account");
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const initials = profile?.display_name
    ? profile.display_name.split(" ").map(n => n[0]).join("").toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "?";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-sf-border backdrop-blur-sf-side bg-sf-void/85">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 shrink-0 mr-6">
          <div className="flex flex-col">
            <Link to="/" className="flex items-center gap-2 group">
              <CubeLogo size={32} className="rounded-none" />
              {/* Full wordmark at xl+ for everyone (brand visibility for
                  logged-out visitors during OPEN EARLY ACCESS); SF
                  abbreviation below xl for compact layouts. */}
              <span className="hidden xl:inline font-display text-lg font-light tracking-sf-title text-t1">
                <span className="text-sf-teal">Stellar</span>forge
              </span>
              <span className="xl:hidden font-display text-lg font-light tracking-sf-wide text-t1 uppercase">
                SF
              </span>
            </Link>
            <span className="hidden xl:block font-sans text-[12px] font-light tracking-[0.5px] text-white/20 ml-[42px] -mt-1">
              v{APP_VERSION}
            </span>
          </div>

          {/* Logo-adjacent signup/login CTA for logged-out users.
              Sends to /auth with a hash so the Auth page scrolls to the
              CREATE ACCOUNT card on mount. */}
          {!loading && !user && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden sm:inline-flex gap-1.5 border-sf-teal/[0.5] text-sf-teal hover:bg-sf-teal/[0.08] rounded-none"
            >
              <Link to="/auth#create-account">
                <LogIn className="w-3.5 h-3.5" />
                Sign Up / Log In
              </Link>
            </Button>
          )}
        </div>

        {/* Desktop Navigation */}
        <HeaderNavigation isSubscribed={isSubscribed} />

        <div className="flex items-center gap-2">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="xl:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-sf-surface/95 border-sf-border sf-sb">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-3">
                  <CubeLogo size={32} className="rounded-none" />   {/* sheet header */}
                  <span className="font-display text-sm font-light tracking-sf-wide text-t1 uppercase">
                    SF
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-8">
                {MOBILE_NAV.map((group) => (
                  <div key={group.heading} className="mb-4 last:mb-0">
                    <p className="font-heading text-[11px] font-medium uppercase tracking-[2px] text-t3 px-3 mb-1.5 pb-1.5 border-b border-white/[0.06]">
                      {group.heading}
                    </p>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-t2 hover:text-t1 hover:bg-sf-teal/[0.06] rounded-none transition-colors duration-base"
                        >
                          <Icon className="w-5 h-5 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                ))}
                {!isSubscribed && (
                  <div className="mb-0">
                    <p className="font-heading text-[11px] font-medium uppercase tracking-[2px] text-t3 px-3 mb-1.5 pb-1.5 border-b border-white/[0.06]">
                      Upgrade
                    </p>
                    <Link
                      to="/features"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-t2 hover:text-t1 hover:bg-sf-teal/[0.06] rounded-none transition-colors duration-base"
                    >
                      <Sparkles className="w-5 h-5 shrink-0" />
                      Features
                    </Link>
                    <Link
                      to="/pricing"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-t2 hover:text-t1 hover:bg-sf-teal/[0.06] rounded-none transition-colors duration-base"
                    >
                      <Zap className="w-5 h-5 shrink-0" />
                      Pricing
                    </Link>
                  </div>
                )}
              </nav>
              {!loading && !user && (
                <div className="mt-8 pt-8 border-t border-sf-border">
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/auth");
                    }}
                  >
                    <LogIn className="w-4 h-4" />
                    AUTHENTICATE
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
          <AudioSelectorDialog />
          <BackgroundSelector />
          <button
            className="sf-nav-link inline-flex items-center justify-center gap-2 h-9 px-2 text-t3 hover:text-primary transition-colors"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-4 h-4 relative z-[1]" />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-sf-border bg-muted/50 px-1.5 font-mono text-[12px] font-medium text-t3 relative z-[1]">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
          {!loading && user && !isSubscribed && (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex gap-1.5 border-sf-amber/[0.5] text-sf-amber hover:bg-sf-amber/[0.08] rounded-none"
              onClick={() => navigate("/pricing")}
            >
              <Zap className="w-3.5 h-3.5" />
              UNLOCK PRO
            </Button>
          )}
          {!loading && user && isSubscribed && !isVanguard && (
            <Button
              variant="outline"
              size="sm"
              className="hidden lg:inline-flex gap-1.5 border-sf-violet/[0.5] text-sf-violet hover:bg-sf-violet/[0.08] rounded-none"
              onClick={() => navigate("/pricing")}
            >
              <Sparkles className="w-3.5 h-3.5" />
              UNLOCK VANGUARD
            </Button>
          )}
          {!loading && user ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="sf-nav-link inline-flex items-center gap-2 px-2 h-9 text-t2 hover:text-primary transition-colors">
                  <Avatar className="w-7 h-7 shrink-0 relative z-[1]">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm truncate max-w-[120px] relative z-[1]">
                    {profile?.display_name || user.email?.split("@")[0]}
                  </span>
                  {isVanguard ? (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-sf-tag font-mono text-[12px] uppercase tracking-[0.18em] bg-sf-violet/[0.06] border border-sf-violet/[0.15] text-sf-violet sf-shimmer-violet relative z-[1]">
                      <Sparkles className="w-3 h-3" />
                      Vanguard
                    </span>
                  ) : isSubscribed ? (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-sf-tag font-mono text-[12px] uppercase tracking-[0.18em] bg-sf-amber/[0.06] border border-sf-amber/[0.15] text-sf-amber sf-shimmer relative z-[1]">
                      <Zap className="w-3 h-3" />
                      Pro
                    </span>
                  ) : null}
                  <ChevronDown className="w-4 h-4 text-t3 relative z-[1]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-sf-surface/95 backdrop-blur-sf-side border-sf-border rounded-none">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/worlds")}>
                  <Globe className="w-4 h-4 mr-2" />
                  My Worlds
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/collection")}>
                  <Library className="w-4 h-4 mr-2" />
                  My Collection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/archive")}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/studio")}>
                  <PenTool className="w-4 h-4 mr-2" />
                  Studio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/commendations")}>
                  <Award className="w-4 h-4 mr-2" />
                  Commendations
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  setSettingsTab("account");
                  setSettingsOpen(true);
                }}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSettingsTab("background");
                  setSettingsOpen(true);
                }}>
                  <Image className="w-4 h-4 mr-2" />
                  Background
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSettingsTab("export");
                  setSettingsOpen(true);
                }}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Settings
                </DropdownMenuItem>
                {isVanguard ? (
                  <DropdownMenuItem onClick={() => navigate("/pricing")} className="text-sf-violet">
                    <Sparkles className="w-4 h-4 mr-2 text-sf-violet" />
                    Manage Vanguard
                  </DropdownMenuItem>
                ) : isSubscribed ? (
                  <DropdownMenuItem onClick={() => navigate("/pricing")} className="text-sf-amber">
                    <Zap className="w-4 h-4 mr-2 text-sf-amber" />
                    Manage Subscription
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => navigate("/pricing")}>
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => navigate("/auth")}
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">AUTHENTICATE</span>
            </Button>
          )}
        </div>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} defaultTab={settingsTab} />

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
};

export default Header;
