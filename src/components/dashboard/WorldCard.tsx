import { MoreHorizontal, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { getWorldIcon } from "@/lib/world-icons";

interface WorldCardProps {
  id: string;
  name: string;
  description: string | null;
  headerImageUrl: string | null;
  icon: string;
  updatedAt: string;
  onDelete: (id: string) => void;
}

const WorldCard = ({
  id,
  name,
  description,
  headerImageUrl,
  icon,
  updatedAt,
  onDelete,
}: WorldCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formattedDate = new Date(updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const worldIcon = getWorldIcon(icon);
  const IconComponent = worldIcon.icon;

  return (
    <>
      <GlassPanel hover className="overflow-hidden flex flex-col min-h-[200px]">
        {/* Header Image */}
        {headerImageUrl ? (
          <div className="relative w-full h-24 overflow-hidden">
            <img
              src={headerImageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            {/* Icon overlay on image */}
            <div className="absolute -bottom-5 left-4 w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-background flex items-center justify-center shadow-lg">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
          </div>
        ) : (
          <div className="relative w-full h-16 bg-gradient-to-br from-primary/10 to-accent/10">
            <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
            {/* Icon overlay */}
            <div className="absolute -bottom-5 left-4 w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-background flex items-center justify-center shadow-lg">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-5 pt-8 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-2">
            <Link to={`/worlds/${id}`} className="flex-1">
              <h3 className="font-display font-semibold text-lg hover:text-primary transition-colors">
                {name}
              </h3>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/worlds/${id}`}>Edit World</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Share</DropdownMenuItem>
                <DropdownMenuItem>Export</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-1">
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-border/50 mt-auto">
            <p className="text-xs text-muted-foreground">
              Last updated: {formattedDate}
            </p>
          </div>
        </div>
      </GlassPanel>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete World</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{name}"? This action cannot be undone and all associated worksheets will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WorldCard;
