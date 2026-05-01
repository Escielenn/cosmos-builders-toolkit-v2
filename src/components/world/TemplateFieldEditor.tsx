// ---------------------------------------------------------------------------
// TemplateFieldEditor, inline editor for a single field on a template.
//
// Rendered inside the template row on the WorldCustomTypes page.
// Handles label, field_type, options (for select/multiselect), required,
// and help text. Deleting a field is confirmed via a simple prompt.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  EntityTypeField,
  CustomFieldType,
} from "@/hooks/use-entity-type-templates";

const FIELD_TYPE_OPTIONS: { value: CustomFieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "longtext", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Single choice" },
  { value: "multiselect", label: "Multiple choice" },
  { value: "boolean", label: "Yes / No" },
  { value: "date", label: "Date" },
  { value: "entity_ref", label: "Entity reference" },
];

export interface TemplateFieldEditorProps {
  field: EntityTypeField;
  disabled?: boolean;
  onChange: (patch: Partial<EntityTypeField>) => void;
  onDelete: () => void;
}

export function TemplateFieldEditor({
  field,
  disabled,
  onChange,
  onDelete,
}: TemplateFieldEditorProps) {
  const [optionsInput, setOptionsInput] = useState<string>(
    field.options.join(", ")
  );

  const usesOptions =
    field.field_type === "select" || field.field_type === "multiselect";

  const commitOptions = () => {
    const next = optionsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({ options: next });
  };

  return (
    <div className="border border-white/10 bg-white/[0.02] p-3 flex items-start gap-2">
      <GripVertical className="w-3.5 h-3.5 mt-2 text-t5 shrink-0" />

      <div className="flex-1 space-y-2 min-w-0">
        {/* Row 1: label + field_type */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor={`f-label-${field.id}`} className="text-[10px] uppercase tracking-[1.5px] text-t4">
              Label
            </Label>
            <Input
              id={`f-label-${field.id}`}
              value={field.label}
              onChange={(e) => onChange({ label: e.target.value })}
              disabled={disabled}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`f-type-${field.id}`} className="text-[10px] uppercase tracking-[1.5px] text-t4">
              Type
            </Label>
            <Select
              value={field.field_type}
              onValueChange={(v) => onChange({ field_type: v as CustomFieldType })}
              disabled={disabled}
            >
              <SelectTrigger id={`f-type-${field.id}`} className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: key + required */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor={`f-key-${field.id}`} className="text-[10px] uppercase tracking-[1.5px] text-t4">
              Key
              <span className="text-t5 font-mono normal-case tracking-normal ml-1">
                (programmatic, a-z 0-9 _)
              </span>
            </Label>
            <Input
              id={`f-key-${field.id}`}
              value={field.field_key}
              onChange={(e) =>
                onChange({ field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })
              }
              disabled={disabled}
              className="h-8 text-sm font-mono"
            />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <Checkbox
              id={`f-req-${field.id}`}
              checked={field.required}
              onCheckedChange={(v) => onChange({ required: !!v })}
              disabled={disabled}
            />
            <Label htmlFor={`f-req-${field.id}`} className="text-xs text-t2 cursor-pointer">
              Required field
            </Label>
          </div>
        </div>

        {/* Row 3 (conditional): options for select/multiselect */}
        {usesOptions && (
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-[1.5px] text-t4">
              Options
              <span className="text-t5 font-mono normal-case tracking-normal ml-1">
                (comma-separated)
              </span>
            </Label>
            <Input
              value={optionsInput}
              onChange={(e) => setOptionsInput(e.target.value)}
              onBlur={commitOptions}
              disabled={disabled}
              placeholder="Option A, Option B, Option C"
              className="h-8 text-sm"
            />
          </div>
        )}

        {/* Help text (optional) */}
        <div className="space-y-1">
          <Label htmlFor={`f-help-${field.id}`} className="text-[10px] uppercase tracking-[1.5px] text-t4">
            Help text{" "}
            <span className="text-t5 font-normal normal-case tracking-normal">(optional)</span>
          </Label>
          <Input
            id={`f-help-${field.id}`}
            value={field.help_text ?? ""}
            onChange={(e) => onChange({ help_text: e.target.value || null })}
            disabled={disabled}
            placeholder="Shown under the input when filling this field"
            className="h-8 text-sm"
          />
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-t4 hover:text-sf-crimson"
        onClick={onDelete}
        disabled={disabled}
        aria-label="Delete field"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
