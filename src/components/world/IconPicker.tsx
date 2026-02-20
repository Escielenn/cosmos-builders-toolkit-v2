import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WORLD_ICONS, ICON_CATEGORIES } from "@/lib/world-icons";
import { ChevronRight } from "lucide-react";
import WorldIconRenderer from "./WorldIconRenderer";
import WorldPicPickerDialog from "./WorldPicPickerDialog";
import { ALL_WORLD_PICS } from "@/lib/world-pics-config";

// A curated set of visually distinctive preview illustrations
const PREVIEW_PICS = [
  "007-astronaut.svg",
  "048-dragon.svg",
  "005-planet.svg",
  "013-robot.svg",
  "038-genie.svg",
  "018-rocket.svg",
  "039-mermaid.svg",
  "035-black hole.svg",
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
}

const IconPicker = ({ value, onChange, disabled }: IconPickerProps) => {
  const [open, setOpen] = useState(false);
  const [showPicPicker, setShowPicPicker] = useState(false);

  const handleSelect = (iconId: string) => {
    onChange(iconId);
    setOpen(false);
  };

  const handlePicSelect = (path: string) => {
    onChange(path);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="w-12 h-12 rounded-none overflow-hidden shrink-0"
      >
        <WorldIconRenderer iconId={value} className="w-8 h-8" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base">Choose an icon</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {ICON_CATEGORIES.map((category) => (
              <div key={category}>
                <p className="text-xs text-muted-foreground mb-2">{category}</p>
                <div className="grid grid-cols-10 gap-1">
                  {WORLD_ICONS.filter((icon) => icon.category === category).map(
                    (icon) => {
                      const Icon = icon.icon;
                      return (
                        <button
                          key={icon.id}
                          onClick={() => handleSelect(icon.id)}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-lg transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            value === icon.id &&
                              "bg-primary text-primary-foreground"
                          )}
                          title={icon.label}
                        >
                          <Icon className="w-5 h-5" />
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            ))}

            {/* Illustration previews */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Illustrations</p>
              <div className="grid grid-cols-10 gap-1">
                {PREVIEW_PICS.map((filename) => (
                  <button
                    key={filename}
                    type="button"
                    title={filename.replace(/^\d+-/, "").replace(/\.svg$/, "")}
                    onClick={() => handleSelect(`/world-pics/${filename}`)}
                    className={cn(
                      "w-10 h-10 rounded-md p-1 transition-colors overflow-hidden",
                      "hover:bg-accent",
                      value === `/world-pics/${filename}` && "ring-2 ring-primary"
                    )}
                  >
                    <img
                      src={`/world-pics/${filename}`}
                      alt=""
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
              <button
                className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors py-1.5 rounded-md hover:bg-primary/5"
                onClick={() => {
                  setOpen(false);
                  setShowPicPicker(true);
                }}
              >
                View all {ALL_WORLD_PICS.length} illustrations
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <WorldPicPickerDialog
        open={showPicPicker}
        onOpenChange={setShowPicPicker}
        onSelect={handlePicSelect}
      />
    </>
  );
};

export default IconPicker;
