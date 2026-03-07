import type { UserPresence } from "@/hooks/use-timeline-presence";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PresenceAvatarsProps {
  presences: UserPresence[];
}

const MAX_VISIBLE = 5;

const PresenceAvatars = ({ presences }: PresenceAvatarsProps) => {
  if (presences.length === 0) return null;

  const visible = presences.slice(0, MAX_VISIBLE);
  const overflow = presences.length - MAX_VISIBLE;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex items-center gap-0.5">
        <span className="text-[10px] text-muted-foreground mr-1">Viewing:</span>
        {visible.map((p) => (
          <Tooltip key={p.userId}>
            <TooltipTrigger asChild>
              <div
                className="w-6 h-6 rounded-full shrink-0 ring-2 -ml-1 first:ml-0 transition-transform hover:scale-110"
                style={{ ringColor: p.color, borderColor: p.color }}
              >
                {p.avatarUrl ? (
                  <img
                    src={p.avatarUrl}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                    style={{ outline: `2px solid ${p.color}` }}
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-[10px] font-medium text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    {(p.displayName || "?").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {p.displayName || "Unknown"} is viewing
            </TooltipContent>
          </Tooltip>
        ))}
        {overflow > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground -ml-1 ring-2 ring-border">
                +{overflow}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {overflow} more viewer{overflow !== 1 ? "s" : ""}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default PresenceAvatars;
