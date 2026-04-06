import { useState, useEffect } from "react";
import { User, LogIn, LogOut, ChevronDown, Zap, Menu, Globe, Wrench, BookOpen, Sparkles, Mail, Settings, Search, Image, Download, Library, Archive, Map, Compass, PenTool, Award, Users, Info } from "lucide-react";
import HeaderNavigation from "./HeaderNavigation";
import { APP_VERSION } from "@/config/version";
import { Link, useNavigate, useLocation } from "react-router-dom";
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

const Header = () => {
  const { user, profile, signOut, loading } = useAuth();
  const { isSubscribed, isVanguard } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();
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

  const scrollToSection = (sectionId: string) => {
    const scroll = () => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    };

    if (location.pathname !== "/") {
      navigate("/");
      // Wait for navigation, then scroll
      setTimeout(scroll, 100);
    } else {
      scroll();
    }
  };

  const initials = profile?.display_name
    ? profile.display_name.split(" ").map(n => n[0]).join("").toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "?";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 backdrop-blur-xl bg-gradient-to-r from-[#000000]/95 to-[#0A0E17]/95">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex flex-col shrink-0 mr-6">
          <Link to="/" className="flex items-center gap-2 group">
            <CubeLogo size={32} className="rounded-lg" />
            {isSubscribed ? (
              <>
                <span className="hidden xl:inline font-display text-lg font-light tracking-sf-wide text-foreground/90 uppercase">
                  STELLARFORGE
                </span>
                <span className="xl:hidden font-display text-lg font-light tracking-sf-wide text-foreground/90 uppercase">
                  SF
                </span>
              </>
            ) : (
              <span className="font-display text-lg font-light tracking-sf-wide text-foreground/90 uppercase">
                SF
              </span>
            )}
          </Link>
          <span className="hidden xl:block font-sans text-[10px] font-light tracking-[0.5px] text-white/20 ml-[42px] -mt-1">
            v{APP_VERSION}
          </span>
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
            <SheetContent side="right" className="w-72 bg-[#0f0f0f]/98 border-border/30">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-3">
                  <CubeLogo size={32} className="rounded-lg" />
                  <span className="font-display text-sm font-light tracking-sf-wide text-foreground/90 uppercase">
                    SF
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-8">
                <Link
                  to="/worlds"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                >
                  <Globe className="w-5 h-5" />
                  My Worlds
                </Link>
                <Link
                  to="/collection"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                >
                  <Library className="w-5 h-5" />
                  My Collection
                </Link>
                <Link
                  to="/community"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                >
                  <Users className="w-5 h-5" />
                  Community
                </Link>
                <Link
                  to="/archive"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                >
                  <Archive className="w-5 h-5" />
                  Archive
                </Link>
                <Link
                  to="/commendations"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                >
                  <Award className="w-5 h-5" />
                  Commendations
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollToSection("tools");
                  }}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors text-left"
                >
                  <Wrench className="w-5 h-5" />
                  Tools
                </button>
                {!isSubscribed && (
                  <Link
                    to="/features"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    <Sparkles className="w-5 h-5" />
                    Features
                  </Link>
                )}
                <Link
                  to="/guide"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                >
                  <Compass className="w-5 h-5" />
                  Guide
                </Link>
                <Link
                  to="/learn"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                >
                  <BookOpen className="w-5 h-5" />
                  Learn
                </Link>
                <Link
                  to="/bookshelf"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                >
                  <Library className="w-5 h-5" />
                  Bookshelf
                </Link>
                <div className="space-y-0.5">
                  <Link
                    to="/workshop"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    <PenTool className="w-5 h-5" />
                    Write
                  </Link>
                  <Link
                    to="/workshop#prompt"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 pl-11 text-xs text-muted-foreground/70 hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    Daily Prompt
                  </Link>
                  <Link
                    to="/workshop#prompts"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 pl-11 text-xs text-muted-foreground/70 hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    Prompt Browser
                  </Link>
                </div>
                <Link
                  to="/roadmap"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                >
                  <Map className="w-5 h-5" />
                  Roadmap
                </Link>
                {!isSubscribed && (
                  <Link
                    to="/pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    <Sparkles className="w-5 h-5" />
                    Pricing
                  </Link>
                )}
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  Contact
                </Link>
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                >
                  <Info className="w-5 h-5" />
                  About
                </Link>
              </nav>
              {!loading && !user && (
                <div className="mt-8 pt-8 border-t border-border/30">
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
            className="sf-nav-link inline-flex items-center justify-center gap-2 h-9 px-2 text-muted-foreground hover:text-primary transition-colors"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-4 h-4 relative z-[1]" />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground relative z-[1]">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
          {!loading && user && !isSubscribed && (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex gap-1.5 border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              onClick={() => navigate("/pricing")}
            >
              <Zap className="w-3.5 h-3.5" />
              Upgrade to Pro
            </Button>
          )}
          {!loading && user && isSubscribed && !isVanguard && (
            <Button
              variant="outline"
              size="sm"
              className="hidden lg:inline-flex gap-1.5 border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
              onClick={() => navigate("/pricing")}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Upgrade to Vanguard
            </Button>
          )}
          {!loading && user ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="sf-nav-link inline-flex items-center gap-2 px-2 h-9 text-foreground/80 hover:text-primary transition-colors">
                  <Avatar className="w-7 h-7 shrink-0 relative z-[1]">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm truncate max-w-[120px] relative z-[1]">
                    {profile?.display_name || user.email?.split("@")[0]}
                  </span>
                  {isVanguard ? (
                    <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-violet-500/20 text-violet-400 sf-shimmer-violet relative z-[1]">
                      <Sparkles className="w-3 h-3" />
                      Vanguard
                    </span>
                  ) : isSubscribed ? (
                    <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 sf-shimmer relative z-[1]">
                      <Zap className="w-3 h-3" />
                      Pro
                    </span>
                  ) : null}
                  <ChevronDown className="w-4 h-4 text-muted-foreground relative z-[1]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#0c1019]/95 backdrop-blur-xl border-white/10">
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
                <DropdownMenuItem onClick={() => navigate("/workshop")}>
                  <PenTool className="w-4 h-4 mr-2" />
                  Write
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
                  <DropdownMenuItem onClick={() => navigate("/pricing")} className="text-violet-400">
                    <Sparkles className="w-4 h-4 mr-2 text-violet-400" />
                    Manage Vanguard
                  </DropdownMenuItem>
                ) : isSubscribed ? (
                  <DropdownMenuItem onClick={() => navigate("/pricing")} className="text-amber-600 dark:text-amber-400">
                    <Zap className="w-4 h-4 mr-2 text-amber-500" />
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
