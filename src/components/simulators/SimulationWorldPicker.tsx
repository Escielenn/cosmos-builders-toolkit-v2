/**
 * SimulationWorldPicker, choose which world a simulation belongs to.
 *
 * Simulators reach their world through `useWorldId()`, which reads a route
 * context or a `?worldId=` param. Opened directly, a simulator has neither, and
 * every persistence path failed quietly as a result: the publish dialog returned
 * null and rendered nothing, the load sheet queried with `enabled: false` and
 * listed nothing, and a save wrote `world_id: null` and was orphaned the moment
 * it was created.
 *
 * So the fix is to ask. A simulation is only useful once it belongs to a world,
 * since that is what the writing surface reads.
 */

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorlds } from "@/hooks/use-worlds";

interface SimulationWorldPickerProps {
  value: string | undefined;
  onChange: (worldId: string) => void;
  /** Shown above the control. */
  label?: string;
}

export default function SimulationWorldPicker({
  value,
  onChange,
  label = "World",
}: SimulationWorldPickerProps) {
  const { worlds, isLoading } = useWorlds();

  if (isLoading) {
    return (
      <p className="font-mono text-[12px] uppercase tracking-[1.5px] text-t4">
        // Loading your worlds…
      </p>
    );
  }

  if (!worlds || worlds.length === 0) {
    return (
      <div>
        <Label className="text-[12px] font-medium uppercase tracking-[1.5px] text-t3">
          {label}
        </Label>
        <p className="mt-1.5 text-[13px] leading-relaxed text-t2">
          You don't have a world yet. Create one and the simulation can live
          inside it, where your writing can reach it.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Label className="text-[12px] font-medium uppercase tracking-[1.5px] text-t3">
        {label}
      </Label>
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger className="mt-1.5">
          <SelectValue placeholder="Choose a world" />
        </SelectTrigger>
        <SelectContent>
          {worlds.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              {w.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
