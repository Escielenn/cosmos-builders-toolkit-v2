import { useState } from "react";
import { User, LogIn, LogOut, ChevronDown, Crown, Menu, Globe, Wrench, BookOpen, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";

const Header = () => {
  const { user, profile, signOut, loading } = useAuth();
  const { isSubscribed } = useSubscription();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const initials = profile?.display_name
    ? profile.display_name.split(" ").map(n => n[0]).join("").toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "?";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 backdrop-blur-xl bg-[#0f0f0f]/95">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="STELLARFORGE"
            className="w-10 h-10 rounded-lg"
          />
          <div className="flex flex-col">
            <span className="font-sans font-semibold text-lg leading-tight tracking-widest text-white uppercase">
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
                <img src="/logo.png" alt="STELLARFORGE" className="w-8 h-8 rounded-lg" />
                <span className="font-sans font-semibold tracking-widest text-white uppercase">
                  STELLARFORGE
                </span>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 mt-8">
              <a
                href="/#worlds"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
              >
                <Globe className="w-5 h-5" />
                My Worlds
              </a>
              <a
                href="/#tools"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
              >
                <Wrench className="w-5 h-5" />
                Tools
              </a>
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
                  Sign In
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>

        <nav className="hidden md:flex items-center gap-6">
          <a
            href="/#worlds"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            My Worlds
          </a>
          <a
            href="/#tools"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Tools
          </a>
          <Link
            to="/learn"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Learn
          </Link>
          <Link
            to="/pricing"
            className={`text-sm font-medium transition-colors ${
              isSubscribed
                ? "text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isSubscribed ? (
              <>
                <Crown className="w-4 h-4" />
                Pro Active
              </>
            ) : (
              "Pricing"
            )}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <BackgroundSelector />
          {!loading && user ? (
            <DropdownMenu>
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
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
