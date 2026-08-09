import { LucideIcon, Lock, Zap, Unlock } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { isProTool, getToolRoute } from "@/lib/tools-config";
import { useSubscription } from "@/hooks/use-subscription";
import { getToolIcon } from "@/components/icons/tool-icons";

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
        !canAccess ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        {CustomIcon ? (
          <CustomIcon className={`w-12 h-12 rounded-sm sf-card-icon ${!canAccess ? "opacity-50 grayscale" : ""}`} />
        ) : FallbackIcon ? (
          <div
            className={`w-12 h-12 rounded-sm flex items-center justify-center ${
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
          <div className="w-12 h-12 rounded-sm bg-muted flex items-center justify-center">
            <span className="text-t3">?</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {isPro && isSubscribed && (
            <Badge variant="secondary" className="group/badge text-xs bg-green-500/20 text-green-600 dark:text-green-400 cursor-default">
              <Unlock className="w-3 h-3" />
              <span className="inline-block max-w-0 overflow-hidden opacity-0 group-hover/badge:max-w-[5rem] group-hover/badge:opacity-100 group-hover/badge:ml-1 transition-all duration-300 ease-out whitespace-nowrap">
                Unlocked
              </span>
            </Badge>
          )}
          {isPro && !isSubscribed && (
            <Badge variant="secondary" className="text-xs bg-amber-500/20 text-sf-amber dark:text-sf-amber sf-shimmer">
              <Zap className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          )}
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
            <h3 className="font-heading font-medium text-lg hover:text-primary transition-colors">
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
        <p className="text-sm text-t3 mt-1">{description}</p>
        {category && (
          <Badge
            variant="outline"
            className="mt-2 text-[12px] px-2 py-0 border-transparent"
            style={{ color: category.color, borderColor: `${category.color}30` }}
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
