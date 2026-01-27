import { useState } from "react";
import { Link2, Download, AlertCircle, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Json } from "@/integrations/supabase/types";

interface ECRWorksheet {
  id: string;
  title: string | null;
  data: Json;
  updated_at: string;
}

// ECR FormState structure (simplified)
interface ECRFormState {
  parameter: {
    type: string;
    specificValue: string;
    mode: string;
    types?: string[];
    specificValues?: Record<string, string>;
  };
  level1: { responses: Record<string, string> };
  level2: { responses: Record<string, string> };
  level3: { responses: Record<string, string> };
  level4: { responses: Record<string, string> };
  level5: { responses: Record<string, string> };
  synthesis: Record<string, string>;
}

// Mapping from ECR parameter types to Xenomythology fields
const PARAMETER_MAPPINGS: Record<string, { field: string; transform: (value: string) => string }> = {
  gravity: {
    field: "planetaryConditions.planetType",
    transform: (v) => v === "high" ? "super-earth" : v === "low" ? "low-gravity" : "rocky-terrestrial",
  },
  rotation: {
    field: "planetaryConditions.dayNightCycle",
    transform: (v) => {
      if (v === "slow") return "long";
      if (v === "fast") return "regular";
      if (v === "locked") return "tidally-locked";
      return "regular";
    },
  },
  stellar: {
    field: "planetaryConditions.stellarEnvironment",
    transform: (v) => {
      if (v === "binary") return "binary";
      if (v === "reddwarf") return "m-class";
      if (v === "rogue") return "rogue";
      return "g-class";
    },
  },
  hydrosphere: {
    field: "planetaryConditions.planetType",
    transform: (v) => {
      if (v === "ocean") return "ocean-world";
      if (v === "desert") return "desert";
      return "rocky-terrestrial";
    },
  },
  atmosphere: {
    field: "planetaryConditions.atmosphericComposition",
    transform: (v) => {
      if (v === "thick") return "nitrogen-rich";
      if (v === "thin") return "thin";
      if (v === "exotic") return "methane-rich";
      return "oxygen-rich";
    },
  },
  tilt: {
    field: "planetaryConditions.seasonalVariation",
    transform: (v) => {
      if (v === "none") return "none";
      if (v === "extreme") return "extreme";
      if (v === "chaotic") return "chaotic";
      return "strong";
    },
  },
};

interface ImportFromECRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worksheets: ECRWorksheet[];
  onImport: (data: Partial<XenoFormState>, linkedWorksheetId?: string) => void;
}

// Simplified Xenomythology form state for import
interface XenoFormState {
  planetaryConditions: {
    planetType: string;
    atmosphericComposition: string;
    dayNightCycle: string;
    seasonalVariation: string;
    stellarEnvironment: string;
    skyAppearance: string;
    environmentalVolatility: string;
    geographicDiversity: string;
  };
  _linkedWorksheets?: {
    ecrWorksheetId?: string;
    lastSyncedAt?: string;
  };
}

const ImportFromECRModal = ({
  open,
  onOpenChange,
  worksheets,
  onImport,
}: ImportFromECRModalProps) => {
  const [selectedWorksheetId, setSelectedWorksheetId] = useState<string | null>(null);
  const [linkWorksheet, setLinkWorksheet] = useState(true);
  const [previewExpanded, setPreviewExpanded] = useState(false);

  const selectedWorksheet = worksheets.find(w => w.id === selectedWorksheetId);
  const ecrData = selectedWorksheet?.data as ECRFormState | undefined;

  // Generate preview of what will be imported
  const getImportPreview = () => {
    if (!ecrData) return [];

    const preview: { field: string; value: string; from: string }[] = [];

    // Single parameter mode
    if (ecrData.parameter.mode === "single" && ecrData.parameter.type) {
      const mapping = PARAMETER_MAPPINGS[ecrData.parameter.type];
      if (mapping) {
        preview.push({
          field: mapping.field.split(".")[1] || mapping.field,
          value: mapping.transform(ecrData.parameter.specificValue || ecrData.parameter.type),
          from: `${ecrData.parameter.type}: ${ecrData.parameter.specificValue || "selected"}`,
        });
      }
    }

    // Multiple parameter mode
    if (ecrData.parameter.mode === "multiple" && ecrData.parameter.types) {
      for (const type of ecrData.parameter.types) {
        const mapping = PARAMETER_MAPPINGS[type];
        if (mapping) {
          const specificValue = ecrData.parameter.specificValues?.[type] || type;
          preview.push({
            field: mapping.field.split(".")[1] || mapping.field,
            value: mapping.transform(specificValue),
            from: `${type}: ${specificValue}`,
          });
        }
      }
    }

    // Add sky appearance from synthesis if available
    if (ecrData.synthesis?.storyPotential) {
      preview.push({
        field: "skyAppearance",
        value: "(Will populate sky description hints)",
        from: "ECR synthesis",
      });
    }

    return preview;
  };

  const handleImport = () => {
    if (!ecrData || !selectedWorksheetId) return;

    const importData: Partial<XenoFormState> = {
      planetaryConditions: {
        planetType: "",
        atmosphericComposition: "",
        dayNightCycle: "",
        seasonalVariation: "",
        stellarEnvironment: "",
        skyAppearance: "",
        environmentalVolatility: "",
        geographicDiversity: "",
      },
    };

    // Apply mappings
    if (ecrData.parameter.mode === "single" && ecrData.parameter.type) {
      const mapping = PARAMETER_MAPPINGS[ecrData.parameter.type];
      if (mapping) {
        const fieldName = mapping.field.split(".")[1] as keyof XenoFormState["planetaryConditions"];
        if (fieldName && importData.planetaryConditions) {
          importData.planetaryConditions[fieldName] = mapping.transform(
            ecrData.parameter.specificValue || ecrData.parameter.type
          );
        }
      }
    }

    if (ecrData.parameter.mode === "multiple" && ecrData.parameter.types) {
      for (const type of ecrData.parameter.types) {
        const mapping = PARAMETER_MAPPINGS[type];
        if (mapping) {
          const fieldName = mapping.field.split(".")[1] as keyof XenoFormState["planetaryConditions"];
          const specificValue = ecrData.parameter.specificValues?.[type] || type;
          if (fieldName && importData.planetaryConditions) {
            importData.planetaryConditions[fieldName] = mapping.transform(specificValue);
          }
        }
      }
    }

    // Add linked worksheet info if requested
    if (linkWorksheet) {
      importData._linkedWorksheets = {
        ecrWorksheetId: selectedWorksheetId,
        lastSyncedAt: new Date().toISOString(),
      };
    }

    onImport(importData, linkWorksheet ? selectedWorksheetId : undefined);
    onOpenChange(false);
  };

  const preview = getImportPreview();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Import from Environmental Chain Reaction
          </DialogTitle>
          <DialogDescription>
            Pull environmental parameters from a completed ECR worksheet into your Xenomythology framework.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {worksheets.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No Environmental Chain Reaction worksheets found for this world.</p>
              <p className="text-sm mt-1">Complete an ECR worksheet first to import data.</p>
            </div>
          ) : (
            <>
              {/* Worksheet Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Worksheet</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {worksheets.map((worksheet) => (
                    <button
                      key={worksheet.id}
                      onClick={() => setSelectedWorksheetId(worksheet.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        selectedWorksheetId === worksheet.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {worksheet.title || "Untitled ECR"}
                        </span>
                        {selectedWorksheetId === worksheet.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Updated {new Date(worksheet.updated_at).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Import Preview */}
              {selectedWorksheetId && preview.length > 0 && (
                <Collapsible open={previewExpanded} onOpenChange={setPreviewExpanded}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                      <span className="text-sm font-medium">
                        Preview ({preview.length} field{preview.length !== 1 ? "s" : ""})
                      </span>
                      {previewExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 p-2 bg-muted/30 rounded-lg mt-2">
                      {preview.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{item.field}:</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.value}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Link Option */}
              {selectedWorksheetId && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <Checkbox
                    id="link-worksheet"
                    checked={linkWorksheet}
                    onCheckedChange={(checked) => setLinkWorksheet(checked === true)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="link-worksheet"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Link worksheets together
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Changes in the ECR worksheet will be reflected here. You'll see a "Linked" indicator.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedWorksheetId || preview.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Import Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportFromECRModal;
