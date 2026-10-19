import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/use-subscription";
import { AlertTriangle, Clock, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/layout/page-chrome";

const SubscriptionBanner = () => {
  const { isExpiringSoon, daysUntilExpiry, hasLapsedSubscription, isVanguard } = useSubscription();
  const navigate = useNavigate();

  const tierLabel = isVanguard ? "Vanguard" : "Pro";
  const TierIcon = isVanguard ? Sparkles : Zap;

  if (isExpiringSoon && daysUntilExpiry !== null) {
    const textColor = isVanguard ? "text-sf-violet-text" : "text-sf-amber-text";

    return (
      <div className="mx-auto max-w-2xl mb-4">
        <Notice tone="caution" compact icon={<Clock className="w-3.5 h-3.5" />}>
          <div className="flex items-center gap-2">
          <p className="flex-1">
            {tierLabel} expires in{" "}
            <span className={`font-mono ${textColor}`}>
              {daysUntilExpiry}d
            </span>
          </p>
          <button
            type="button"
            className={`shrink-0 min-h-hit px-2 text-xs font-medium uppercase tracking-wider ${textColor} hover:underline`}
            onClick={() => navigate("/pricing")}
          >
            Renew
          </button>
          </div>
        </Notice>
      </div>
    );
  }

  if (hasLapsedSubscription) {
    return (
      <div className="mx-auto max-w-2xl mb-4">
        <Notice tone="danger" compact icon={<AlertTriangle className="w-3.5 h-3.5" />}>
          <div className="flex items-center gap-2">
          <p className="flex-1">
            {tierLabel} access expired. Your data is safe.
          </p>
          <button
            type="button"
            className="shrink-0 min-h-hit px-2 text-xs font-medium uppercase tracking-wider text-sf-crimson-text hover:underline"
            onClick={() => navigate("/pricing")}
          >
            Resubscribe
          </button>
          </div>
        </Notice>
      </div>
    );
  }

  return null;
};

export default SubscriptionBanner;