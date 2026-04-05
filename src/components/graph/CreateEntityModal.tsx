import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StellarForgeEditor } from "@/components/editor/StellarForgeEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ENTITY_TYPES,
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_CASCADE_DEFAULTS,
  CASCADE_STAGES,
  CASCADE_STAGE_LABELS,
  CASCADE_STAGE_COLORS,
  type EntityType,
  type CascadeStage,
} from "@/services/entity-graph-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CreateEntityModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEntityFormData) => void;
}

export interface CreateEntityFormData {
  name: string;
  entity_type: EntityType;
  custom_type_label?: string;
  cascade_stage: CascadeStage;
  summary?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateEntityModal({
  open,
  onClose,
  onSubmit,
}: CreateEntityModalProps) {
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("planet");
  const [cascadeStage, setCascadeStage] = useState<CascadeStage>("physics");
  const [customTypeLabel, setCustomTypeLabel] = useState("");
  const [summary, setSummary] = useState("");

  const handleTypeChange = (type: EntityType) => {
    setEntityType(type);
    setCascadeStage(ENTITY_TYPE_CASCADE_DEFAULTS[type]);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      entity_type: entityType,
      custom_type_label: entityType === "custom" ? customTypeLabel : undefined,
      cascade_stage: cascadeStage,
      summary: summary || undefined,
    });
    // Reset form
    setName("");
    setEntityType("planet");
    setCascadeStage("physics");
    setCustomTypeLabel("");
    setSummary("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-[420px] border-border/30"
        style={{
          background: "rgba(15,15,16,0.98)",
          backdropFilter: "blur(20px)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-sm font-light uppercase tracking-[2px] text-tier-1">
            New Entity
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-[1.5px] text-tier-3">
              Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Keth, The Venn, Commander Voss..."
              className="h-9 text-xs rounded-xs"
              autoFocus
            />
          </div>

          {/* Entity Type */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-[1.5px] text-tier-3">
              Type
            </Label>
            <Select value={entityType} onValueChange={(v) => handleTypeChange(v as EntityType)}>
              <SelectTrigger className="h-9 text-xs rounded-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {ENTITY_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom type label */}
          {entityType === "custom" && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium uppercase tracking-[1.5px] text-tier-3">
                Custom Type Label
              </Label>
              <Input
                value={customTypeLabel}
                onChange={(e) => setCustomTypeLabel(e.target.value)}
                placeholder="e.g. Trade Route, Weather Pattern..."
                className="h-9 text-xs rounded-xs"
              />
            </div>
          )}

          {/* Cascade Stage */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-[1.5px] text-tier-3">
              Cascade Stage
            </Label>
            <Select
              value={cascadeStage}
              onValueChange={(v) => setCascadeStage(v as CascadeStage)}
            >
              <SelectTrigger className="h-9 text-xs rounded-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CASCADE_STAGES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    <span style={{ color: CASCADE_STAGE_COLORS[s] }}>
                      {CASCADE_STAGE_LABELS[s]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-[1.5px] text-tier-3">
              Summary
            </Label>
            <StellarForgeEditor
              content={summary}
              onChange={setSummary}
              preset="compact"
              placeholder="One-line description for graph tooltips..."
              minHeight="50px"
            />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-xs font-sans"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="text-xs font-sans"
          >
            Create Entity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
