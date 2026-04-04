import { useState, useMemo } from "react";
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
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CASCADE_STAGES,
  CASCADE_STAGE_LABELS,
  CASCADE_STAGE_COLORS,
  CONNECTION_STATUSES,
  RELATIONSHIP_TYPES_BY_STAGE,
  formatRelationshipType,
  type CascadeStage,
  type ConnectionCascadeStage,
  type ConnectionStatus,
} from "@/services/entity-graph-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ConnectionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ConnectionFormData) => void;
  sourceName: string;
  targetName: string;
  initialData?: Partial<ConnectionFormData>;
  mode?: "create" | "edit";
}

export interface ConnectionFormData {
  relationship_type: string;
  relationship_label: string;
  cascade_stage: ConnectionCascadeStage;
  bidirectional: boolean;
  strength: number;
  status: ConnectionStatus;
  time_start: string;
  time_end: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConnectionModal({
  open,
  onClose,
  onSubmit,
  sourceName,
  targetName,
  initialData,
  mode = "create",
}: ConnectionModalProps) {
  const [cascadeStage, setCascadeStage] = useState<ConnectionCascadeStage>(
    initialData?.cascade_stage ?? "culture"
  );
  const [relationshipType, setRelationshipType] = useState(
    initialData?.relationship_type ?? ""
  );
  const [relationshipLabel, setRelationshipLabel] = useState(
    initialData?.relationship_label ?? ""
  );
  const [bidirectional, setBidirectional] = useState(
    initialData?.bidirectional ?? false
  );
  const [strength, setStrength] = useState(initialData?.strength ?? 5);
  const [status, setStatus] = useState<ConnectionStatus>(
    initialData?.status ?? "active"
  );
  const [timeStart, setTimeStart] = useState(initialData?.time_start ?? "");
  const [timeEnd, setTimeEnd] = useState(initialData?.time_end ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  const availableTypes = useMemo(() => {
    return RELATIONSHIP_TYPES_BY_STAGE[cascadeStage] ?? [];
  }, [cascadeStage]);

  const handleSubmit = () => {
    if (!relationshipType) return;
    onSubmit({
      relationship_type: relationshipType,
      relationship_label: relationshipLabel,
      cascade_stage: cascadeStage,
      bidirectional,
      strength,
      status,
      time_start: timeStart,
      time_end: timeEnd,
      notes,
    });
    onClose();
  };

  const stageColor =
    CASCADE_STAGE_COLORS[cascadeStage as CascadeStage] ?? "#FFB800";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-[480px] border-border/30"
        style={{
          background: "rgba(15,15,16,0.98)",
          backdropFilter: "blur(20px)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-sm font-light uppercase tracking-[2px] text-tier-1">
            {mode === "create" ? "New Connection" : "Edit Connection"}
          </DialogTitle>
        </DialogHeader>

        {/* Source → Target display */}
        <div className="flex items-center gap-2 py-2">
          <span className="text-xs font-mono text-tier-2 truncate max-w-[140px]">
            {sourceName}
          </span>
          <span className="text-tier-4 text-[10px]">
            {bidirectional ? "< - >" : "- - >"}
          </span>
          <span className="text-xs font-mono text-tier-2 truncate max-w-[140px]">
            {targetName}
          </span>
        </div>

        <div className="space-y-4">
          {/* Cascade Stage */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-[1.5px] text-tier-3">
              Cascade Stage
            </Label>
            <Select
              value={cascadeStage}
              onValueChange={(v) => {
                setCascadeStage(v as ConnectionCascadeStage);
                setRelationshipType("");
              }}
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
                <SelectItem value="cross_cascade" className="text-xs">
                  <span style={{ color: "#FFB800" }}>Cross-Cascade</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Relationship Type */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-[1.5px] text-tier-3">
              Relationship Type
            </Label>
            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger className="h-9 text-xs rounded-xs">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {availableTypes.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {formatRelationshipType(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Display Label */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-[1.5px] text-tier-3">
              Display Label
            </Label>
            <Input
              value={relationshipLabel}
              onChange={(e) => setRelationshipLabel(e.target.value)}
              placeholder="Optional custom label..."
              className="h-9 text-xs rounded-xs"
            />
          </div>

          {/* Direction */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-[1.5px] text-tier-3">
              Direction
            </Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setBidirectional(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-[1.2px] font-sans border transition-colors ${
                  !bidirectional
                    ? "border-teal/25 bg-teal/10 text-teal"
                    : "border-border/20 text-tier-4 hover:text-tier-3"
                }`}
              >
                One-way
              </button>
              <button
                type="button"
                onClick={() => setBidirectional(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-[1.2px] font-sans border transition-colors ${
                  bidirectional
                    ? "border-teal/25 bg-teal/10 text-teal"
                    : "border-border/20 text-tier-4 hover:text-tier-3"
                }`}
              >
                Mutual
              </button>
            </div>
          </div>

          {/* Strength Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium uppercase tracking-[1.5px] text-tier-3">
                Strength
              </Label>
              <span className="text-[11px] font-mono" style={{ color: stageColor }}>
                {strength}
              </span>
            </div>
            <Slider
              value={[strength]}
              onValueChange={([v]) => setStrength(v)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-[1.5px] text-tier-3">
              Status
            </Label>
            <div className="flex flex-wrap gap-2">
              {CONNECTION_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-2.5 py-1 text-[10px] uppercase tracking-[1.2px] font-sans border transition-colors ${
                    status === s
                      ? "border-teal/25 bg-teal/10 text-teal"
                      : "border-border/20 text-tier-4 hover:text-tier-3"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Temporal bounds */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium uppercase tracking-[1.5px] text-tier-3">
                Time Start
              </Label>
              <Input
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                placeholder="e.g. Year 412"
                className="h-9 text-xs rounded-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium uppercase tracking-[1.5px] text-tier-3">
                Time End
              </Label>
              <Input
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                placeholder="e.g. Year 600"
                className="h-9 text-xs rounded-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-[1.5px] text-tier-3">
              Notes
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this connection..."
              className="text-xs rounded-xs min-h-[60px] resize-none"
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
            disabled={!relationshipType}
            className="text-xs font-sans"
          >
            {mode === "create" ? "Create Connection" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
