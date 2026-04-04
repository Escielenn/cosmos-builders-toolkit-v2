// ---------------------------------------------------------------------------
// GraphSearch — Quick search/filter entities by name in the graph.
// ---------------------------------------------------------------------------

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Entity } from "@/services/entity-graph-types";
import { ENTITY_TYPE_COLORS, ENTITY_TYPE_LABELS } from "@/services/entity-graph-types";

interface GraphSearchProps {
  entities: Entity[];
  onHighlight: (entityId: string | null) => void;
  onFocusEntity: (entityId: string) => void;
}

export function GraphSearch({
  entities,
  onHighlight,
  onFocusEntity,
}: GraphSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.length >= 1
    ? entities.filter((e) =>
        e.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleOpen = useCallback(() => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
    onHighlight(null);
  }, [onHighlight]);

  const handleSelect = useCallback(
    (entity: Entity) => {
      onFocusEntity(entity.id);
      onHighlight(entity.id);
      setOpen(false);
      setQuery("");
    },
    [onFocusEntity, onHighlight]
  );

  // Keyboard shortcut: Ctrl/Cmd + F opens search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        handleOpen();
      }
      if (e.key === "Escape" && open) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, handleOpen, handleClose]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1 h-7 px-2 text-[10px] uppercase tracking-[1.2px] font-sans text-tier-3 hover:text-tier-1 transition-colors"
        title="Search entities (Ctrl+F)"
      >
        <Search className="w-3 h-3" />
        Search
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <Search className="w-3 h-3 text-tier-4" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search entities..."
          className="h-7 w-[160px] text-[11px] rounded-xs border-border/30 bg-transparent"
        />
        <button
          type="button"
          onClick={handleClose}
          className="text-tier-4 hover:text-tier-2 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {results.length > 0 && (
        <div
          className="absolute top-full left-0 mt-1 w-[220px] max-h-[200px] overflow-y-auto z-50"
          style={{
            background: "rgba(15,15,16,0.98)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
          }}
        >
          {results.map((entity) => {
            const color = entity.color ?? ENTITY_TYPE_COLORS[entity.entity_type] ?? "#00D4FF";
            return (
              <button
                key={entity.id}
                type="button"
                onClick={() => handleSelect(entity)}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition-colors text-left"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-tier-2 truncate">
                    {entity.name}
                  </div>
                  <div className="text-[8px] text-tier-4 uppercase tracking-[1px]">
                    {ENTITY_TYPE_LABELS[entity.entity_type]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
