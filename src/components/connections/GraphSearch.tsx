// ---------------------------------------------------------------------------
// GraphSearch — find an entity by name in the Web view.
//
// Written for the retired /connections route and never mounted. Lifted into
// the Codex Web view's toolbar by F3; the alpha borders and hardcoded panel
// rgba are now tokens, and the shortcut no longer steals the browser's own
// Find when the graph is not on screen.
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
        className="flex min-h-hit items-center gap-1.5 border border-sf-line bg-sf-surface px-3 font-sans text-[12px] uppercase tracking-[1.2px] text-t3 transition-colors hover:text-t1"
        title="Search entities (Ctrl+F)"
      >
        <Search className="w-3 h-3" />
        Search
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="flex min-h-hit items-center gap-1.5 border border-sf-line bg-sf-surface px-2">
        <Search className="h-3 w-3 shrink-0 text-t4" aria-hidden />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search entities..."
          aria-label="Search entities"
          className="h-8 w-[160px] rounded-xs border-sf-line-interactive bg-transparent text-[13px]"
        />
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close search"
          className="text-t3 transition-colors hover:text-t1"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {results.length > 0 && (
        <div className="sf-sb absolute left-0 top-full z-50 mt-1 max-h-[200px] w-[220px] overflow-y-auto border border-sf-line-emphasis bg-sf-surface-elevated">
          {results.map((entity) => {
            const color =
              entity.color ??
              ENTITY_TYPE_COLORS[entity.entity_type] ??
              "var(--sf-primary)";
            return (
              <button
                key={entity.id}
                type="button"
                onClick={() => handleSelect(entity)}
                className="flex min-h-hit w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-sf-surface"
              >
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-[13px] text-t2">
                    {entity.name}
                  </div>
                  <div className="text-[12px] uppercase tracking-[1px] text-t4">
                    {entity.custom_type_label ??
                      ENTITY_TYPE_LABELS[entity.entity_type]}
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
