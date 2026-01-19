import { Globe, MoreHorizontal, Rocket, Users, Atom } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorldCardProps {
  id: string;
  name: string;
  description?: string;
  toolsCompleted: number;
  lastEdited: string;
}

const WorldCard = ({
  id,
  name,
  description,
  toolsCompleted,
  lastEdited,
}: WorldCardProps) => {
  return (
    <GlassPanel hover className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center">
          <Globe className="w-6 h-6 text-primary" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit World</DropdownMenuItem>
            <DropdownMenuItem>Share</DropdownMenuItem>
            <DropdownMenuItem>Export</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1">
        <Link to={`/worlds/${id}`}>
          <h3 className="font-display font-semibold text-lg hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Rocket className="w-3.5 h-3.5" />
          <span>{toolsCompleted} tools</span>
        </div>
        <span>•</span>
        <span>Edited {lastEdited}</span>
      </div>

      <div className="flex gap-2 pt-2 border-t border-border/50">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center" title="Spacecraft">
          <Rocket className="w-3 h-3 text-primary" />
        </div>
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center opacity-40" title="Species">
          <Users className="w-3 h-3" />
        </div>
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center opacity-40" title="Planet">
          <Atom className="w-3 h-3" />
        </div>
      </div>
    </GlassPanel>
  );
};

export default WorldCard;
