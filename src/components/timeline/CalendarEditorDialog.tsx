import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Plus, Trash2, GripVertical, CalendarDays } from "lucide-react";
import type { CustomCalendar, CalendarUnit } from "@/lib/timeline/types";
import { useTimeline } from "@/lib/timeline/context";
import { cn } from "@/lib/utils";

interface CalendarEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCalendar?: CustomCalendar | null;
}

const emptyUnit = (): CalendarUnit => ({
  name: "",
  plural: "",
  abbreviation: "",
  subunitsPerUnit: 1,
});

const CalendarEditorDialog = ({
  open,
  onOpenChange,
  editingCalendar,
}: CalendarEditorDialogProps) => {
  const { state, dispatch } = useTimeline();

  const [name, setName] = useState("");
  const [epochLabel, setEpochLabel] = useState("");
  const [baseYearOffset, setBaseYearOffset] = useState("0");
  const [units, setUnits] = useState<CalendarUnit[]>([]);
  const [showList, setShowList] = useState(!editingCalendar);

  useEffect(() => {
    if (open) {
      if (editingCalendar) {
        setName(editingCalendar.name);
        setEpochLabel(editingCalendar.epochLabel || "");
        setBaseYearOffset(String(editingCalendar.baseYearOffset));
        setUnits([...editingCalendar.units]);
        setShowList(false);
      } else {
        setName("");
        setEpochLabel("");
        setBaseYearOffset("0");
        setUnits([
          { name: "Year", plural: "Years", abbreviation: "Y", subunitsPerUnit: 12 },
          { name: "Month", plural: "Months", abbreviation: "M", subunitsPerUnit: 30 },
          { name: "Day", plural: "Days", abbreviation: "D", subunitsPerUnit: 1 },
        ]);
        setShowList(state.calendars.length > 0);
      }
    }
  }, [open, editingCalendar, state.calendars.length]);

  const handleAddUnit = () => {
    setUnits((prev) => [...prev, emptyUnit()]);
  };

  const handleRemoveUnit = (index: number) => {
    setUnits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUnitChange = (index: number, field: keyof CalendarUnit, value: string | number) => {
    setUnits((prev) =>
      prev.map((u, i) =>
        i === index ? { ...u, [field]: value } : u
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || units.length === 0) return;

    // Ensure all units have valid names
    const validUnits = units.filter((u) => u.name.trim());
    if (validUnits.length === 0) return;

    if (editingCalendar) {
      dispatch({
        type: "UPDATE_CALENDAR",
        payload: {
          ...editingCalendar,
          name: name.trim(),
          epochLabel: epochLabel.trim() || undefined,
          baseYearOffset: Number(baseYearOffset) || 0,
          units: validUnits,
        },
      });
    } else {
      dispatch({
        type: "CREATE_CALENDAR",
        payload: {
          name: name.trim(),
          epochLabel: epochLabel.trim() || undefined,
          baseYearOffset: Number(baseYearOffset) || 0,
          units: validUnits,
        },
      });
    }
    onOpenChange(false);
  };

  const handleDelete = (calendarId: string) => {
    dispatch({ type: "DELETE_CALENDAR", payload: calendarId });
  };

  const handleEdit = (calendar: CustomCalendar) => {
    setName(calendar.name);
    setEpochLabel(calendar.epochLabel || "");
    setBaseYearOffset(String(calendar.baseYearOffset));
    setUnits([...calendar.units]);
    setShowList(false);
  };

  // ─── List view (when calendars exist and not editing) ──────────────

  if (showList && !editingCalendar) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Custom Calendars</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {state.calendars.length === 0 && (
              <p className="text-sm text-t3 text-center py-4">
                No custom calendars yet. Create one to use alien or fictional date systems.
              </p>
            )}
            {state.calendars.map((cal) => (
              <GlassPanel key={cal.id} className="p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{cal.name}</p>
                  <p className="text-xs text-t3">
                    {cal.units.map((u) => u.name).join(" > ")}
                    {cal.epochLabel && ` (${cal.epochLabel})`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    onClick={() => handleEdit(cal)}
                    aria-label="Edit calendar"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-sf-crimson hover:text-sf-crimson"
                    onClick={() => handleDelete(cal.id)}
                    aria-label="Delete calendar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </GlassPanel>
            ))}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => setShowList(false)}>
              <Plus className="w-4 h-4 mr-2" />
              New Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Editor view ───────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCalendar ? "Edit Calendar" : "Create Calendar"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="cal-name">Calendar Name</Label>
            <Input
              id="cal-name"
              placeholder="e.g., Hegemony Standard Calendar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Epoch Label + Base Year Offset */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cal-epoch">Epoch Label</Label>
              <Input
                id="cal-epoch"
                placeholder="e.g., AF, HE"
                value={epochLabel}
                onChange={(e) => setEpochLabel(e.target.value)}
              />
              <span className="text-[12px] text-t3 block">
                Suffix shown after dates (optional)
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cal-offset">Earth Year Offset</Label>
              <Input
                id="cal-offset"
                type="number"
                placeholder="0"
                value={baseYearOffset}
                onChange={(e) => setBaseYearOffset(e.target.value)}
              />
              <span className="text-[12px] text-t3 block">
                Calendar Year 0 = Earth Year X
              </span>
            </div>
          </div>

          {/* Units */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Time Units (largest to smallest)</Label>
              <Button type="button" variant="ghost" size="sm" onClick={handleAddUnit}>
                <Plus className="w-3 h-3 mr-1" />
                Add Unit
              </Button>
            </div>

            <div className="space-y-2">
              {units.map((unit, index) => (
                <div
                  key={index}
                  className={cn(
                    "grid grid-cols-[auto_1fr_1fr_60px_60px_auto] gap-1.5 items-center",
                    "p-2 rounded-md border border-sf-border bg-muted/10"
                  )}
                >
                  <GripVertical className="w-3.5 h-3.5 text-t3/50" />
                  <Input
                    placeholder="Name"
                    value={unit.name}
                    onChange={(e) => handleUnitChange(index, "name", e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Plural"
                    value={unit.plural}
                    onChange={(e) => handleUnitChange(index, "plural", e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Abbr"
                    value={unit.abbreviation}
                    onChange={(e) => handleUnitChange(index, "abbreviation", e.target.value)}
                    className="h-8 text-xs"
                  />
                  {index < units.length - 1 ? (
                    <Input
                      type="number"
                      min={1}
                      placeholder="Sub"
                      value={unit.subunitsPerUnit}
                      onChange={(e) =>
                        handleUnitChange(index, "subunitsPerUnit", Math.max(1, Number(e.target.value) || 1))
                      }
                      className="h-8 text-xs"
                      title={`How many ${units[index + 1]?.plural || "sub-units"} per ${unit.name || "unit"}`}
                    />
                  ) : (
                    <span className="text-[12px] text-t3 text-center">base</span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                    onClick={() => handleRemoveUnit(index)}
                    disabled={units.length <= 1}
                    aria-label="Remove time unit"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            {units.length > 1 && (
              <p className="text-[12px] text-t3">
                "Sub" = how many of the next unit fit in this one. E.g., if a Year has 12 Months, enter 12.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (state.calendars.length > 0 && !editingCalendar) {
                  setShowList(true);
                } else {
                  onOpenChange(false);
                }
              }}
            >
              {state.calendars.length > 0 && !editingCalendar ? "Back" : "Cancel"}
            </Button>
            <Button type="submit" disabled={!name.trim() || units.filter((u) => u.name.trim()).length === 0}>
              {editingCalendar ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarEditorDialog;
