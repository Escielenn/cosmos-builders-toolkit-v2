import { Link } from "react-router-dom";
import { LogOut, Eye, Pencil } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import WorldIconRenderer from "@/components/world/WorldIconRenderer";

interface SharedWorldCardProps {
  id: string;
  name: string;
  description: string | null;
  headerImageUrl: string | null;
  headerImageFocusY?: number;
  icon: string;
  tags?: string[];
  updatedAt: string;
  ownerDisplayName: string | null;
  myRole: "viewer" | "editor";
  onLeave: (worldId: string) => void;
}

const SharedWorldCard = ({
  id,
  name,
  description,
  headerImageUrl,
  headerImageFocusY,
  icon,
  tags = [],
  updatedAt,
  ownerDisplayName,
  myRole,
  onLeave,
}: SharedWorldCardProps) => {
  const formattedDate = new Date(updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const RoleIcon = myRole === "editor" ? Pencil : Eye;

  return (
    <GlassPanel hover className="flex flex-col min-h-[200px]">
      {/* Header Image */}
      <div className="relative">
        {headerImageUrl ? (
          <div className="w-full h-24 overflow-hidden">
            <img
              src={headerImageUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{ objectPosition: `center ${headerImageFocusY ?? 50}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-16 bg-gradient-to-br from-primary/10 to-accent/10">
            <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
          </div>
        )}
        {/* Icon overlay */}
        <div className="absolute -bottom-5 left-4 w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-background flex items-center justify-center shadow-lg z-10 overflow-hidden">
          <WorldIconRenderer iconId={icon} className="w-7 h-7 text-primary" />
        </div>
        {/* Role badge */}
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 gap-1 capitalize"
        >
          <RoleIcon className="w-3 h-3" />
          {myRole}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-5 pt-8 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <Link to={`/worlds/${id}`} className="flex-1">
            <h3 className="font-heading font-semibold text-lg hover:text-primary transition-colors">
              {name}
            </h3>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mr-2 -mt-1 text-muted-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave this world?</AlertDialogTitle>
                <AlertDialogDescription>
                  You'll lose access to "{name}" and its worksheets. You'll need a
                  new invitation to rejoin.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onLeave(id)}>
                  Leave
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex-1">
          {ownerDisplayName && (
            <p className="text-xs text-muted-foreground mb-1">
              Shared by {ownerDisplayName}
            </p>
          )}
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-border/50 mt-auto">
          <p className="text-xs text-muted-foreground">
            Last updated: {formattedDate}
          </p>
        </div>
      </div>
    </GlassPanel>
  );
};

export default SharedWorldCard;
