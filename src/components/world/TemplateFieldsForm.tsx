// ---------------------------------------------------------------------------
// TemplateFieldsForm, render an editable form driven by a template's
// field schema. Values are held as a simple key→value record and passed
// back via onChange.
//
// Used in the CreateElementDialog (when a user picks a template) and in
// the entity detail view (to edit stored _custom values).
//
// Field types supported:
//   text, longtext, number, select, multiselect, boolean, date
//   entity_ref, temporarily rendered as a text input (holds the UUID
//   manually); a proper entity picker will land with A3c extended.
// ---------------------------------------------------------------------------

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EntityTypeField } from "@/hooks/use-entity-type-templates";

export type CustomFieldValue =
  | string
  | number
  | boolean
  | string[]
  | null;

export type CustomFieldValues = Record<string, CustomFieldValue>;

export interface TemplateFieldsFormProps {
  fields: EntityTypeField[];
  values: CustomFieldValues;
  onChange: (next: CustomFieldValues) => void;
  disabled?: boolean;
}

export function TemplateFieldsForm({
  fields,
  values,
  onChange,
  disabled,
}: TemplateFieldsFormProps) {
  const set = (key: string, value: CustomFieldValue) => {
    onChange({ ...values, [key]: value });
  };

  if (fields.length === 0) {
    return (
      <div className="text-xs text-t4 italic">
        This template has no fields defined.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fields.map((f) => {
        const v = values[f.field_key];
        const id = `tf-${f.id}`;
        const required = f.required;
        const labelEl = (
          <Label htmlFor={id} className="flex items-center gap-1">
            {f.label}
            {required && <span className="text-sf-crimson">*</span>}
          </Label>
        );
        const helpEl = f.help_text ? (
          <p className="text-[11px] text-t4 mt-0.5">{f.help_text}</p>
        ) : null;

        switch (f.field_type) {
          case "text":
            return (
              <div key={f.id} className="space-y-1">
                {labelEl}
                <Input
                  id={id}
                  value={typeof v === "string" ? v : ""}
                  onChange={(e) => set(f.field_key, e.target.value)}
                  disabled={disabled}
                  placeholder={f.placeholder ?? undefined}
                  required={required}
                />
                {helpEl}
              </div>
            );

          case "longtext":
            return (
              <div key={f.id} className="space-y-1">
                {labelEl}
                <Textarea
                  id={id}
                  value={typeof v === "string" ? v : ""}
                  onChange={(e) => set(f.field_key, e.target.value)}
                  disabled={disabled}
                  placeholder={f.placeholder ?? undefined}
                  required={required}
                  rows={3}
                />
                {helpEl}
              </div>
            );

          case "number":
            return (
              <div key={f.id} className="space-y-1">
                {labelEl}
                <Input
                  id={id}
                  type="number"
                  value={typeof v === "number" ? v : typeof v === "string" ? v : ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    set(f.field_key, raw === "" ? null : Number(raw));
                  }}
                  disabled={disabled}
                  placeholder={f.placeholder ?? undefined}
                  required={required}
                />
                {helpEl}
              </div>
            );

          case "boolean":
            return (
              <div key={f.id} className="flex items-start gap-2 py-1">
                <Checkbox
                  id={id}
                  checked={v === true}
                  onCheckedChange={(checked) => set(f.field_key, !!checked)}
                  disabled={disabled}
                />
                <div>
                  <Label htmlFor={id} className="cursor-pointer">
                    {f.label}
                  </Label>
                  {helpEl}
                </div>
              </div>
            );

          case "date":
            return (
              <div key={f.id} className="space-y-1">
                {labelEl}
                <Input
                  id={id}
                  type="date"
                  value={typeof v === "string" ? v : ""}
                  onChange={(e) => set(f.field_key, e.target.value)}
                  disabled={disabled}
                  required={required}
                />
                {helpEl}
              </div>
            );

          case "select":
            return (
              <div key={f.id} className="space-y-1">
                {labelEl}
                <Select
                  value={typeof v === "string" ? v : ""}
                  onValueChange={(val) => set(f.field_key, val)}
                  disabled={disabled}
                >
                  <SelectTrigger id={id}>
                    <SelectValue placeholder={f.placeholder ?? "Choose..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {helpEl}
              </div>
            );

          case "multiselect": {
            const arr = Array.isArray(v) ? v : [];
            return (
              <div key={f.id} className="space-y-1">
                {labelEl}
                <div className="flex flex-wrap gap-1.5">
                  {f.options.map((opt) => {
                    const isOn = arr.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          const next = isOn
                            ? arr.filter((x) => x !== opt)
                            : [...arr, opt];
                          set(f.field_key, next);
                        }}
                        className={
                          isOn
                            ? "text-xs px-2 py-1 border border-primary bg-primary/10 text-primary"
                            : "text-xs px-2 py-1 border border-white/10 text-t3 hover:border-primary/40"
                        }
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {helpEl}
              </div>
            );
          }

          case "entity_ref":
            return (
              <div key={f.id} className="space-y-1">
                {labelEl}
                <Input
                  id={id}
                  value={typeof v === "string" ? v : ""}
                  onChange={(e) => set(f.field_key, e.target.value)}
                  disabled={disabled}
                  placeholder="Paste entity UUID (picker coming soon)"
                  className="font-mono text-xs"
                />
                {helpEl}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
