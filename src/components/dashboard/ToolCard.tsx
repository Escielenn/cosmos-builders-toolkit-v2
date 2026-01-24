import { LucideIcon, Lock, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { isProTool } from "@/lib/tools-config";
import { useSubscription } from "@/hooks/use-subscription";

interface ToolCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: "available" | "coming-soon";
  week?: number;
}

const ToolCard = ({
  id,
  title,
  description,
  icon: Icon,
  status,
  week,
}: ToolCardProps) => {
  const { isSubscribed } = useSubscription();

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
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            canAccess
              ? "bg-gradient-to-br from-primary to-accent"
              : "bg-muted"
          }`}
        >
          <Icon
            className={`w-6 h-6 ${
              canAccess ? "text-primary-foreground" : "text-muted-foreground"
            }`}
          />
        </div>
        <div className="flex items-center gap-2">
          {isPro && (
            <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Crown className="w-3 h-3 mr-1" />
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
          <Link to={`/tools/${id}`}>
            <h3 className="font-display font-semibold text-lg hover:text-primary transition-colors">
              {title}
            </h3>
          </Link>
        ) : isLocked ? (
          <Link to="/pricing">
            <h3 className="font-display font-semibold text-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {title}
            </h3>
          </Link>
        ) : (
          <h3 className="font-display font-semibold text-lg text-muted-foreground">
            {title}
          </h3>
        )}
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
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
