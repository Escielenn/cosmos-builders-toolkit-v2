import { Link } from "react-router-dom";
import { Zap, Unlock } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { PRO_TOOL_IDS, PRICING } from "@/lib/tools-config";

const QuickUpgradeCard = () => {
  return (
    <GlassPanel className="p-5 h-full min-h-[200px] flex flex-col items-center justify-center border-sf-amber bg-gradient-to-br from-sf-amber/5 to-sf-amber/10">
      <div className="w-14 h-14 rounded-none bg-sf-amber/[0.06] border border-sf-amber flex items-center justify-center mb-4">
        <Zap className="w-7 h-7 text-sf-amber-text" />
      </div>

      <h3 className="font-heading font-medium text-lg mb-2 text-center">
        Unlock {PRO_TOOL_IDS.length} More Tools
      </h3>

      <p className="text-sm text-t2 text-center mb-4">
        Starting at <span className="text-sf-amber-text font-medium">${PRICING.pro.monthly.price}/mo</span>
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
