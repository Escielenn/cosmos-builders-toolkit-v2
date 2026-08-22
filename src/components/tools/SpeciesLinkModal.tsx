import { useState, useEffect, useMemo } from "react";
import { Dna, Import, RefreshCw, Check, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorksheetsByType, useWorksheet } from "@/hooks/use-worksheets";
import { mapEvoBioToXenomyth, type MappedField } from "@/lib/field-mappings";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SpeciesLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  onImport: (
    mappedFields: MappedField[],
    worksheetId: string,
    speciesName: string
  ) => void;
  currentLinkedWorksheetId?: string;
}

const SpeciesLinkModal = ({
  open,
  onOpenChange,
  worldId,
  onImport,
  currentLinkedWorksheetId,
}: SpeciesLinkModalProps) => {
  const { data: evoBioWorksheets, isLoading } = useWorksheetsByType(
    worldId,
    "evolutionary-biology"
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    currentLinkedWorksheetId || null
  );
  const [previewData, setPreviewData] = useState<MappedField[]>([]);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  // Fetch the selected worksheet data
  const { data: selectedWorksheet } = useWorksheet(selectedId || undefined);

  // When worksheet selected, compute preview
  useEffect(() => {
    if (selectedWorksheet?.data) {
      const mapped = mapEvoBioToXenomyth(
        selectedWorksheet.data as Record<string, unknown>
      );
      setPreviewData(mapped);

      // Select all non-empty fields by default
      const nonEmptyFields = new Set(
        mapped.filter((m) => m.value !== undefined && m.value !== "").map((m) => m.target)
      );
      setSelectedFields(nonEmptyFields);
    } else {
      setPreviewData([]);
      setSelectedFields(new Set());
    }
  }, [selectedWorksheet]);

  // Reset selection when modal opens
  useEffect(() => {
    if (open) {
      setSelectedId(currentLinkedWorksheetId || null);
    }
  }, [open, currentLinkedWorksheetId]);

  const selectedWorksheetData = useMemo(() => {
    if (!selectedId || !evoBioWorksheets) return null;
    return evoBioWorksheets.find((w) => w.id === selectedId);
  }, [selectedId, evoBioWorksheets]);

  const speciesName = useMemo(() => {
    if (!selectedWorksheet?.data) return "Unnamed Species";
    const data = selectedWorksheet.data as Record<string, unknown>;
    return (data.speciesName as string) || selectedWorksheet.title || "Unnamed Species";
  }, [selectedWorksheet]);

  const fieldsWithValues = previewData.filter(
    (f) => f.value !== undefined && f.value !== ""
  );
  const fieldsWithoutValues = previewData.filter(
    (f) => f.value === undefined || f.value === ""
  );

  const handleImport = () => {
    if (!selectedId) return;

    // Filter to only selected fields
    const fieldsToImport = previewData.filter((f) =>
      selectedFields.has(f.target)
    );

    onImport(fieldsToImport, selectedId, speciesName);
    onOpenChange(false);
  };

  const toggleField = (target: string) => {
    const next = new Set(selectedFields);
    if (next.has(target)) {
      next.delete(target);
    } else {
      next.add(target);
    }
    setSelectedFields(next);
  };

  const selectAll = () => {
    setSelectedFields(new Set(fieldsWithValues.map((f) => f.target)));
  };

  const selectNone = () => {
    setSelectedFields(new Set());
  };

  const formatValue = (value: unknown): string => {
    if (value === undefined || value === null) return "";
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dna className="w-5 h-5 text-sf-emerald" />
            Link Species from Evolutionary Biology
          </DialogTitle>
          <DialogDescription>
            Select a species to import biological data into this mythology
            framework. The imported data will pre-fill relevant fields.
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
              <div className="text-sm text-t3 p-4 border border-dashed rounded-none text-center">
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
                      (data?.speciesName as string) || "Unnamed Species";
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
          {selectedId && previewData.length > 0 && (
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
                          key={field.target}
                          className="flex items-start gap-3 p-2 rounded-none hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedFields.has(field.target)}
                            onCheckedChange={() => toggleField(field.target)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">
                              {field.label}
                            </div>
                            <div className="text-xs text-t3 truncate">
                              {formatValue(field.value)}
                            </div>
                          </div>
                          {selectedFields.has(field.target) && (
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
                          key={field.target}
                          className="flex items-start gap-3 p-2 rounded-none opacity-50"
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
          {selectedId && selectedWorksheetData && (
            <div className="p-3 bg-sf-emerald/10 border border-sf-emerald rounded-none">
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
          >
            <Import className="w-4 h-4 mr-2" />
            Import {selectedFields.size} Fields
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SpeciesLinkModal;
