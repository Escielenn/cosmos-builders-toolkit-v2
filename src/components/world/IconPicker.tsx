import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WORLD_ICONS, ICON_CATEGORIES, getWorldIcon } from "@/lib/world-icons";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
}

const IconPicker = ({ value, onChange, disabled }: IconPickerProps) => {
  const [open, setOpen] = useState(false);
  const selectedIcon = getWorldIcon(value);
  const IconComponent = selectedIcon.icon;

  const handleSelect = (iconId: string) => {
    onChange(iconId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          className="w-12 h-12 rounded-xl"
        >
          <IconComponent className="w-6 h-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Choose an icon
          </p>
          {ICON_CATEGORIES.map((category) => (
            <div key={category}>
              <p className="text-xs text-muted-foreground mb-2">{category}</p>
              <div className="grid grid-cols-6 gap-1">
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
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default IconPicker;
