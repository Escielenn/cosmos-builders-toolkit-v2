import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight,
  ChevronDown,
  GripVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Layers,
  AlignJustify,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader } from "@/components/ui/loader";
import { useEntities, useUpdateEntity } from "@/hooks/use-entity-graph";
import {
  CASCADE_STAGES,
  CASCADE_STAGE_LABELS,
  CASCADE_STAGE_COLORS,
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_CASCADE_DEFAULTS,
  type Entity,
  type CascadeStage,
  type EntityType,
} from "@/services/entity-graph-types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EntitySidebarProps {
  worldId: string;
  onEntityClick: (entityId: string) => void;
  onCreateEntity: () => void;
  onDeleteEntity: (entityId: string) => void;
}

type ViewMode = "tool" | "wiki";

// ---------------------------------------------------------------------------
// Color swatches for the color picker
// ---------------------------------------------------------------------------

const COLOR_SWATCHES = [
  "#FFB800",
  "#4D9FFF",
  "#9B5DE5",
  "#FF00AA",
  "#00FF88",
  "#00D4FF",
  "#FF3366",
  "#5B8DEF",
  "#15C17B",
  "#E74C3C",
  "#FFA500",
  "#FFD43B",
];

// ---------------------------------------------------------------------------
// Color Dot Popover
// ---------------------------------------------------------------------------

function ColorDotPicker({
  color,
  entityId,
  entityType,
  worldId,
}: {
  color: string;
  entityId: string;
  entityType: EntityType;
  worldId: string;
}) {
  const [open, setOpen] = useState(false);
  const [customHex, setCustomHex] = useState("");
  const updateEntity = useUpdateEntity(worldId);

  const handleColorSelect = useCallback(
    (newColor: string) => {
      updateEntity.mutate({ id: entityId, color: newColor });
      setOpen(false);
    },
    [entityId, updateEntity]
  );

  const handleCustomSubmit = useCallback(() => {
    const hex = customHex.startsWith("#") ? customHex : `#${customHex}`;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      handleColorSelect(hex);
      setCustomHex("");
    }
  }, [customHex, handleColorSelect]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="shrink-0 w-3 h-3 rounded-full border border-white/10 hover:border-white/30 transition-colors"
          style={{ backgroundColor: color }}
          onClick={(e) => e.stopPropagation()}
          aria-label="Change entity color"
        />
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-48 p-3 bg-[#0D1117] border-sf-border"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-sans text-[10px] uppercase tracking-[1.5px] text-t3 mb-2">
          Entity Color
        </p>

        {/* Preset swatches */}
        <div className="grid grid-cols-6 gap-1.5 mb-3">
          {COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              onClick={() => handleColorSelect(swatch)}
              className={cn(
                "w-5 h-5 rounded-full border transition-all hover:scale-110",
                color === swatch
                  ? "border-white/60 ring-1 ring-white/30"
                  : "border-white/10 hover:border-white/30"
              )}
              style={{ backgroundColor: swatch }}
              aria-label={`Select color ${swatch}`}
            />
          ))}
        </div>

        {/* Type default */}
        <button
          type="button"
          onClick={() => handleColorSelect(ENTITY_TYPE_COLORS[entityType])}
          className="w-full flex items-center gap-2 px-2 py-1 text-[10px] text-t4 hover:text-t2 transition-colors mb-2"
        >
          <span
            className="w-3 h-3 rounded-full border border-white/10"
            style={{ backgroundColor: ENTITY_TYPE_COLORS[entityType] }}
          />
          Reset to type default
        </button>

        {/* Custom hex input */}
        <div className="flex gap-1.5">
          <input
            type="text"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
            placeholder="#FF00AA"
            className="flex-1 bg-white/4 border border-white/10 rounded-xs px-2 py-1 text-[11px] font-mono text-t2 placeholder:text-t5 focus:border-teal/35 outline-none"
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            className="px-2 py-1 text-[10px] text-teal bg-teal/8 border border-teal/20 hover:bg-teal/15 transition-colors"
          >
            Set
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Sortable Entity Row
// ---------------------------------------------------------------------------

function SortableEntityRow({
  entity,
  worldId,
  isActive,
  onEntityClick,
  onDeleteEntity,
}: {
  entity: Entity;
  worldId: string;
  isActive?: boolean;
  onEntityClick: (entityId: string) => void;
  onDeleteEntity: (entityId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const entityColor = entity.color || ENTITY_TYPE_COLORS[entity.entity_type];
  const typeLabel =
    entity.custom_type_label || ENTITY_TYPE_LABELS[entity.entity_type];

  return (
    <div ref={setNodeRef} style={style} className="group/entity-row flex items-center">
      {/* Drag handle */}
      <button
        type="button"
        className="shrink-0 p-0.5 cursor-grab active:cursor-grabbing text-t5 opacity-0 group-hover/entity-row:opacity-100 transition-opacity touch-none"
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-3 h-3" />
      </button>

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            type="button"
            onClick={() => onEntityClick(entity.id)}
            className={cn(
              "flex-1 min-w-0 flex items-center gap-2 px-2 py-[5px] text-left transition-colors",
              "hover:bg-white/[0.04]",
              isActive && "bg-primary/[0.08] border-l-2 border-primary"
            )}
          >
            {/* Color dot */}
            <ColorDotPicker
              color={entityColor}
              entityId={entity.id}
              entityType={entity.entity_type}
              worldId={worldId}
            />

            {/* Entity name */}
            <span className="flex-1 min-w-0 font-sans text-[13px] text-t2 truncate">
              {entity.name}
            </span>

            {/* Type badge */}
            <span
              className="shrink-0 font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm border"
              style={{
                color: entityColor,
                borderColor: `${entityColor}26`,
                backgroundColor: `${entityColor}0F`,
              }}
            >
              {typeLabel}
            </span>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-44 bg-[#0D1117] border-sf-border">
          <ContextMenuItem
            onClick={() => onEntityClick(entity.id)}
            className="text-xs gap-2"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => onDeleteEntity(entity.id)}
            className="text-xs gap-2 text-sf-crimson focus:text-sf-crimson"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Static Entity Row (for wiki view, no drag)
// ---------------------------------------------------------------------------

function StaticEntityRow({
  entity,
  worldId,
  isActive,
  onEntityClick,
  onDeleteEntity,
}: {
  entity: Entity;
  worldId: string;
  isActive?: boolean;
  onEntityClick: (entityId: string) => void;
  onDeleteEntity: (entityId: string) => void;
}) {
  const entityColor = entity.color || ENTITY_TYPE_COLORS[entity.entity_type];
  const typeLabel =
    entity.custom_type_label || ENTITY_TYPE_LABELS[entity.entity_type];

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          onClick={() => onEntityClick(entity.id)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-[5px] text-left transition-colors",
            "hover:bg-white/[0.04]",
            isActive && "bg-primary/[0.08] border-l-2 border-primary"
          )}
        >
          {/* Color dot */}
          <ColorDotPicker
            color={entityColor}
            entityId={entity.id}
            entityType={entity.entity_type}
            worldId={worldId}
          />

          {/* Entity name */}
          <span className="flex-1 min-w-0 font-sans text-[13px] text-t2 truncate">
            {entity.name}
          </span>

          {/* Type badge */}
          <span
            className="shrink-0 font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm border"
            style={{
              color: entityColor,
              borderColor: `${entityColor}26`,
              backgroundColor: `${entityColor}0F`,
            }}
          >
            {typeLabel}
          </span>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44 bg-[#0D1117] border-sf-border">
        <ContextMenuItem
          onClick={() => onEntityClick(entity.id)}
          className="text-xs gap-2"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDeleteEntity(entity.id)}
          className="text-xs gap-2 text-sf-crimson focus:text-sf-crimson"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ---------------------------------------------------------------------------
// Drag Preview
// ---------------------------------------------------------------------------

function DragPreviewRow({ entity }: { entity: Entity }) {
  const entityColor = entity.color || ENTITY_TYPE_COLORS[entity.entity_type];
  return (
    <div className="flex items-center gap-2 px-3 py-[5px] bg-sf-surface-elevated border border-primary/20 shadow-lg shadow-primary/5">
      <GripVertical className="w-3 h-3 text-primary/60 shrink-0" />
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: entityColor }}
      />
      <span className="text-[13px] font-sans text-t1 truncate">
        {entity.name}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cascade Group (Tool view)
// ---------------------------------------------------------------------------

function CascadeGroup({
  stage,
  entities,
  worldId,
  onEntityClick,
  onDeleteEntity,
}: {
  stage: CascadeStage;
  entities: Entity[];
  worldId: string;
  onEntityClick: (entityId: string) => void;
  onDeleteEntity: (entityId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const updateEntity = useUpdateEntity(worldId);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggingId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggingId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      // Find new index and update sort_order
      const oldIndex = entities.findIndex((e) => e.id === active.id);
      const newIndex = entities.findIndex((e) => e.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      updateEntity.mutate({ id: active.id as string, sort_order: newIndex });
    },
    [entities, updateEntity]
  );

  const draggingEntity = draggingId
    ? entities.find((e) => e.id === draggingId)
    : null;

  const stageColor = CASCADE_STAGE_COLORS[stage];

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="sf-fill-sweep sf-fill-sweep--secondary w-full flex items-center gap-1.5 px-3 py-1.5 text-left"
      >
        {expanded ? (
          <ChevronDown className="w-2.5 h-2.5 text-t3/40 shrink-0" />
        ) : (
          <ChevronRight className="w-2.5 h-2.5 text-t3/40 shrink-0" />
        )}
        <span
          className="font-heading text-[11px] uppercase tracking-[3px] flex-1"
          style={{ color: stageColor }}
        >
          {CASCADE_STAGE_LABELS[stage]}
        </span>
        <span className="font-mono text-[10px] text-t3/30">
          {entities.length}
        </span>
      </button>

      {expanded && entities.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={entities.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            {entities.map((entity) => (
              <SortableEntityRow
                key={entity.id}
                entity={entity}
                worldId={worldId}
                onEntityClick={onEntityClick}
                onDeleteEntity={onDeleteEntity}
              />
            ))}
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
            {draggingEntity ? (
              <DragPreviewRow entity={draggingEntity} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {expanded && entities.length === 0 && (
        <p className="px-3 py-1.5 text-[10px] text-t3/25 italic">
          No entities.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EntitySidebar Component
// ---------------------------------------------------------------------------

const EntitySidebar = ({
  worldId,
  onEntityClick,
  onCreateEntity,
  onDeleteEntity,
}: EntitySidebarProps) => {
  const { data: entities, isLoading, error } = useEntities(worldId);

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      return (
        (localStorage.getItem(`sf-entity-sidebar-view-${worldId}`) as ViewMode) ||
        "tool"
      );
    } catch {
      return "tool";
    }
  });

  const [searchQuery, setSearchQuery] = useState("");

  const handleViewChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      localStorage.setItem(`sf-entity-sidebar-view-${worldId}`, mode);
    },
    [worldId]
  );

  // Filter entities by search
  const filtered = useMemo(() => {
    if (!entities) return [];
    if (!searchQuery.trim()) return entities;
    const q = searchQuery.toLowerCase();
    return entities.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.entity_type.toLowerCase().includes(q) ||
        (e.summary && e.summary.toLowerCase().includes(q)) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [entities, searchQuery]);

  // Tool view: group by cascade stage
  const cascadeGroups = useMemo(() => {
    if (viewMode !== "tool") return null;
    const groups: Record<CascadeStage, Entity[]> = {
      physics: [],
      environment: [],
      biology: [],
      psychology: [],
      mythology: [],
      culture: [],
    };
    for (const entity of filtered) {
      groups[entity.cascade_stage].push(entity);
    }
    // Sort within each group by sort_order
    for (const stage of CASCADE_STAGES) {
      groups[stage].sort((a, b) => a.sort_order - b.sort_order);
    }
    return groups;
  }, [filtered, viewMode]);

  // Wiki view: alphabetical flat list
  const alphabeticalList = useMemo(() => {
    if (viewMode !== "wiki") return null;
    return [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [filtered, viewMode]);

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader size="sm" />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="p-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-sf-crimson/60">
          Entity data unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Create Entity button */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={onCreateEntity}
          className="sf-fill-sweep sf-fill-sweep--secondary w-full flex items-center justify-center gap-1.5 px-3 py-1.5 border border-sf-border text-[10px] font-heading uppercase tracking-wider text-t3/40 hover:text-primary/60 hover:border-primary/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Create Entity
        </button>
      </div>

      {/* Search input */}
      <div className="px-3 py-1.5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-t4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entities..."
            className="w-full bg-white/4 border border-white/10 rounded-xs pl-7 pr-2 py-1.5 text-[12px] font-sans text-t2 placeholder:text-t5 focus:border-teal/35 outline-none"
          />
        </div>
      </div>

      {/* View mode toggle */}
      <div className="px-3 pb-1 flex items-center gap-1">
        <button
          onClick={() => handleViewChange("tool")}
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-[1.5px] transition-colors",
            viewMode === "tool"
              ? "text-teal bg-teal/8 border border-teal/20"
              : "text-t4 hover:text-t3"
          )}
          title="Group by cascade stage"
        >
          <Layers className="w-3 h-3" />
          Tool
        </button>
        <button
          onClick={() => handleViewChange("wiki")}
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-[1.5px] transition-colors",
            viewMode === "wiki"
              ? "text-teal bg-teal/8 border border-teal/20"
              : "text-t4 hover:text-t3"
          )}
          title="Alphabetical list"
        >
          <AlignJustify className="w-3 h-3" />
          Wiki
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {/* Tool view: cascade groups */}
        {viewMode === "tool" &&
          cascadeGroups &&
          CASCADE_STAGES.map((stage) => (
            <CascadeGroup
              key={stage}
              stage={stage}
              entities={cascadeGroups[stage]}
              worldId={worldId}
              onEntityClick={onEntityClick}
              onDeleteEntity={onDeleteEntity}
            />
          ))}

        {/* Wiki view: alphabetical flat list */}
        {viewMode === "wiki" && alphabeticalList && (
          <div>
            {alphabeticalList.length === 0 ? (
              <p className="px-3 py-4 text-center text-[10px] text-t3/25 italic">
                {searchQuery ? "No matches found." : "No entities yet."}
              </p>
            ) : (
              alphabeticalList.map((entity) => (
                <StaticEntityRow
                  key={entity.id}
                  entity={entity}
                  worldId={worldId}
                  onEntityClick={onEntityClick}
                  onDeleteEntity={onDeleteEntity}
                />
              ))
            )}
          </div>
        )}

        {/* No results in tool view */}
        {viewMode === "tool" &&
          cascadeGroups &&
          searchQuery &&
          Object.values(cascadeGroups).every((g) => g.length === 0) && (
            <div className="px-3 py-6 text-center">
              <p className="font-mono text-[10px] uppercase tracking-wider text-t3/30">
                No matches found
              </p>
            </div>
          )}
      </div>

      {/* Entity count footer */}
      <div className="px-3 py-2 border-t border-sf-border">
        <span className="font-mono text-[9px] uppercase tracking-wider text-t3/30">
          {entities?.length ?? 0} entities
        </span>
      </div>
    </div>
  );
};

export default EntitySidebar;
