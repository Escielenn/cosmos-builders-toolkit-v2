import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxTags?: number;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
}

export function TagInput({
  value = [],
  onChange,
  suggestions = [],
  placeholder = "Add tag...",
  maxTags = 10,
  maxLength = 30,
  className,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue.trim()) return [];
    const lower = inputValue.toLowerCase();
    return suggestions
      .filter(
        (s) =>
          s.toLowerCase().includes(lower) &&
          !value.map((v) => v.toLowerCase()).includes(s.toLowerCase())
      )
      .slice(0, 5);
  }, [inputValue, suggestions, value]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim().slice(0, maxLength);
    if (!trimmed) return;
    if (value.length >= maxTags) return;
    if (value.map((v) => v.toLowerCase()).includes(trimmed.toLowerCase())) return;

    onChange([...value, trimmed]);
    setInputValue("");
    setShowSuggestions(false);
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex flex-wrap gap-1.5 p-2 min-h-[42px] rounded-md border border-input bg-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, index) => (
          <Badge
            key={`${tag}-${index}`}
            variant="secondary"
            className="gap-1 pr-1 h-6"
          >
            <span className="max-w-[150px] truncate">{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                className="ml-0.5 rounded-sm p-0.5 hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}
        {value.length < maxTags && !disabled && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[80px] bg-transparent outline-none text-sm placeholder:text-t3"
            disabled={disabled}
          />
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 py-1 bg-popover border border-border rounded-md shadow-md">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {value.length >= maxTags && (
        <p className="text-xs text-t3 mt-1">
          Maximum {maxTags} tags reached
        </p>
      )}
    </div>
  );
}
