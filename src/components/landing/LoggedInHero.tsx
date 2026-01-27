import { Rocket, Crown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LoggedInHeroProps {
  isSubscribed: boolean;
}

const LoggedInHero = ({ isSubscribed }: LoggedInHeroProps) => {
  return (
    <section className="text-center mb-12">
      <div className="flex items-center justify-center gap-3 mb-4">
        <h1 className="font-display text-4xl md:text-5xl font-bold">
          <span className="gradient-text">StellarForge</span>
        </h1>
        {isSubscribed && (
          <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 gap-1">
            <Crown className="w-3 h-3" />
            Pro
          </Badge>
        )}
      </div>

      <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
        {isSubscribed
          ? "Welcome back! All tools are unlocked and ready."
          : "Science Fiction Worldbuilding Tools"}
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <Button size="lg" className="gap-2" asChild>
          <a href="#worlds">
            <Rocket className="w-4 h-4" />
            {isSubscribed ? "Continue Building" : "My Worlds"}
          </a>
        </Button>
        {!isSubscribed && (
          <Button variant="outline" size="lg" className="gap-2" asChild>
            <Link to="/pricing">
              <Sparkles className="w-4 h-4" />
              Explore Pro Tools
            </Link>
          </Button>
        )}
        {isSubscribed && (
          <Button variant="outline" size="lg" className="gap-2" asChild>
            <a href="#tools">
              View All Tools
            </a>
          </Button>
        )}
      </div>

      {!isSubscribed && (
        <p className="text-sm text-muted-foreground mt-4">
          3 free tools available • 5 more with Pro
        </p>
      )}
    </section>
  );
};

export default LoggedInHero;
