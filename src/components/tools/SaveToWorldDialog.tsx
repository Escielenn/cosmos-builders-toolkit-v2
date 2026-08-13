/**
 * SaveToWorldDialog, asks which world a worksheet belongs to.
 *
 * Shown when Save is pressed on a tool opened outside a world. Until now that
 * case fell through to localStorage with a "saved locally" toast, which meant
 * the work never reached a world, the writing surface could not see it, and it
 * died with the browser cache.
 *
 * Deliberately the same question the simulators ask, in the same words, so the
 * whole product answers "where does this live?" one way.
 */

import { Globe, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorlds } from "@/hooks/use-worlds";

interface SaveToWorldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string | undefined;
  onChange: (worldId: string) => void;
  onConfirm: () => void;
  /** Tool name, so the question names what is being filed. */
  toolName?: string;
}

export default function SaveToWorldDialog({
  open,
  onOpenChange,
  value,
  onChange,
  onConfirm,
  toolName,
}: SaveToWorldDialogProps) {
  const { worlds, isLoading } = useWorlds();
  const hasWorlds = !isLoading && worlds && worlds.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-sf-surface border-sf-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-sm font-light uppercase tracking-[3px] text-sf-teal">
            <Globe className="h-4 w-4" />
            Save into a world
          </DialogTitle>
          <DialogDescription className="mt-2 text-t2">
            {toolName ? `${toolName} isn't attached to a world yet. ` : ""}
            Pick one and this worksheet becomes part of it, where your writing
            can read the values back.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          {isLoading && (
            <p className="font-mono text-[12px] uppercase tracking-[1.5px] text-t4">
              // Loading your worlds…
            </p>
          )}

          {!isLoading && !hasWorlds && (
            <p className="text-[13px] leading-relaxed text-t2">
              You don't have a world yet. Create one first, then this worksheet
              can live inside it.
            </p>
          )}

          {hasWorlds && (
            <div>
              <Label className="text-[12px] font-medium uppercase tracking-[1.5px] text-t3">
                World
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
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!value}
            title={!value ? "Choose a world first" : undefined}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save into world
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
