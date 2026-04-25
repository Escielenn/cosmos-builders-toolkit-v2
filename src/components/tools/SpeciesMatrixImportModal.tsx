import { useState, useEffect, useMemo } from "react";
import { Users, Import, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorksheetsByType, useWorksheet } from "@/hooks/use-worksheets";
import { mapSpeciesMatrixToEvoBio } from "@/lib/field-mappings";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Species {
  id: string;
  name: string;
  shortDescription: string;
  homeworld: string;
  physicalTraits: string;
  culturalTraits: string;
}

interface SpeciesMatrixImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  onImport: (data: {
    speciesName?: string;
    bodyPlanNotes?: string;
    socialNotes?: string;
    survivalPressuresNotes?: string;
  }) => void;
}

interface PreviewField {
  key: string;
  label: string;
  targetField: string;
  value: string;
}

const SpeciesMatrixImportModal = ({
  open,
  onOpenChange,
  worldId,
  onImport,
}: SpeciesMatrixImportModalProps) => {
  const { data: matrixWorksheets, isLoading } = useWorksheetsByType(
    worldId,
    "species-interaction-matrix"
  );
  const [selectedWorksheetId, setSelectedWorksheetId] = useState<string | null>(null);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(["speciesName", "bodyPlanNotes", "socialNotes", "survivalPressuresNotes"])
  );

  // Fetch the selected worksheet data
  const { data: selectedWorksheet } = useWorksheet(selectedWorksheetId || undefined);

  // Reset selection when modal opens
  useEffect(() => {
    if (open) {
      setSelectedWorksheetId(null);
      setSelectedSpeciesId(null);
      setSelectedFields(
        new Set(["speciesName", "bodyPlanNotes", "socialNotes", "survivalPressuresNotes"])
      );
    }
  }, [open]);

  // Reset species selection when worksheet changes
  useEffect(() => {
    setSelectedSpeciesId(null);
  }, [selectedWorksheetId]);

  // Get species list from selected worksheet
  const speciesList = useMemo(() => {
    if (!selectedWorksheet?.data) return [];
    const data = selectedWorksheet.data as { species?: Species[] };
    return (data.species || []).filter((s) => s.name);
  }, [selectedWorksheet]);

  // Get selected species
  const selectedSpecies = useMemo(() => {
    if (!selectedSpeciesId || !speciesList.length) return null;
    return speciesList.find((s) => s.id === selectedSpeciesId) || null;
  }, [selectedSpeciesId, speciesList]);

  // Preview fields
  const previewFields = useMemo((): PreviewField[] => {
    if (!selectedSpecies) return [];

    return [
      {
        key: "speciesName",
        label: "Species Name",
        targetField: "speciesName",
        value: selectedSpecies.name || "",
      },
      {
        key: "bodyPlanNotes",
        label: "Physical Traits → Body Plan Notes",
        targetField: "bodyPlan.bodyPlanNotes",
        value: selectedSpecies.physicalTraits || "",
      },
      {
        key: "socialNotes",
        label: "Cultural Traits → Social Notes",
        targetField: "social.socialNotes",
        value: selectedSpecies.culturalTraits || "",
      },
      {
        key: "survivalPressuresNotes",
        label: "Homeworld → Survival Pressures Notes",
        targetField: "foundations.survivalPressuresNotes",
        value: selectedSpecies.homeworld
          ? `Homeworld: ${selectedSpecies.homeworld}`
          : "",
      },
    ];
  }, [selectedSpecies]);

  const fieldsWithValues = previewFields.filter((f) => f.value);
  const fieldsWithoutValues = previewFields.filter((f) => !f.value);

  const handleImport = () => {
    if (!selectedSpecies) return;

    const importData: {
      speciesName?: string;
      bodyPlanNotes?: string;
      socialNotes?: string;
      survivalPressuresNotes?: string;
    } = {};

    if (selectedFields.has("speciesName") && selectedSpecies.name) {
      importData.speciesName = selectedSpecies.name;
    }
    if (selectedFields.has("bodyPlanNotes") && selectedSpecies.physicalTraits) {
      importData.bodyPlanNotes = selectedSpecies.physicalTraits;
    }
    if (selectedFields.has("socialNotes") && selectedSpecies.culturalTraits) {
      importData.socialNotes = selectedSpecies.culturalTraits;
    }
    if (selectedFields.has("survivalPressuresNotes") && selectedSpecies.homeworld) {
      importData.survivalPressuresNotes = `Homeworld: ${selectedSpecies.homeworld}`;
    }

    onImport(importData);
    onOpenChange(false);
  };

  const toggleField = (fieldKey: string) => {
    const next = new Set(selectedFields);
    if (next.has(fieldKey)) {
      next.delete(fieldKey);
    } else {
      next.add(fieldKey);
    }
    setSelectedFields(next);
  };

  const selectAll = () => {
    setSelectedFields(new Set(fieldsWithValues.map((f) => f.key)));
  };

  const selectNone = () => {
    setSelectedFields(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-500" />
            Import from Species Interaction Matrix
          </DialogTitle>
          <DialogDescription>
            Select a species from an existing interaction matrix to use as a
            starting point for your evolutionary biology design.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Worksheet Selector */}
          <div className="space-y-2">
            <Label>Select Worksheet</Label>
            {isLoading ? (
              <div className="text-sm text-t3">
                Loading worksheets...
              </div>
            ) : !matrixWorksheets || matrixWorksheets.length === 0 ? (
              <div className="text-sm text-t3 p-4 border border-dashed rounded-none text-center">
                No Species Interaction Matrix worksheets found in this world.
                <br />
                <span className="text-xs">
                  Create one in the Species Interaction Matrix tool first.
                </span>
              </div>
            ) : (
              <Select
                value={selectedWorksheetId || ""}
                onValueChange={(value) => setSelectedWorksheetId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a worksheet..." />
                </SelectTrigger>
                <SelectContent>
                  {matrixWorksheets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-pink-500" />
                        <span className="font-medium">{w.title || "Untitled"}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Species Selector */}
          {selectedWorksheetId && (
            <div className="space-y-2">
              <Label>Select Species</Label>
              {speciesList.length === 0 ? (
                <div className="text-sm text-t3 p-4 border border-dashed rounded-none text-center">
                  No named species found in this worksheet.
                </div>
              ) : (
                <Select
                  value={selectedSpeciesId || ""}
                  onValueChange={(value) => setSelectedSpeciesId(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a species..." />
                  </SelectTrigger>
                  <SelectContent>
                    {speciesList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-pink-500" />
                          <span className="font-medium">{s.name}</span>
                          {s.shortDescription && (
                            <span className="text-t3 text-sm truncate max-w-[200px]">
                              - {s.shortDescription}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Preview with Checkboxes */}
          {selectedSpecies && previewFields.length > 0 && (
            <div className="border rounded-none overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                <h4 className="font-medium text-sm">Fields to Import</h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAll}
                    className="text-xs h-7"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectNone}
                    className="text-xs h-7"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[250px]">
                <div className="p-3 space-y-2">
                  {/* Fields with values */}
                  {fieldsWithValues.length > 0 && (
                    <>
                      <div className="text-xs text-t3 uppercase tracking-wide mb-2">
                        Available Data ({fieldsWithValues.length})
                      </div>
                      {fieldsWithValues.map((field) => (
                        <label
                          key={field.key}
                          className="flex items-start gap-3 p-2 rounded-none hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedFields.has(field.key)}
                            onCheckedChange={() => toggleField(field.key)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{field.label}</div>
                            <div className="text-xs text-t3 line-clamp-2">
                              {field.value}
                            </div>
                          </div>
                          {selectedFields.has(field.key) && (
                            <Check className="w-4 h-4 text-pink-500 shrink-0" />
                          )}
                        </label>
                      ))}
                    </>
                  )}

                  {/* Fields without values */}
                  {fieldsWithoutValues.length > 0 && (
                    <>
                      <div className="text-xs text-t3 uppercase tracking-wide mt-4 mb-2">
                        Not Available ({fieldsWithoutValues.length})
                      </div>
                      {fieldsWithoutValues.map((field) => (
                        <div
                          key={field.key}
                          className="flex items-start gap-3 p-2 rounded-none opacity-50"
                        >
                          <Checkbox disabled className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">{field.label}</div>
                            <div className="text-xs text-t3 italic">
                              Not filled in species data
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Selected species summary */}
          {selectedSpecies && (
            <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-none">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-500" />
                <span className="font-medium text-pink-500">
                  {selectedSpecies.name}
                </span>
              </div>
              <p className="text-xs text-t3 mt-1">
                {selectedFields.size} of {fieldsWithValues.length} fields
                selected for import
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedSpecies || selectedFields.size === 0}
            className="bg-pink-600 hover:bg-pink-700"
          >
            <Import className="w-4 h-4 mr-2" />
            Import Species
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SpeciesMatrixImportModal;
