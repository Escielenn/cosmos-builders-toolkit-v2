// ---------------------------------------------------------------------------
// EntityMentionList, Floating suggestion panel for @entity mentions.
//
// Shows entity name, type label, and color dot. Supports keyboard navigation
// (arrow keys + Enter to select, Escape to close). Styled per StellarForge
// design system: glass panel, dark bg, small text.
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_LABELS,
  type Entity,
  type EntityType,
} from "@/services/entity-graph-types";

export interface EntityMentionItem {
  id: string;
  name: string;
  entity_type: EntityType;
  color: string | null;
}

interface EntityMentionListProps {
  entities: Entity[];
  query: string;
  position: { top: number; left: number };
  onSelect: (entity: EntityMentionItem) => void;
  onClose: () => void;
}

export function EntityMentionList({
  entities,
  query,
  position,
  onSelect,
  onClose,
}: EntityMentionListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Filter entities by query
  const filtered = filterEntities(entities, query);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (filtered[selectedIndex]) {
          onSelect(toMentionItem(filtered[selectedIndex]));
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [filtered, selectedIndex, onSelect, onClose]
  );

  // Capture phase so we intercept before TipTap
  useEffect(() => {
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

  // Scroll selected item into view
  useEffect(() => {
    const selected = ref.current?.querySelector("[data-selected='true']");
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <div
      ref={ref}
      className="sf-entity-mention-list"
      style={{ top: position.top + 4, left: position.left }}
    >
      {filtered.length > 0 ? (
        filtered.map((entity, i) => {
          const color =
            entity.color ||
            ENTITY_TYPE_COLORS[entity.entity_type] ||
            ENTITY_TYPE_COLORS.custom;
          const typeLabel =
            ENTITY_TYPE_LABELS[entity.entity_type] || entity.entity_type;

          return (
            <div
              key={entity.id}
              data-selected={i === selectedIndex}
              className={`sf-entity-mention-item ${
                i === selectedIndex ? "selected" : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(toMentionItem(entity));
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span
                className="sf-entity-mention-item-dot"
                style={{ backgroundColor: color }}
              />
              <span className="sf-entity-mention-item-name">{entity.name}</span>
              <span className="sf-entity-mention-item-type">{typeLabel}</span>
            </div>
          );
        })
      ) : (
        <div className="sf-entity-mention-empty">
          {query ? "No matching entities." : "Type to search entities..."}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function filterEntities(entities: Entity[], query: string): Entity[] {
  const q = query.toLowerCase().trim();
  if (!q) return entities.slice(0, 10);

  return entities
    .filter((e) => {
      const name = e.name.toLowerCase();
      const type = (ENTITY_TYPE_LABELS[e.entity_type] || "").toLowerCase();
      return name.includes(q) || type.includes(q);
    })
    .slice(0, 10);
}

function toMentionItem(entity: Entity): EntityMentionItem {
  return {
    id: entity.id,
    name: entity.name,
    entity_type: entity.entity_type,
    color: entity.color,
  };
}
