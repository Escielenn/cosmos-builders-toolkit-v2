import { User, LogIn, LogOut, ChevronDown, Crown } from "lucide-react";
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
import BackgroundSelector from "@/components/settings/BackgroundSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";

const Header = () => {
  const { user, profile, signOut, loading } = useAuth();
  const { isSubscribed } = useSubscription();
  const navigate = useNavigate();

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
