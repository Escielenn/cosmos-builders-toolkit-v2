import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, Pencil, X } from "lucide-react";
import { ENTITY_MASTER_FIELDS, type MasterFieldDef } from "@/lib/entity-config";
import { useUpdateEntityMetadata } from "@/hooks/use-world-entities";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EntityMasterInfoboxProps {
  entryId: string;
  entryType: string;
  worldId: string;
  metadata: Record<string, unknown>;
  canEdit: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EntityMasterInfobox({
  entryId,
  entryType,
  worldId,
  metadata,
  canEdit,
}: EntityMasterInfoboxProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const updateMetadata = useUpdateEntityMetadata(worldId);

  // Reset editing state when navigating to a different entity
  useEffect(() => {
    setEditing(false);
    setDraft({});
  }, [entryId]);

  const fields = ENTITY_MASTER_FIELDS[entryType];
  if (!fields || fields.length === 0) return null;

  const startEditing = () => {
    setDraft({ ...metadata });
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setDraft({});
  };

  const save = async () => {
    await updateMetadata.mutateAsync({ entryId, metadata: draft });
    setEditing(false);
  };

  const updateField = (key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  // Filter out fields that have no value and aren't being edited
  const visibleFields = editing
    ? fields
    : fields.filter((f) => {
        const val = metadata[f.key];
        return val !== undefined && val !== null && val !== "";
      });

  if (!editing && visibleFields.length === 0) {
    if (!canEdit) return null;
    return (
      <div className="space-y-2">
        <h3 className="font-heading text-xs font-light uppercase tracking-[3px] text-emerald">
          Details
        </h3>
        <button
          type="button"
          onClick={startEditing}
          className="text-[10px] text-tier-4 hover:text-primary/60 transition-colors flex items-center gap-1"
        >
          <Pencil className="w-3 h-3" />
          Add details
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-xs font-light uppercase tracking-[3px] text-emerald">
          Details
        </h3>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={startEditing}
            className="text-tier-4 hover:text-tier-2 transition-colors"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {(editing ? fields : visibleFields).map((field) =>
          editing ? (
            <EditableField
              key={field.key}
              field={field}
              value={draft[field.key]}
              onChange={(v) => updateField(field.key, v)}
            />
          ) : (
            <ReadOnlyField
              key={field.key}
              field={field}
              value={metadata[field.key]}
            />
          )
        )}
      </div>

      {editing && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            onClick={save}
            disabled={updateMetadata.isPending}
            className="gap-1 h-7 text-xs"
          >
            <Check className="w-3 h-3" />
            {updateMetadata.isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={cancel}
            className="gap-1 h-7 text-xs"
          >
            <X className="w-3 h-3" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ReadOnlyField({
  field,
  value,
}: {
  field: MasterFieldDef;
  value: unknown;
}) {
  if (field.key === "description") {
    return (
      <div className="col-span-2">
        <span className="text-[10px] font-medium uppercase tracking-[1.5px] text-tier-3">
          {field.label}
        </span>
        <p className="text-xs text-tier-2 mt-0.5 whitespace-pre-wrap">
          {String(value ?? "")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <span className="text-[10px] font-medium uppercase tracking-[1.5px] text-tier-3">
        {field.label}
      </span>
      <p className="font-mono text-xs text-tier-1 mt-0.5">
        {String(value ?? "—")}
      </p>
    </div>
  );
}

function EditableField({
  field,
  value,
  onChange,
}: {
  field: MasterFieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const stringVal = value != null ? String(value) : "";

  if (field.key === "description") {
    return (
      <div className="col-span-2 space-y-1">
        <Label className="text-[10px]">{field.label}</Label>
        <Textarea
          value={stringVal}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="text-xs"
        />
      </div>
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <div className="space-y-1">
        <Label className="text-[10px]">{field.label}</Label>
        <select
          value={stringVal}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-xs bg-white/[0.04] border border-border/10 rounded-xs px-2 py-1.5 text-tier-2"
        >
          <option value="">—</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label className="text-[10px]">{field.label}</Label>
      <Input
        type={field.type === "number" ? "number" : "text"}
        value={stringVal}
        onChange={(e) =>
          onChange(field.type === "number" ? Number(e.target.value) : e.target.value)
        }
        className="h-7 text-xs"
      />
    </div>
  );
}
