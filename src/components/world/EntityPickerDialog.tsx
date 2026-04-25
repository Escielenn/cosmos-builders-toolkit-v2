import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  Sun,
  Dna,
  Swords,
  User,
  Cpu,
  MapPin,
  Gem,
  Rocket,
  Languages,
  Flame,
  Shapes,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StellarForgeEditor } from "@/components/editor/StellarForgeEditor";
import {
  CREATABLE_ENTITY_TYPES,
  ENTITY_TYPE_LABELS,
  type CreatableEntityType,
} from "@/lib/entity-config";
import { useCreateEntityEntry } from "@/hooks/use-world-entities";

// ---------------------------------------------------------------------------
// Icon lookup
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EntityPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EntityPickerDialog({
  open,
  onOpenChange,
  worldId,
}: EntityPickerDialogProps) {
  const navigate = useNavigate();
  const createEntity = useCreateEntityEntry(worldId);

  const [step, setStep] = useState<"pick" | "details">("pick");
  const [selectedType, setSelectedType] = useState<CreatableEntityType | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const reset = () => {
    setStep("pick");
    setSelectedType(null);
    setName("");
    setDescription("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleTypePick = (type: CreatableEntityType) => {
    setSelectedType(type);
    setStep("details");
  };

  const handleCreate = async () => {
    if (!selectedType || !name.trim()) return;

    try {
      const entry = await createEntity.mutateAsync({
        title: name.trim(),
        entryType: selectedType,
        description: description.trim(),
      });

      handleOpenChange(false);
      navigate(`/worlds/${worldId}/pages/${entry.id}`);
    } catch {
      // Error toast is handled by the mutation's onError callback
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {step === "pick" ? (
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
              {CREATABLE_ENTITY_TYPES.map((type) => {
                const Icon = ICON_MAP[type] ?? Shapes;
                const label = ENTITY_TYPE_LABELS[type] ?? type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypePick(type)}
                    className="flex flex-col items-center gap-1.5 p-3 border border-sf-border bg-white/[0.02] hover:bg-primary/5 hover:border-primary/20 transition-colors group"
                  >
                    <Icon className="w-5 h-5 text-t3/40 group-hover:text-primary/60 transition-colors" />
                    <span className="text-[10px] font-heading uppercase tracking-wider text-tier-3 group-hover:text-tier-2 transition-colors">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl tracking-wider flex items-center gap-2">
                {selectedType && ICON_MAP[selectedType] && (() => {
                  const Icon = ICON_MAP[selectedType];
                  return <Icon className="w-4 h-4 text-primary" />;
                })()}
                NEW {(ENTITY_TYPE_LABELS[selectedType!] ?? "Element").toUpperCase()}
              </DialogTitle>
              <DialogDescription>
                Give your {ENTITY_TYPE_LABELS[selectedType!]?.toLowerCase() ?? "element"} a name.
                You can add details later.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="entity-name">Name</Label>
                <Input
                  id="entity-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`e.g., ${getPlaceholder(selectedType!)}`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && name.trim()) handleCreate();
                  }}
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
                  placeholder="A brief description of this element..."
                  worldId={worldId}
                  minHeight="80px"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("pick")}>
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || createEntity.isPending}
              >
                {createEntity.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Placeholder examples
// ---------------------------------------------------------------------------

function getPlaceholder(type: CreatableEntityType): string {
  const placeholders: Record<string, string> = {
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
  return placeholders[type] ?? "My Element";
}
