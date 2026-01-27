import { Link } from "react-router-dom";
import { Crown, Unlock } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";

const QuickUpgradeCard = () => {
  return (
    <GlassPanel className="p-5 h-full min-h-[200px] flex flex-col items-center justify-center border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
      <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
        <Crown className="w-7 h-7 text-amber-500" />
      </div>

      <h3 className="font-display font-semibold text-lg mb-2 text-center">
        Unlock 6 More Tools
      </h3>

      <p className="text-sm text-muted-foreground text-center mb-4">
        Starting at <span className="text-amber-600 dark:text-amber-400 font-medium">$8.25/mo</span> with yearly
      </p>

      <Button className="gap-2 w-full" asChild>
        <Link to="/pricing">
          <Unlock className="w-4 h-4" />
          Upgrade Now
        </Link>
      </Button>
    </GlassPanel>
  );
};

export default QuickUpgradeCard;
