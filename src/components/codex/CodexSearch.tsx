import { useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

interface CodexSearchProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
}

const CodexSearch = ({ value, onChange, onFocus }: CodexSearchProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on "/" key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="relative px-3 mb-2">
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="SEARCH ELEMENTS..."
        className="w-full h-7 pl-6 pr-6 bg-transparent border border-border/20 text-[11px] font-mono tracking-wider text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground/80"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default CodexSearch;
