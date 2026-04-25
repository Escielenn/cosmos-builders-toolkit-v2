import { useState, useEffect, useMemo } from "react";
import { Dna, Import, Check } from "lucide-react";
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
import {
  mapEvoBioToSpeciesMatrix,
  EVOBIO_TO_MATRIX_PREVIEW_FIELDS,
  type SpeciesMatrixSpecies,
} from "@/lib/field-mappings";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EvoBioImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  onImport: (species: Partial<SpeciesMatrixSpecies>) => void;
}

const EvoBioImportModal = ({
  open,
  onOpenChange,
  worldId,
  onImport,
}: EvoBioImportModalProps) => {
  const { data: evoBioWorksheets, isLoading } = useWorksheetsByType(
    worldId,
    "evolutionary-biology"
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(["name", "shortDescription", "homeworld", "physicalTraits", "culturalTraits"])
  );

  // Fetch the selected worksheet data
  const { data: selectedWorksheet } = useWorksheet(selectedId || undefined);

  // Reset selection when modal opens
  useEffect(() => {
    if (open) {
      setSelectedId(null);
      setSelectedFields(
        new Set(["name", "shortDescription", "homeworld", "physicalTraits", "culturalTraits"])
      );
    }
  }, [open]);

  const mappedSpecies = useMemo(() => {
    if (!selectedWorksheet?.data) return null;
    return mapEvoBioToSpeciesMatrix(
      selectedWorksheet.data as Record<string, unknown>,
      selectedWorksheet.title
    );
  }, [selectedWorksheet]);

  const speciesName = useMemo(() => {
    if (!selectedWorksheet?.data) return "Unnamed Species";
    const data = selectedWorksheet.data as Record<string, unknown>;
    return (
      (data.speciesName as string) || selectedWorksheet.title || "Unnamed Species"
    );
  }, [selectedWorksheet]);

  const previewFields = useMemo(() => {
    if (!selectedWorksheet?.data) return [];

    return EVOBIO_TO_MATRIX_PREVIEW_FIELDS.map((field) => ({
      ...field,
      value: field.getValue(selectedWorksheet.data as Record<string, unknown>),
    }));
  }, [selectedWorksheet]);

  const fieldsWithValues = previewFields.filter((f) => f.value);
  const fieldsWithoutValues = previewFields.filter((f) => !f.value);

  const handleImport = () => {
    if (!mappedSpecies) return;

    // Filter to only selected fields
    const importData: Partial<SpeciesMatrixSpecies> = {};
    if (selectedFields.has("name") && mappedSpecies.name) {
      importData.name = mappedSpecies.name;
    }
    if (selectedFields.has("shortDescription") && mappedSpecies.shortDescription) {
      importData.shortDescription = mappedSpecies.shortDescription;
    }
    if (selectedFields.has("homeworld") && mappedSpecies.homeworld) {
      importData.homeworld = mappedSpecies.homeworld;
    }
    if (selectedFields.has("physicalTraits") && mappedSpecies.physicalTraits) {
      importData.physicalTraits = mappedSpecies.physicalTraits;
    }
    if (selectedFields.has("culturalTraits") && mappedSpecies.culturalTraits) {
      importData.culturalTraits = mappedSpecies.culturalTraits;
    }

    onImport(importData);
    onOpenChange(false);
  };

  const toggleField = (fieldName: string) => {
    const next = new Set(selectedFields);
    if (next.has(fieldName)) {
      next.delete(fieldName);
    } else {
      next.add(fieldName);
    }
    setSelectedFields(next);
  };

  const selectAll = () => {
    setSelectedFields(
      new Set(fieldsWithValues.map((f) => f.targetField))
    );
  };

  const selectNone = () => {
    setSelectedFields(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dna className="w-5 h-5 text-sf-emerald" />
            Import Species from Evolutionary Biology
          </DialogTitle>
          <DialogDescription>
            Select a species design to import into the Species Interaction
            Matrix. The imported data will pre-fill the species fields.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Species Selector */}
          <div className="space-y-2">
            <Label>Select Species</Label>
            {isLoading ? (
              <div className="text-sm text-t3">
                Loading species...
              </div>
            ) : !evoBioWorksheets || evoBioWorksheets.length === 0 ? (
              <div className="text-sm text-t3 p-4 border border-dashed rounded-lg text-center">
                No species worksheets found in this world.
                <br />
                <span className="text-xs">
                  Create one in the Evolutionary Biology tool first.
                </span>
              </div>
            ) : (
              <Select
                value={selectedId || ""}
                onValueChange={(value) => setSelectedId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a species..." />
                </SelectTrigger>
                <SelectContent>
                  {evoBioWorksheets.map((w) => {
                    const data = w.data as Record<string, unknown>;
                    const name =
                      (data?.speciesName as string) || w.title || "Unnamed Species";
                    return (
                      <SelectItem key={w.id} value={w.id}>
                        <div className="flex items-center gap-2">
                          <Dna className="w-4 h-4 text-sf-emerald" />
                          <span className="font-medium">{name}</span>
                          {w.title && w.title !== name && (
                            <span className="text-t3 text-sm">
                              ({w.title})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Preview with Checkboxes */}
          {selectedId && previewFields.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
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

              <ScrollArea className="h-[300px]">
                <div className="p-3 space-y-2">
                  {/* Fields with values */}
                  {fieldsWithValues.length > 0 && (
                    <>
                      <div className="text-xs text-t3 uppercase tracking-wide mb-2">
                        Available Data ({fieldsWithValues.length})
                      </div>
                      {fieldsWithValues.map((field) => (
                        <label
                          key={field.targetField}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedFields.has(field.targetField)}
                            onCheckedChange={() => toggleField(field.targetField)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">
                              {field.label}
                            </div>
                            <div className="text-xs text-t3 line-clamp-2">
                              {field.value}
                            </div>
                          </div>
                          {selectedFields.has(field.targetField) && (
                            <Check className="w-4 h-4 text-sf-emerald shrink-0" />
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
                          key={field.targetField}
                          className="flex items-start gap-3 p-2 rounded-lg opacity-50"
                        >
                          <Checkbox disabled className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">{field.label}</div>
                            <div className="text-xs text-t3 italic">
                              Not filled in species design
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
          {selectedId && mappedSpecies && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Dna className="w-4 h-4 text-sf-emerald" />
                <span className="font-medium text-sf-emerald">
                  {speciesName}
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
            disabled={!selectedId || selectedFields.size === 0}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Import className="w-4 h-4 mr-2" />
            Import Species
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EvoBioImportModal;
