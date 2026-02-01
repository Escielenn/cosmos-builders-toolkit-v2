import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import TagBadge from "./TagBadge";
import { useTags, getTagColor } from "@/hooks/use-tags";
import { cn } from "@/lib/utils";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

const TagInput = ({
  tags,
  onChange,
  placeholder = "Add tag...",
  maxTags = 10,
  className,
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { tags: allTags, searchTags } = useTags();

  // Get suggestions based on input
  const suggestions = searchTags(inputValue).filter(
    (t) => !tags.includes(t.name)
  );

  // Reset selected suggestion when input changes
  useEffect(() => {
    setSelectedSuggestion(0);
  }, [inputValue]);

  const addTag = (tagName: string) => {
    const normalized = tagName.toLowerCase().trim();
    if (!normalized || tags.includes(normalized) || tags.length >= maxTags) {
      return;
    }
    onChange([...tags, normalized]);
    setInputValue("");
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0 && selectedSuggestion < suggestions.length) {
        addTag(suggestions[selectedSuggestion].name);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setSelectedSuggestion((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setSelectedSuggestion((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Escape") {
      setInputValue("");
      inputRef.current?.blur();
    }
  };

  const getColorForTag = (tagName: string): string => {
    const existingTag = allTags.find((t) => t.name === tagName);
    if (existingTag) return existingTag.color;
    // Generate consistent color based on tag name
    const hash = tagName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return getTagColor(hash);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Current tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <TagBadge
              key={tag}
              name={tag}
              color={getColorForTag(tag)}
              size="sm"
              onRemove={() => removeTag(tag)}
            />
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Plus className="absolute left-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            placeholder={tags.length >= maxTags ? "Max tags reached" : placeholder}
            disabled={tags.length >= maxTags}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Suggestions dropdown */}
        {isFocused && inputValue && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => addTag(suggestion.name)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-accent/50 transition-colors",
                  index === selectedSuggestion && "bg-accent/50"
                )}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: suggestion.color }}
                />
                <span>{suggestion.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {suggestion.usage_count} use{suggestion.usage_count !== 1 ? "s" : ""}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Create new tag hint */}
        {isFocused && inputValue && suggestions.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Press Enter to create "{inputValue}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagInput;
