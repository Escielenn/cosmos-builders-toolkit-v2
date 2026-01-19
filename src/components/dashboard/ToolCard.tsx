import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";

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
  const isAvailable = status === "available";

  return (
    <GlassPanel
      hover={isAvailable}
      className={`p-5 flex flex-col gap-4 ${
        !isAvailable ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isAvailable
              ? "bg-gradient-to-br from-primary to-accent"
              : "bg-muted"
          }`}
        >
          <Icon
            className={`w-6 h-6 ${
              isAvailable ? "text-primary-foreground" : "text-muted-foreground"
            }`}
          />
        </div>
        {week && (
          <Badge variant="secondary" className="text-xs">
            Tool {week}
          </Badge>
        )}
      </div>

      <div className="flex-1">
        {isAvailable ? (
          <Link to={`/tools/${id}`}>
            <h3 className="font-display font-semibold text-lg hover:text-primary transition-colors">
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
    </GlassPanel>
  );
};

export default ToolCard;
