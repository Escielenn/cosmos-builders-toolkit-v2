import { tagColourForName } from "@/lib/palettes/tags";
import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import TagBadge from "@/components/tags/TagBadge";
import TagInput from "@/components/tags/TagInput";
import { useTags } from "@/hooks/use-tags";
import FirstTimeHint from "@/components/onboarding/FirstTimeHint";

interface WorksheetTagsBarProps {
  worksheetId: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  readOnly?: boolean;
}

export function WorksheetTagsBar({
  worksheetId,
  tags,
  onChange,
  readOnly = false,
}: WorksheetTagsBarProps) {
  const [showInput, setShowInput] = useState(false);
  const { tags: allTags } = useTags();

  const getColorForTag = (tagName: string): string => {
    const existingTag = allTags.find((t) => t.name === tagName);
    if (existingTag) return existingTag.color;
    return tagColourForName(tagName);
  };

  return (
    <div>
      <FirstTimeHint hintId="tags" icon={Tag} className="mb-2" />
    <div className="flex flex-wrap items-center gap-1.5 mt-1">
      {tags.map((tag) => (
        <TagBadge
          key={tag}
          name={tag}
          color={getColorForTag(tag)}
          size="sm"
          onRemove={readOnly ? undefined : () => onChange(tags.filter((t) => t !== tag))}
        />
      ))}
      {!readOnly && (
        showInput ? (
          <div className="w-48">
            <TagInput
              tags={tags}
              onChange={onChange}
              placeholder="Add tag..."
              maxTags={10}
              hideTags
            />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-t3 hover:text-t1"
            onClick={() => setShowInput(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Tag
          </Button>
        )
      )}
    </div>
    </div>
  );
}
