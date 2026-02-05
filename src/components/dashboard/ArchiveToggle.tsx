import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Archive } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArchiveToggleProps {
  showArchived: boolean;
  onToggle: (show: boolean) => void;
  archivedCount?: number;
  className?: string;
}

export function ArchiveToggle({
  showArchived,
  onToggle,
  archivedCount = 0,
  className,
}: ArchiveToggleProps) {
  if (archivedCount === 0 && !showArchived) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Switch
        id="show-archived"
        checked={showArchived}
        onCheckedChange={onToggle}
      />
      <Label
        htmlFor="show-archived"
        className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer"
      >
        <Archive className="w-3.5 h-3.5" />
        Show archived
        {archivedCount > 0 && (
          <span className="text-xs">({archivedCount})</span>
        )}
      </Label>
    </div>
  );
}
