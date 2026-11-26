import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WORLD_ICONS, ICON_CATEGORIES, resolveWorldIconId } from "@/lib/world-icons";
import { WorldGlyph } from "@/components/icons/world-glyphs";
import WorldIconRenderer from "./WorldIconRenderer";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
}

/**
 * World icon picker: one family of line glyphs (1.7). A world that still
 * stores a retired illustration path shows, and highlights, the glyph it
 * resolves to; picking any glyph stores that glyph's id.
 */
const IconPicker = ({ value, onChange, disabled }: IconPickerProps) => {
  const [open, setOpen] = useState(false);
  const current = resolveWorldIconId(value);

  const handleSelect = (iconId: string) => {
    onChange(iconId);
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="w-12 h-12 rounded-none shrink-0 text-sf-primary-text"
        aria-label="Choose world icon"
      >
        <WorldIconRenderer iconId={value} className="w-6 h-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl p-5">
          <DialogHeader>
            <DialogTitle>Choose an icon</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto sf-sb pr-1">
            {ICON_CATEGORIES.map((category) => (
              <div key={category} role="group" aria-label={category}>
                <p className="font-heading text-sf-eyebrow uppercase text-t4 mb-1">{category}</p>
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-1">
                  {WORLD_ICONS.filter((icon) => icon.category === category).map((icon) => {
                    const selected = current === icon.id;
                    return (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() => handleSelect(icon.id)}
                        aria-label={icon.label}
                        aria-pressed={selected}
                        title={icon.label}
                        className={cn(
                          "flex h-11 w-full min-w-hit items-center justify-center rounded-none border transition-colors duration-fast",
                          selected
                            ? "border-sf-primary bg-sf-primary/[0.06] text-sf-primary-text"
                            : "border-transparent text-t2 hover:border-sf-line hover:bg-sf-surface-elevated hover:text-t1",
                        )}
                      >
                        <WorldGlyph id={icon.id} className="h-6 w-6" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IconPicker;
