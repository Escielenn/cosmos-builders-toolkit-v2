import { Link } from "react-router-dom";
import { Zap, Unlock } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { PRO_TOOL_IDS, PRICING } from "@/lib/tools-config";

const QuickUpgradeCard = () => {
  return (
    <GlassPanel className="p-5 h-full min-h-[200px] flex flex-col items-center justify-center border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
      <div className="w-14 h-14 rounded-sm bg-amber-500/20 flex items-center justify-center mb-4">
        <Zap className="w-7 h-7 text-sf-amber" />
      </div>

      <h3 className="font-heading font-medium text-lg mb-2 text-center">
        Unlock {PRO_TOOL_IDS.length} More Tools
      </h3>

      <p className="text-sm text-t3 text-center mb-4">
        Starting at <span className="text-sf-amber dark:text-sf-amber font-medium">${PRICING.pro.monthly.price}/mo</span>
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
