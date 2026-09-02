// ---------------------------------------------------------------------------
// WorldCustomTypes, manage user-defined entity types for a world.
//
// Route: /worlds/:worldId/custom-types
// Lets the user create named templates (e.g. "Deity") and define the
// fields every entity of that type will carry.
//
// This is the A3b surface of the unified-elements plan.
// ---------------------------------------------------------------------------

import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  Plus,
  Shapes,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMetaTags } from "@/hooks/use-meta-tags";
import {
  useEntityTypeTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useCreateTemplateField,
  useUpdateTemplateField,
  useDeleteTemplateField,
  type EntityTypeField,
  type EntityTypeTemplate,
} from "@/hooks/use-entity-type-templates";
import { TemplateFieldEditor } from "@/components/world/TemplateFieldEditor";
import { cn } from "@/lib/utils";

function slugifyKey(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorldCustomTypes() {
  const { worldId } = useParams<{ worldId: string }>();

  useMetaTags({ title: "Custom Element Types" });

  const { data: templates = [], isLoading } = useEntityTypeTemplates(worldId);
  const createTemplate = useCreateTemplate(worldId);
  const updateTemplate = useUpdateTemplate(worldId);
  const deleteTemplate = useDeleteTemplate(worldId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newTemplateLabel, setNewTemplateLabel] = useState("");

  const selected = useMemo<EntityTypeTemplate | null>(
    () => templates.find((t) => t.id === selectedId) ?? null,
    [templates, selectedId]
  );

  const handleCreateTemplate = async () => {
    const label = newTemplateLabel.trim();
    if (!label) return;
    const type_key = slugifyKey(label);
    if (!type_key) return;
    const result = await createTemplate.mutateAsync({
      type_key,
      label,
    });
    if (result?.id) setSelectedId(result.id);
    setNewTemplateLabel("");
  };

  const handleDeleteTemplate = (t: EntityTypeTemplate) => {
    if (!window.confirm(
      `Delete type "${t.label}"?\n\nEntities created from this template will keep their data but will no longer reference this template's schema.`
    )) return;
    deleteTemplate.mutate(t.id);
    if (selectedId === t.id) setSelectedId(null);
  };

  if (!worldId) return null;

  return (
    <div className="min-h-screen bg-[hsl(222_30%_5%)]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/worlds/${worldId}`}
            className="inline-flex items-center gap-1 text-xs text-t4 hover:text-t2 mb-3"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> ← RETURN TO WORLD
          </Link>
          <h1 className="font-display text-3xl md:text-4xl tracking-[0.08em] text-t1 mb-1">
            CUSTOM ELEMENT TYPES
          </h1>
          <p className="text-sm text-t3 max-w-2xl">
            Define your own element types with custom fields. Every entity
            created from a template will carry these fields, great for homebrew
            concepts like sword styles, deities, trading routes, or anything
            unique to your world.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
          {/* Sidebar: list of templates */}
          <aside className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={newTemplateLabel}
                onChange={(e) => setNewTemplateLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTemplate();
                }}
                placeholder="New template name..."
                className="h-9"
              />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleCreateTemplate}
                disabled={!newTemplateLabel.trim() || createTemplate.isPending}
                aria-label="Create template"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="border-t border-sf-line pt-2 space-y-0.5">
              {isLoading && (
                <div className="text-xs text-t4 p-2">Loading...</div>
              )}
              {!isLoading && templates.length === 0 && (
                <div className="p-3 text-xs text-t4 border border-dashed border-sf-line text-center">
                  <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  No custom types yet.
                  <br />
                  Name one above and press +.
                </div>
              )}
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 border-l-2 text-left group",
                    selectedId === t.id
                      ? "border-primary bg-primary/[0.06]"
                      : "border-transparent hover:bg-white/[0.03]"
                  )}
                >
                  <Shapes
                    className={cn(
                      "w-3.5 h-3.5 shrink-0",
                      selectedId === t.id ? "text-primary" : "text-t4"
                    )}
                    style={t.color ? { color: t.color } : undefined}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "text-sm truncate",
                        selectedId === t.id ? "text-t1 font-medium" : "text-t2"
                      )}
                    >
                      {t.label}
                    </div>
                    <div className="text-[12px] font-mono text-t4">
                      {t.type_key} · {t.fields.length} field{t.fields.length === 1 ? "" : "s"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Main: selected template editor */}
          <main className="min-h-[400px]">
            {selected ? (
              <TemplateDetailEditor
                key={selected.id}
                worldId={worldId}
                template={selected}
                onUpdateMeta={(patch) =>
                  updateTemplate.mutate({ id: selected.id, ...patch })
                }
                onDelete={() => handleDeleteTemplate(selected)}
              />
            ) : (
              <div className="h-full min-h-[400px] flex items-center justify-center border border-dashed border-sf-line p-8">
                <div className="text-center max-w-sm">
                  <Shapes className="w-10 h-10 mx-auto mb-3 text-t4 opacity-40" />
                  <h3 className="font-heading text-sm uppercase tracking-[2px] text-t2 mb-2">
                    No template selected
                  </h3>
                  <p className="text-xs text-t4">
                    Create or pick a template on the left to edit its fields.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TemplateDetailEditor, right-pane editor for one template
// ---------------------------------------------------------------------------

interface TemplateDetailEditorProps {
  worldId: string;
  template: EntityTypeTemplate;
  onUpdateMeta: (
    patch: Partial<
      Pick<EntityTypeTemplate, "label" | "description" | "icon" | "color" | "base_entity_type">
    >
  ) => void;
  onDelete: () => void;
}

function TemplateDetailEditor({
  worldId,
  template,
  onUpdateMeta,
  onDelete,
}: TemplateDetailEditorProps) {
  const createField = useCreateTemplateField(worldId);
  const updateField = useUpdateTemplateField(worldId);
  const deleteField = useDeleteTemplateField(worldId);

  const [labelDraft, setLabelDraft] = useState(template.label);
  const [descDraft, setDescDraft] = useState(template.description ?? "");
  const [colorDraft, setColorDraft] = useState(template.color ?? "#15C17B");

  const handleBlurLabel = () => {
    const v = labelDraft.trim();
    if (v && v !== template.label) onUpdateMeta({ label: v });
  };
  const handleBlurDesc = () => {
    if (descDraft !== (template.description ?? "")) {
      onUpdateMeta({ description: descDraft || null });
    }
  };
  const handleBlurColor = () => {
    if (colorDraft !== template.color) onUpdateMeta({ color: colorDraft || null });
  };

  const handleAddField = async () => {
    const nextSort = template.fields.length;
    const keyBase = "field";
    // Generate a unique field_key
    let i = nextSort + 1;
    let key = `${keyBase}_${i}`;
    while (template.fields.some((f) => f.field_key === key)) {
      i += 1;
      key = `${keyBase}_${i}`;
    }
    await createField.mutateAsync({
      template_id: template.id,
      field_key: key,
      label: "New field",
      field_type: "text",
      sort_order: nextSort,
    });
  };

  const handleFieldChange = (field: EntityTypeField, patch: Partial<EntityTypeField>) => {
    updateField.mutate({ id: field.id, ...patch });
  };

  const handleFieldDelete = (field: EntityTypeField) => {
    if (!window.confirm(`Delete field "${field.label}"?`)) return;
    deleteField.mutate(field.id);
  };

  return (
    <div className="space-y-5">
      {/* Template meta */}
      <div className="border border-sf-line bg-white/[0.02] p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-[12px] font-heading uppercase tracking-[2px] text-t4 mb-1">
              Template
            </div>
            <div className="text-[12px] font-mono text-t4">
              key: {template.type_key}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-xs text-t4 hover:text-sf-crimson"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete template
          </Button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="t-label" className="text-[12px] uppercase tracking-[1.5px] text-t4">
              Display label
            </Label>
            <Input
              id="t-label"
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              onBlur={handleBlurLabel}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="t-desc" className="text-[12px] uppercase tracking-[1.5px] text-t4">
              Description{" "}
              <span className="text-t4 font-normal normal-case tracking-normal">(optional)</span>
            </Label>
            <Input
              id="t-desc"
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={handleBlurDesc}
              placeholder="What is this type for?"
              className="h-9"
            />
          </div>
          <div className="space-y-1 max-w-[160px]">
            <Label htmlFor="t-color" className="text-[12px] uppercase tracking-[1.5px] text-t4">
              Accent color
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="t-color"
                type="color"
                value={colorDraft}
                onChange={(e) => setColorDraft(e.target.value)}
                onBlur={handleBlurColor}
                className="h-9 w-9 bg-transparent border border-sf-line cursor-pointer"
                aria-label="Template accent color"
              />
              <Input
                value={colorDraft}
                onChange={(e) => setColorDraft(e.target.value)}
                onBlur={handleBlurColor}
                className="h-9 font-mono text-xs"
                placeholder="#15C17B"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-heading text-sm uppercase tracking-[2px] text-sf-emerald-text">
              Fields
            </h3>
            <p className="text-xs text-t4 mt-0.5">
              Every {template.label.toLowerCase()} entity will carry these fields.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddField}
            disabled={createField.isPending}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add field
          </Button>
        </div>

        {template.fields.length === 0 ? (
          <div className="border border-dashed border-sf-line p-6 text-center">
            <p className="text-xs text-t4">
              No fields yet. Add one to define the schema.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {template.fields.map((f) => (
              <TemplateFieldEditor
                key={f.id}
                field={f}
                onChange={(patch) => handleFieldChange(f, patch)}
                onDelete={() => handleFieldDelete(f)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
