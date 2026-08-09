import { Input } from "@/components/ui/input";
import type { CustomCalendar, CalendarDate } from "@/lib/timeline/types";

interface CalendarDateInputProps {
  calendar: CustomCalendar;
  value: CalendarDate | undefined;
  onChange: (date: CalendarDate) => void;
}

/**
 * Dynamically renders one input per calendar unit.
 * For Earth: Year/Month/Day. For custom: fields from the calendar's units array.
 */
const CalendarDateInput = ({ calendar, value, onChange }: CalendarDateInputProps) => {
  const values = value?.values ?? calendar.units.map(() => 0);

  const handleChange = (index: number, rawValue: string) => {
    const newValues = [...values];
    newValues[index] = rawValue === "" ? 0 : Number(rawValue);
    onChange({ values: newValues });
  };

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(calendar.units.length, 4)}, 1fr)` }}>
      {calendar.units.map((unit, index) => {
        const isSmallest = index === calendar.units.length - 1;
        const parentSubunits = index > 0 ? calendar.units[index - 1].subunitsPerUnit : undefined;

        return (
          <div key={index}>
            <Input
              type="number"
              placeholder={unit.abbreviation || unit.name}
              value={values[index] || ""}
              onChange={(e) => handleChange(index, e.target.value)}
              min={index === 0 ? undefined : 0}
              max={parentSubunits ? parentSubunits - 1 : undefined}
            />
            <span className="text-[12px] text-t3 mt-0.5 block">
              {unit.name}
              {parentSubunits && !isSmallest ? ` (0-${parentSubunits - 1})` : ""}
              {index === 0 ? " (required)" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarDateInput;
