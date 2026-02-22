import { useState, useEffect } from "react";
import { User, LogIn, LogOut, ChevronDown, Crown, Menu, Globe, Wrench, BookOpen, Sparkles, Mail, Settings, Search, Image, Download, Library, Archive } from "lucide-react";
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
import SettingsDialog from "@/components/settings/SettingsDialog";
import GlobalSearch from "@/components/search/GlobalSearch";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";

const Header = () => {
  const { user, profile, signOut, loading } = useAuth();
  const { isSubscribed } = useSubscription();
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
        <Link to="/" className="flex items-center gap-3 group">
          <CubeLogo size={40} className="rounded-lg" />
          <div className="flex flex-col">
            <span className="font-display font-light text-lg leading-tight tracking-sf-wide text-white uppercase">
              STELLARFORGE
            </span>
            <span className="text-xs text-muted-foreground tracking-wide">Forge the Future</span>
          </div>
        </Link>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="w-5 h-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-[#0f0f0f]/98 border-border/30">
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-3">
                <CubeLogo size={32} className="rounded-lg" />
                <span className="font-display font-light tracking-sf-wide text-white uppercase">
                  STELLARFORGE
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
                to="/archive"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
              >
                <Archive className="w-5 h-5" />
                Archive
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
              <Link
                to="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                Features
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
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isSubscribed
                    ? "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                }`}
              >
                {isSubscribed ? (
                  <>
                    <Crown className="w-5 h-5" />
                    Pro Active
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Pricing
                  </>
                )}
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
              >
                <Mail className="w-5 h-5" />
                Contact
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

        {/* Desktop Navigation - StellarForge typography: uppercase, letter-spaced, light weight */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection("worlds")}
            className="sf-nav-link text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors duration-300"
          >
            Worlds
          </button>
          <button
            onClick={() => scrollToSection("tools")}
            className="sf-nav-link text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors duration-300"
          >
            Tools
          </button>
          <Link
            to="/features"
            className="sf-nav-link text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors duration-300"
          >
            Features
          </Link>
          <Link
            to="/learn"
            className="sf-nav-link text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors duration-300"
          >
            Learn
          </Link>
          <Link
            to="/pricing"
            className={`sf-nav-link text-xs font-medium uppercase tracking-[0.15em] transition-colors duration-300 ${
              isSubscribed
                ? "text-amber-600 dark:text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            {isSubscribed ? (
              <>
                <Crown className="w-3.5 h-3.5" />
                Pro
              </>
            ) : (
              "Pricing"
            )}
          </Link>
          <Link
            to="/contact"
            className="sf-nav-link text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors duration-300"
          >
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <BackgroundSelector />
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-4 h-4" />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          {!loading && user && !isSubscribed && (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex gap-1.5 border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              onClick={() => navigate("/pricing")}
            >
              <Crown className="w-3.5 h-3.5" />
              Upgrade to Pro
            </Button>
          )}
          {!loading && user ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm">
                    {profile?.display_name || user.email?.split("@")[0]}
                  </span>
                  {isSubscribed && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      <Crown className="w-3 h-3" />
                      Pro
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
                {isSubscribed ? (
                  <DropdownMenuItem onClick={() => navigate("/pricing")} className="text-amber-600 dark:text-amber-400">
                    <Crown className="w-4 h-4 mr-2 text-amber-500" />
                    Manage Pro Subscription
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => navigate("/pricing")}>
                    <Crown className="w-4 h-4 mr-2" />
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
