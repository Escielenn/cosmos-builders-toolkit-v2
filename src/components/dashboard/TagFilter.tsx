import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
  onTagRemove: (tag: string) => void;
  onClear: () => void;
  className?: string;
}

export function TagFilter({
  availableTags,
  selectedTags,
  onTagSelect,
  onTagRemove,
  onClear,
  className,
}: TagFilterProps) {
  if (availableTags.length === 0) return null;

  const unselectedTags = availableTags.filter((t) => !selectedTags.includes(t));

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Tag className="w-4 h-4 text-muted-foreground" />

      {/* Selected tags */}
      {selectedTags.map((tag) => (
        <Badge
          key={tag}
          variant="default"
          className="gap-1 pr-1 cursor-pointer hover:bg-primary/80"
          onClick={() => onTagRemove(tag)}
        >
          {tag}
          <X className="w-3 h-3" />
        </Badge>
      ))}

      {/* Unselected tags */}
      {unselectedTags.slice(0, 5).map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
          onClick={() => onTagSelect(tag)}
        >
          {tag}
        </Badge>
      ))}

      {unselectedTags.length > 5 && (
        <span className="text-xs text-muted-foreground">
          +{unselectedTags.length - 5} more
        </span>
      )}

      {selectedTags.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
