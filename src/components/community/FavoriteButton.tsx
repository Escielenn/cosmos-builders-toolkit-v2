// ---------------------------------------------------------------------------
// FavoriteButton, Heart toggle with count
// ---------------------------------------------------------------------------

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsFavorited, useToggleFavorite, useFavoriteCount } from "@/hooks/use-world-favorites";

interface FavoriteButtonProps {
  worldId: string;
  className?: string;
}

export default function FavoriteButton({ worldId, className }: FavoriteButtonProps) {
  const { user } = useAuth();
  const { data: isFavorited = false } = useIsFavorited(worldId);
  const { data: count = 0 } = useFavoriteCount(worldId);
  const toggle = useToggleFavorite(worldId);

  const handleClick = () => {
    if (!user) return;
    toggle.mutate();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={!user || toggle.isPending}
      className={`gap-1.5 text-t3 hover:text-sf-crimson ${
        isFavorited ? "text-sf-crimson" : ""
      } ${className ?? ""}`}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className="w-4 h-4"
        fill={isFavorited ? "currentColor" : "none"}
      />
      {count > 0 && (
        <span className="font-mono text-xs">{count}</span>
      )}
    </Button>
  );
}
