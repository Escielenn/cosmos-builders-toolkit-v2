import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import TagBadge from "@/components/tags/TagBadge";
import TagInput from "@/components/tags/TagInput";
import { useTags } from "@/hooks/use-tags";

interface EntryTagsBarProps {
  entryId: string;
  tags: string[];
  readOnly?: boolean;
}

export function EntryTagsBar({
  entryId,
  tags,
  readOnly = false,
}: EntryTagsBarProps) {
  const [showInput, setShowInput] = useState(false);
  const { tags: allTags, updateEntryTags, createTag } = useTags();

  const getColorForTag = (tagName: string): string => {
    const existingTag = allTags.find((t) => t.name === tagName);
    if (existingTag) return existingTag.color;
    const hash = tagName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const TAG_COLORS = [
      "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
      "#f43f5e", "#ef4444", "#f97316", "#f59e0b", "#eab308",
      "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
      "#0ea5e9", "#3b82f6",
    ];
    return TAG_COLORS[hash % TAG_COLORS.length];
  };

  const handleChange = (newTags: string[]) => {
    // Ensure any new tags exist in worksheet_tags for autocomplete
    for (const tag of newTags) {
      if (!allTags.find((t) => t.name === tag)) {
        createTag.mutate({ name: tag });
      }
    }
    updateEntryTags.mutate({ entryId, tags: newTags });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <TagBadge
          key={tag}
          name={tag}
          color={getColorForTag(tag)}
          size="sm"
          onRemove={readOnly ? undefined : () => handleChange(tags.filter((t) => t !== tag))}
        />
      ))}
      {!readOnly && (
        showInput ? (
          <div className="w-48">
            <TagInput
              tags={tags}
              onChange={handleChange}
              placeholder="Add tag..."
              maxTags={10}
              hideTags
            />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowInput(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Tag
          </Button>
        )
      )}
    </div>
  );
}
