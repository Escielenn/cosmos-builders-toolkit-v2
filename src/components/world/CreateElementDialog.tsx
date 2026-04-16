// ---------------------------------------------------------------------------
// CreateElementDialog — unified entity creation flow.
//
// Writes to the `entities` table (canonical model post-unification).
// Three-step flow:
//   1. Pick type (12 canonical types + Custom)
//   2. Basics (name, summary, optional description)
//   3. Next action (Run a tool / Open in graph / Close)
//
// Gated behind the UNIFIED_ENTITIES feature flag in callers.
// ---------------------------------------------------------------------------

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe, Sun, Dna, Swords, User, Cpu, MapPin, Gem, Rocket,
  Languages, Flame, Shapes, ArrowRight, Wrench, Layers, Check,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StellarForgeEditor } from "@/components/editor/StellarForgeEditor";
import {
  CREATABLE_ENTITY_TYPES,
  type CreatableEntityType,
  getToolsForEntityType,
} from "@/lib/entity-config";
import {
  ENTITY_TYPE_CASCADE_DEFAULTS,
  ENTITY_TYPE_COLORS,
  type EntityType,
} from "@/services/entity-graph-types";
import { useCreateEntity } from "@/hooks/use-entity-graph";
import {
  useEntityTypeTemplates,
  type EntityTypeTemplate,
} from "@/hooks/use-entity-type-templates";
import {
  TemplateFieldsForm,
  type CustomFieldValues,
} from "@/components/world/TemplateFieldsForm";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Type picker icons (same visual language as legacy dialog)
// ---------------------------------------------------------------------------

const ICON_MAP: Record<CreatableEntityType, LucideIcon> = {
  planet: Globe,
  star_system: Sun,
  species: Dna,
  faction: Swords,
  character: User,
  technology: Cpu,
  location: MapPin,
  artifact: Gem,
  vessel: Rocket,
  language: Languages,
  mythology: Flame,
  custom: Shapes,
};

const PICKER_LABELS: Record<CreatableEntityType, string> = {
  planet: "Planet",
  star_system: "Star System",
  species: "Species",
  faction: "Faction",
  character: "Character",
  technology: "Technology",
  location: "Location",
  artifact: "Artifact",
  vessel: "Vessel",
  language: "Language",
  mythology: "Mythology",
  custom: "Custom",
};

const PLACEHOLDERS: Record<CreatableEntityType, string> = {
  planet: "Kepler-442b",
  star_system: "Trappist-1",
  species: "Therapsid Sentients",
  faction: "Hegemony of Sol",
  character: "Commander Voss",
  technology: "Alcubierre Drive",
  location: "The Deep Reaches",
  artifact: "The Beacon",
  vessel: "ISV Prometheus",
  language: "Old Martian",
  mythology: "The Chorus",
  custom: "My Element",
};

// ---------------------------------------------------------------------------
// Tool display names (shared with EntityHoverCard — consider extracting later)
// ---------------------------------------------------------------------------

const TOOL_LABELS: Record<string, string> = {
  "planetary-profile": "Planetary Profile",
  "habitable-zone-calculator": "Habitable Zone",
  "surface-gravity-calculator": "Surface Gravity",
  "star-system-builder": "Star System Builder",
  "drake-equation-calculator": "Drake Equation",
  "evolutionary-biology": "Evolutionary Biology",
  "species-interaction-matrix": "Species Interaction",
  sensorium: "Sensorium",
  "empire-designer": "Empire Designer",
  "xenomythology-framework-builder": "Xenomythology",
  lexdrift: "LexDrift",
  "space-expansion-modeler": "Space Expansion",
  "propulsion-consequences-map": "Propulsion Consequences",
  "spacecraft-designer": "Spacecraft Designer",
  gravitas: "Gravitas",
  "time-dilation": "Time Dilation",
  "kardashev-scale": "Kardashev Scale",
  "one-big-lie": "The One Big Lie",
  "environmental-chain-reaction": "Environmental Chain",
  "technology-consequences": "Technology Consequences",
  timeline: "Timeline",
};

// ---------------------------------------------------------------------------
// CreatableEntityType → EntityType mapping
// (CreatableEntityType is the user-facing picker type; EntityType is what
//  the entities table stores. Two items diverge: star_system → star,
//  mythology → religion.)
// ---------------------------------------------------------------------------

function toEntityType(creatable: CreatableEntityType): EntityType {
  if (creatable === "star_system") return "star";
  if (creatable === "mythology") return "religion";
  return creatable as EntityType;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CreateElementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  /** Optional: prefill the type picker and skip to Basics step. */
  initialType?: CreatableEntityType;
}

type Step = "pick" | "basics" | "next";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CreateElementDialog({
  open,
  onOpenChange,
  worldId,
  initialType,
}: CreateElementDialogProps) {
  const navigate = useNavigate();
  const createEntity = useCreateEntity(worldId);
  const { data: templates = [] } = useEntityTypeTemplates(worldId);

  const [step, setStep] = useState<Step>(initialType ? "basics" : "pick");
  const [selectedType, setSelectedType] = useState<CreatableEntityType | null>(
    initialType ?? null
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<EntityTypeTemplate | null>(null);
  const [customLabel, setCustomLabel] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [templateValues, setTemplateValues] = useState<CustomFieldValues>({});
  const [createdEntityId, setCreatedEntityId] = useState<string | null>(null);

  const applicableTools = useMemo(
    () => (selectedType ? getToolsForEntityType(toEntityType(selectedType)) : []),
    [selectedType]
  );

  const reset = () => {
    setStep(initialType ? "basics" : "pick");
    setSelectedType(initialType ?? null);
    setSelectedTemplate(null);
    setCustomLabel("");
    setName("");
    setSummary("");
    setDescription("");
    setTemplateValues({});
    setCreatedEntityId(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleTypePick = (type: CreatableEntityType) => {
    setSelectedType(type);
    setSelectedTemplate(null);
    setStep("basics");
  };

  const handleTemplatePick = (template: EntityTypeTemplate) => {
    setSelectedTemplate(template);
    setSelectedType("custom");
    setCustomLabel(template.label);
    setTemplateValues({});
    setStep("basics");
  };

  const handleCreate = async () => {
    if (!selectedType || !name.trim()) return;
    const entityType = toEntityType(selectedType);

    // Build metadata payload — include template reference + _custom values
    // when a template is active.
    const metadata: Record<string, unknown> = {};
    if (selectedTemplate) {
      metadata._template_id = selectedTemplate.id;
      metadata._template_key = selectedTemplate.type_key;
      metadata._custom = templateValues;
    }

    const created = await createEntity.mutateAsync({
      name: name.trim(),
      entity_type: entityType,
      custom_type_label:
        (selectedTemplate?.label ??
          (selectedType === "custom" && customLabel.trim() ? customLabel.trim() : null)),
      cascade_stage: ENTITY_TYPE_CASCADE_DEFAULTS[entityType],
      summary: summary.trim() || null,
      description: description.trim() || null,
      color: selectedTemplate?.color || ENTITY_TYPE_COLORS[entityType],
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });

    setCreatedEntityId(created.id);
    setStep("next");
  };

  const handleRunTool = (toolSlug: string) => {
    if (!createdEntityId) return;
    navigate(`/worlds/${worldId}/tools/${toolSlug}?entityId=${createdEntityId}`);
    handleOpenChange(false);
  };

  const handleOpenGraph = () => {
    if (!createdEntityId) return;
    navigate(`/worlds/${worldId}/connections?focus=${createdEntityId}`);
    handleOpenChange(false);
  };

  const handleClose = () => {
    handleOpenChange(false);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {step === "pick" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl tracking-wider">
                CREATE ELEMENT
              </DialogTitle>
              <DialogDescription>
                Choose the type of world element to create.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 py-4">
              {CREATABLE_ENTITY_TYPES.filter((t) => t !== "custom").map((type) => {
                const Icon = ICON_MAP[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypePick(type)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3",
                      "border border-border/10 bg-white/[0.02]",
                      "hover:bg-primary/5 hover:border-primary/20",
                      "transition-colors group"
                    )}
                  >
                    <Icon className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                    <span className="text-[10px] font-heading uppercase tracking-wider text-tier-3 group-hover:text-tier-2 transition-colors">
                      {PICKER_LABELS[type]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Your custom templates */}
            {templates.length > 0 && (
              <div className="pt-3 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-heading uppercase tracking-[1.5px] text-[#00FF88]">
                    Your custom types
                  </h3>
                  <a
                    href={`/worlds/${worldId}/custom-types`}
                    className="text-[10px] text-tier-4 hover:text-tier-2"
                  >
                    Manage →
                  </a>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTemplatePick(t)}
                      className="flex flex-col items-center gap-1.5 p-3 border border-border/10 bg-white/[0.02] hover:bg-primary/5 hover:border-primary/20 transition-colors"
                      title={t.description ?? undefined}
                    >
                      <Shapes
                        className="w-5 h-5 text-muted-foreground/40"
                        style={t.color ? { color: t.color } : undefined}
                      />
                      <span className="text-[10px] font-heading uppercase tracking-wider text-tier-3">
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom (ad-hoc, no template) button */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => handleTypePick("custom")}
                className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-white/10 text-tier-4 hover:text-tier-2 hover:border-primary/20 transition-colors"
              >
                <Shapes className="w-4 h-4" />
                <span className="text-[10px] font-heading uppercase tracking-wider">
                  One-off custom element
                </span>
              </button>
            </div>
          </>
        )}

        {step === "basics" && selectedType && (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl tracking-wider flex items-center gap-2">
                {selectedTemplate ? (
                  <Shapes
                    className="w-4 h-4"
                    style={
                      selectedTemplate.color
                        ? { color: selectedTemplate.color }
                        : { color: "hsl(var(--primary))" }
                    }
                  />
                ) : (() => {
                  const Icon = ICON_MAP[selectedType];
                  return <Icon className="w-4 h-4 text-primary" />;
                })()}
                NEW {(selectedTemplate?.label ?? PICKER_LABELS[selectedType]).toUpperCase()}
              </DialogTitle>
              <DialogDescription>
                Give your{" "}
                {(selectedTemplate?.label ?? PICKER_LABELS[selectedType]).toLowerCase()} a name
                {selectedTemplate && selectedTemplate.fields.length > 0
                  ? `, then fill in the ${selectedTemplate.fields.length} template field${selectedTemplate.fields.length === 1 ? "" : "s"}.`
                  : " and a short summary. You can add details later."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
              {selectedType === "custom" && !selectedTemplate && (
                <div className="space-y-2">
                  <Label htmlFor="entity-custom-label">
                    Custom type label{" "}
                    <span className="text-tier-4 font-normal normal-case tracking-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="entity-custom-label"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="e.g., Deity, Sword Style, Trading Route"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="entity-name">Name</Label>
                <Input
                  id="entity-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`e.g., ${PLACEHOLDERS[selectedType]}`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && name.trim() && !createEntity.isPending) {
                      handleCreate();
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entity-summary">
                  Summary{" "}
                  <span className="text-tier-4 font-normal normal-case tracking-normal">
                    (one line, optional)
                  </span>
                </Label>
                <Input
                  id="entity-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="A single line that shows in tooltips and cards"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entity-description">
                  Description{" "}
                  <span className="text-tier-4 font-normal normal-case tracking-normal">
                    (optional)
                  </span>
                </Label>
                <StellarForgeEditor
                  content={description}
                  onChange={setDescription}
                  preset="compact"
                  placeholder="A fuller description..."
                  worldId={worldId}
                  minHeight="80px"
                />
              </div>

              {/* Template-driven fields */}
              {selectedTemplate && selectedTemplate.fields.length > 0 && (
                <div className="pt-3 border-t border-white/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[10px] uppercase tracking-[1.5px] text-[#00FF88] font-heading">
                      {selectedTemplate.label} fields
                    </span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  <TemplateFieldsForm
                    fields={selectedTemplate.fields}
                    values={templateValues}
                    onChange={setTemplateValues}
                    disabled={createEntity.isPending}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              {!initialType && (
                <Button variant="outline" onClick={() => setStep("pick")}>
                  Back
                </Button>
              )}
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || createEntity.isPending}
              >
                {createEntity.isPending ? "Creating..." : "Create"}
                {!createEntity.isPending && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "next" && selectedType && (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl tracking-wider flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                {name.toUpperCase()} CREATED
              </DialogTitle>
              <DialogDescription>
                What would you like to do next?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-4">
              {applicableTools.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[1.5px] text-tier-3">
                    Run a tool on this {PICKER_LABELS[selectedType].toLowerCase()}
                  </Label>
                  <div className="flex flex-col gap-1.5">
                    {applicableTools.map((slug) => (
                      <Button
                        key={slug}
                        variant="outline"
                        className="justify-start h-9"
                        onClick={() => handleRunTool(slug)}
                      >
                        <Wrench className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                        {TOOL_LABELS[slug] ?? slug.replace(/-/g, " ")}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
                <Button
                  variant="ghost"
                  className="justify-start h-9"
                  onClick={handleOpenGraph}
                >
                  <Layers className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  Open in the world graph
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start h-9 text-tier-3"
                  onClick={handleClose}
                >
                  I'll fill it in later
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
