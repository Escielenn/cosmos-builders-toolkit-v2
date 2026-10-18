import { LucideIcon, Lock, Unlock } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { ProBadge } from "@/components/ui/pro-badge";
import { isProTool, getToolRoute } from "@/lib/tools-config";
import { useSubscription } from "@/hooks/use-subscription";
import { getToolIcon } from "@/components/icons/tool-icons";
import { hueEdge } from "@/lib/hue-edge";

interface ToolCardProps {
  id: string;
  title: string;
  description: string;
  icon?: LucideIcon; // Now optional, will use custom icon if available
  status: "available" | "coming-soon";
  week?: number;
  path?: string; // Optional path override (e.g., "/rogue" instead of "/tools/rogue")
  category?: { label: string; color: string }; // Optional category badge
}

const ToolCard = ({
  id,
  title,
  description,
  icon: FallbackIcon,
  status,
  week,
  path,
  category,
}: ToolCardProps) => {
  const { isSubscribed } = useSubscription();
  const CustomIcon = getToolIcon(id);

  const isAvailable = status === "available";
  const isPro = isProTool(id);
  const isLocked = isPro && !isSubscribed;
  const canAccess = isAvailable && !isLocked;

  return (
    <GlassPanel
      hover={canAccess}
      className={`p-5 flex flex-col gap-4 ${
        !canAccess ? "bg-sf-disabled-bg border-sf-disabled-line cursor-not-allowed" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        {CustomIcon ? (
          <CustomIcon className={`w-12 h-12 rounded-none sf-card-icon ${!canAccess ? "grayscale" : ""}`} />
        ) : FallbackIcon ? (
          <div
            className={`w-12 h-12 rounded-none flex items-center justify-center ${
              canAccess
                ? "bg-gradient-to-br from-primary to-accent"
                : "bg-muted"
            }`}
          >
            <FallbackIcon
              className={`w-6 h-6 ${
                canAccess ? "text-primary-foreground" : "text-t3"
              }`}
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-none bg-muted flex items-center justify-center">
            <span className="text-t3">?</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {isPro && isSubscribed && (
            <Badge variant="secondary" className="gap-1 rounded-none text-xs uppercase bg-sf-emerald/[0.06] border border-sf-emerald text-sf-emerald-text cursor-default">
              <Unlock className="w-3 h-3" aria-hidden="true" />
              <span className="whitespace-nowrap">Unlocked</span>
            </Badge>
          )}
          {isPro && !isSubscribed && <ProBadge />}
          {week && (
            <Badge variant="secondary" className="text-xs">
              Tool {week}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1">
        {canAccess ? (
          <Link to={path ?? getToolRoute(id) ?? `/tools/${id}`}>
            <h3 className="font-heading font-medium text-lg hover:text-sf-primary-text transition-colors">
              {title}
            </h3>
          </Link>
        ) : isLocked ? (
          <Link to="/pricing">
            <h3 className="font-heading font-medium text-lg text-t3 hover:text-t1 transition-colors flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {title}
            </h3>
          </Link>
        ) : (
          <h3 className="font-heading font-medium text-lg text-t3">
            {title}
          </h3>
        )}
        <p className="text-sm text-t2 mt-1">{description}</p>
        {category && (
          <Badge
            variant="outline"
            className="mt-2 text-[12px] px-2 py-0 border-transparent"
            style={{ color: category.color, borderColor: hueEdge(category.color) }}
          >
            {category.label}
          </Badge>
        )}
      </div>

      {!isAvailable && (
        <Badge variant="outline" className="w-fit text-xs">
          Coming Soon
        </Badge>
      )}

      {isAvailable && isLocked && (
        <Badge variant="outline" className="w-fit text-xs">
          <Lock className="w-3 h-3 mr-1" />
          Upgrade to Unlock
        </Badge>
      )}
    </GlassPanel>
  );
};

export default ToolCard;
