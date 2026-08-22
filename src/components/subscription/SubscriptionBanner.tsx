import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/use-subscription";
import { AlertTriangle, Clock, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const SubscriptionBanner = () => {
  const { isExpiringSoon, daysUntilExpiry, hasLapsedSubscription, isVanguard } = useSubscription();
  const navigate = useNavigate();

  const tierLabel = isVanguard ? "Vanguard" : "Pro";
  const TierIcon = isVanguard ? Sparkles : Zap;

  if (isExpiringSoon && daysUntilExpiry !== null) {
    const borderColor = isVanguard ? "border-sf-violet" : "border-sf-amber";
    const bgColor = isVanguard ? "bg-violet-500/5" : "bg-amber-500/5";
    const textColor = isVanguard ? "text-sf-violet" : "text-sf-amber";

    return (
      <div className="mx-auto max-w-2xl mb-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 border ${borderColor} ${bgColor}`}>
          <Clock className={`w-3.5 h-3.5 ${textColor} shrink-0`} />
          <p className="text-xs text-t3 flex-1">
            {tierLabel} expires in{" "}
            <span className={`font-mono ${textColor}`}>
              {daysUntilExpiry}d
            </span>
          </p>
          <button
            type="button"
            className={`shrink-0 text-[12px] font-medium uppercase tracking-[1px] ${textColor} hover:underline`}
            onClick={() => navigate("/pricing")}
          >
            Renew
          </button>
        </div>
      </div>
    );
  }

  if (hasLapsedSubscription) {
    return (
      <div className="mx-auto max-w-2xl mb-4">
        <div className="flex items-center gap-2 px-3 py-1.5 border border-sf-crimson bg-crimson/5">
          <AlertTriangle className="w-3.5 h-3.5 text-crimson shrink-0" />
          <p className="text-xs text-t3 flex-1">
            {tierLabel} access expired. Your data is safe.
          </p>
          <button
            type="button"
            className="shrink-0 text-[12px] font-medium uppercase tracking-[1px] text-crimson hover:underline"
            onClick={() => navigate("/pricing")}
          >
            Resubscribe
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default SubscriptionBanner;