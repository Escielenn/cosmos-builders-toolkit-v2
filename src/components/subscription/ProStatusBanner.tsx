import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Crown, X, Sparkles, Check } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProStatusBannerProps {
  isSubscribed: boolean;
}

const DISMISSAL_KEY = "stellarforge_upgrade_banner_dismissed";

const ProStatusBanner = ({ isSubscribed }: ProStatusBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSAL_KEY);
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSAL_KEY, "true");
    setIsDismissed(true);
  };

  // Pro user - show celebration banner
  if (isSubscribed) {
    return (
      <section className="mb-8">
        <GlassPanel className="p-4 border-green-500/30 bg-green-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                  Pro Member
                  <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  All 9 worldbuilding tools unlocked
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/pricing">Manage Subscription</Link>
            </Button>
          </div>
        </GlassPanel>
      </section>
    );
  }

  // Non-Pro user - show upgrade prompt (if not dismissed)
  if (isDismissed) {
    return null;
  }

  return (
    <section className="mb-8">
      <GlassPanel className="p-4 border-amber-500/30 bg-amber-500/5 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>

          <div className="flex-1">
            <p className="font-medium text-amber-600 dark:text-amber-400 mb-1">
              Unlock All 9 Worldbuilding Tools
            </p>
            <p className="text-sm text-muted-foreground">
              Go Pro to access Planetary Profiles, Drake Equation Calculator, Xenomythology Framework Builder,
              and upcoming Species Creator, Culture Designer, and Technology Mapper.
            </p>
          </div>

          <Button className="gap-2 shrink-0" asChild>
            <Link to="/pricing">
              <Crown className="w-4 h-4" />
              View Pro Plans
            </Link>
          </Button>
        </div>
      </GlassPanel>
    </section>
  );
};

export default ProStatusBanner;
