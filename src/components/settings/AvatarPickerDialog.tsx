import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRESET_AVATARS = [
  "001-astronaut.svg",
  "001-fairy.svg",
  "002-astronaut.svg",
  "002-cupid.svg",
  "002-man.svg",
  "003-devil.svg",
  "003-robot.svg",
  "004-angel.svg",
  "004-astronaut.svg",
  "005-man.svg",
  "006-astronaut.svg",
  "007-alien.svg",
  "008-creature.svg",
  "008-nymph.svg",
  "009-creature.svg",
  "010-goblin.svg",
  "010-robot.svg",
  "011-robot.svg",
  "012-pilot.svg",
  "013-alien.svg",
  "014-woman.svg",
  "015-cyborg.svg",
  "016-woman.svg",
  "017-cyborg.svg",
  "018-cyborg.svg",
  "019-man.svg",
  "020-alien.svg",
  "021-drone.svg",
  "022-soldier.svg",
  "023-robot.svg",
  "024-robot.svg",
  "025-woman.svg",
  "026-brainy.svg",
  "027-soldier.svg",
  "028-cyborg.svg",
  "029-alien.svg",
  "030-astronaut.svg",
  "030-robot.svg",
  "031-woman.svg",
  "032-alien.svg",
  "033-pilot.svg",
  "034-cthulhu.svg",
  "035-astronaut.svg",
  "035-creature.svg",
  "036-soldier.svg",
  "037-robot.svg",
  "038-rebel.svg",
  "039-alien.svg",
  "040-man.svg",
  "041-robot.svg",
  "042-astronaut.svg",
  "042-banshee.svg",
  "042-headgear.svg",
  "043-astronaut.svg",
  "043-man.svg",
  "043-merman.svg",
  "043-robot.svg",
  "043-tourist.svg",
  "044-grim reaper.svg",
  "044-monkey.svg",
  "044-underwater-suit.svg",
  "045-lord.svg",
  "046-captain.svg",
  "047-creature.svg",
  "048-woman.svg",
  "049-creature.svg",
  "050-woman.svg",
];

interface AvatarPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  currentUrl?: string;
}

const AvatarPickerDialog = ({
  open,
  onOpenChange,
  onSelect,
  currentUrl,
}: AvatarPickerDialogProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = () => {
    if (selected) {
      onSelect(selected);
      onOpenChange(false);
      setSelected(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSelected(null); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading font-light uppercase tracking-wider">
            Choose Avatar
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-6 sm:grid-cols-8 gap-4 max-h-[60vh] overflow-y-auto py-2 pr-1">
          {PRESET_AVATARS.map((filename) => {
            const url = `/profile-pics/${filename}`;
            const isSelected = selected === url;
            const isCurrent = currentUrl === url;

            return (
              <button
                key={filename}
                type="button"
                onClick={() => setSelected(url)}
                className={cn(
                  "aspect-square rounded-full overflow-hidden border-2 transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isSelected
                    ? "border-primary ring-2 ring-primary/30"
                    : isCurrent
                      ? "border-primary/50"
                      : "border-transparent hover:border-muted-foreground/30"
                )}
              >
                <img
                  src={url}
                  alt={filename.replace(/^\d+-/, "").replace(".svg", "")}
                  className="w-full h-full"
                  draggable={false}
                />
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selected}>
            Select
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarPickerDialog;
