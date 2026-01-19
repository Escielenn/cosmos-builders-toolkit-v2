import { Rocket, User, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BackgroundSelector from "@/components/settings/BackgroundSelector";

const Header = () => {
  // TODO: Replace with actual auth state
  const isAuthenticated = false;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Rocket className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-semibold text-lg leading-tight">
              Cosmos Builder's
            </span>
            <span className="text-xs text-muted-foreground">Science Fiction Worldbuilding Tools</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/worlds"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            My Worlds
          </Link>
          <Link
            to="/tools"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Tools
          </Link>
          <Link
            to="/docs"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <BackgroundSelector />
          {isAuthenticated ? (
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-2">
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
