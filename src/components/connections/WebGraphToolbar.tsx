// ---------------------------------------------------------------------------
// WebGraphToolbar — the filter bar Brief F3 item 3 asks for:
// entity type, edge type, epoch, plus the cascade toggles and search that
// were already written for the retired /connections route.
//
// Every control narrows the same query. Nothing here creates a second view.
// ---------------------------------------------------------------------------

import { Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CascadeFilterBar } from "./CascadeFilterBar";
import { GraphSearch } from "./GraphSearch";
import {
  ENTITY_TYPE_LABELS,
  formatRelationshipType,
  type CascadeStage,
  type Entity,
  type EntityType,
} from "@/services/entity-graph-types";

export const ALL_FILTER = "__all__";

interface WebGraphToolbarProps {
  entities: Entity[];
  activeStages: Set<CascadeStage>;
  onStagesChange: (stages: Set<CascadeStage>) => void;
  /** Entity types present in this world, so the menu never offers an empty filter. */
  availableTypes: EntityType[];
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  availableEdgeTypes: string[];
  edgeFilter: string;
  onEdgeFilterChange: (value: string) => void;
  onHighlight: (entityId: string | null) => void;
  onFocusEntity: (entityId: string) => void;
  epochOpen: boolean;
  onToggleEpoch: () => void;
  onCreateEntity: () => void;
}

export function WebGraphToolbar({
  entities,
  activeStages,
  onStagesChange,
  availableTypes,
  typeFilter,
  onTypeFilterChange,
  availableEdgeTypes,
  edgeFilter,
  onEdgeFilterChange,
  onHighlight,
  onFocusEntity,
  epochOpen,
  onToggleEpoch,
  onCreateEntity,
}: WebGraphToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <CascadeFilterBar activeStages={activeStages} onChange={onStagesChange} />

      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger
          aria-label="Filter by entity type"
          className="h-11 w-[150px] rounded-none border-sf-line bg-sf-surface text-[13px]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_FILTER}>All kinds</SelectItem>
          {availableTypes.map((t) => (
            <SelectItem key={t} value={t}>
              {ENTITY_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={edgeFilter} onValueChange={onEdgeFilterChange}>
        <SelectTrigger
          aria-label="Filter by relation"
          className="h-11 w-[170px] rounded-none border-sf-line bg-sf-surface text-[13px]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_FILTER}>All relations</SelectItem>
          {availableEdgeTypes.map((t) => (
            <SelectItem key={t} value={t}>
              {formatRelationshipType(t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <GraphSearch
        entities={entities}
        onHighlight={onHighlight}
        onFocusEntity={onFocusEntity}
      />

      <Button
        type="button"
        variant={epochOpen ? "secondary" : "outline"}
        onClick={onToggleEpoch}
        aria-pressed={epochOpen}
        className="h-11 rounded-none font-sans text-[12px] uppercase tracking-[1.2px]"
      >
        <Clock className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        Epoch
      </Button>

      <Button
        type="button"
        onClick={onCreateEntity}
        className="ml-auto h-11 rounded-none font-sans text-[12px] uppercase tracking-[1.2px]"
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        New entity
      </Button>
    </div>
  );
}
