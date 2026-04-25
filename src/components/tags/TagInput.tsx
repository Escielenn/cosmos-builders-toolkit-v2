import { useState, useRef, useEffect, useCallback } from "react";
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
  hideTags?: boolean;
}

const TagInput = ({
  tags,
  onChange,
  placeholder = "Add tag... (shared across worlds)",
  maxTags = 10,
  className,
  hideTags = false,
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

  const addTag = useCallback((tagName: string) => {
    const normalized = tagName.toLowerCase().trim();
    if (!normalized || tags.includes(normalized) || tags.length >= maxTags) {
      return;
    }
    onChange([...tags, normalized]);
    setInputValue("");
    inputRef.current?.focus();
  }, [tags, maxTags, onChange]);

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  // Native keydown listener on the input element (capture phase)
  // This ensures Enter is handled even if React synthetic events are intercepted
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const currentInput = input.value.trim();
        // Use the DOM value directly to avoid stale closure issues
        if (currentInput) {
          // Check for matching suggestions from the autocomplete list
          const lowerInput = currentInput.toLowerCase();
          const matchingSuggestions = allTags
            .filter((t) => t.name.includes(lowerInput) && !tags.includes(t.name))
            .slice(0, 10);

          if (matchingSuggestions.length > 0) {
            addTag(matchingSuggestions[0].name);
          } else {
            addTag(currentInput);
          }
        }
      } else if (e.key === "Backspace" && !input.value && tags.length > 0) {
        removeTag(tags[tags.length - 1]);
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
      } else if (e.key === "Escape") {
        setInputValue("");
        input.blur();
      }
    };

    input.addEventListener("keydown", handler, true);
    return () => input.removeEventListener("keydown", handler, true);
  }, [tags, allTags, addTag, maxTags]);

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
      {!hideTags && tags.length > 0 && (
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
          <Plus className="absolute left-2.5 w-4 h-4 text-t3" />
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={tags.length >= maxTags ? "Max tags reached" : placeholder}
            disabled={tags.length >= maxTags}
            className="pl-8 h-8 text-sm"
            autoFocus
          />
        </div>

        {/* Suggestions dropdown */}
        {isFocused && inputValue && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
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
                <span className="text-xs text-t3 ml-auto">
                  {suggestion.usage_count} use{suggestion.usage_count !== 1 ? "s" : ""}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Create new tag hint - also clickable */}
        {isFocused && inputValue && suggestions.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(inputValue)}
              className="w-full px-3 py-2 text-sm text-left text-t3 hover:bg-accent/50 transition-colors"
            >
              Press Enter to create "<span className="text-foreground">{inputValue}</span>"
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagInput;
