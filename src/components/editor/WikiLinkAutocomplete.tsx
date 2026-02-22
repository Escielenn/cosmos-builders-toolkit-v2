import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WikiLinkResult {
  id: string;
  title: string;
  type: string;
}

interface WikiLinkAutocompleteProps {
  worldId: string;
  query: string;
  position: { top: number; left: number };
  onSelect: (element: WikiLinkResult) => void;
  onClose: () => void;
}

export function WikiLinkAutocomplete({
  worldId,
  query,
  position,
  onSelect,
  onClose,
}: WikiLinkAutocompleteProps) {
  const [results, setResults] = useState<WikiLinkResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    searchWorldElements(worldId, query).then((r) => {
      if (!cancelled) {
        setResults(r);
        setSelectedIndex(0);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [worldId, query]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (results[selectedIndex]) {
          onSelect(results[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [results, selectedIndex, onSelect, onClose]
  );

  useEffect(() => {
    // Capture phase so we intercept before TipTap
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Scroll selected into view
  useEffect(() => {
    const selected = ref.current?.querySelector(".selected");
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <div
      ref={ref}
      className="sf-wiki-autocomplete"
      style={{ top: position.top + 4, left: position.left }}
    >
      {results.map((element, i) => (
        <div
          key={element.id}
          className={`sf-wiki-autocomplete-item ${i === selectedIndex ? "selected" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(element);
          }}
          onMouseEnter={() => setSelectedIndex(i)}
        >
          <span className="sf-wiki-autocomplete-type">{element.type}</span>
          <span className="sf-wiki-autocomplete-title">{element.title}</span>
        </div>
      ))}
      {results.length === 0 && (
        <div className="sf-wiki-autocomplete-empty">
          {query ? "No matching elements." : "Type to search..."}
        </div>
      )}
    </div>
  );
}

async function searchWorldElements(
  worldId: string,
  query: string
): Promise<WikiLinkResult[]> {
  const q = supabase
    .from("world_entries")
    .select("id, title, entry_type, tool_source")
    .eq("world_id", worldId)
    .order("updated_at", { ascending: false })
    .limit(8);

  if (query.trim()) {
    q.ilike("title", `%${query}%`);
  }

  const { data } = await q;

  return (data || []).map((e) => ({
    id: e.id,
    title: e.title,
    type: e.tool_source || e.entry_type || "note",
  }));
}
