/**
 * Writing surface preferences panel — embeddable in Profile page.
 * Lets users pick their default writing theme for the rich text editor.
 */

import { Paintbrush, Check } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { WRITING_THEMES } from "@/lib/writing/themes";
import { useWritingPreferences } from "@/hooks/use-writing-preferences";

const WritingSettings = () => {
  const { preferences, updatePreferences, isUpdating } = useWritingPreferences();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Paintbrush className="w-5 h-5 text-primary" />
        <h3 className="font-heading text-lg font-semibold">Writing Surface</h3>
        {isUpdating && <Loader variant="inline" size="sm" />}
      </div>

      {/* Theme */}
      <div className="space-y-3">
        <Label>Editor Theme</Label>
        <div className="grid grid-cols-2 gap-3">
          {WRITING_THEMES.map((theme) => {
            const isSelected = preferences.themeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => updatePreferences({ themeId: theme.id })}
                className={cn(
                  "relative flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-sf-border hover:border-primary/50 hover:bg-accent/50"
                )}
              >
                {/* Color swatch */}
                <div className="flex gap-0.5 shrink-0 mt-0.5">
                  {theme.swatch.map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-sm border border-sf-border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">
                    {theme.name}
                  </p>
                  <p className="text-xs text-t3 mt-0.5 truncate">
                    {theme.description}
                  </p>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary absolute top-2 right-2" />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-t3">
          Theme applies to all rich text editors across tools and world notes.
        </p>
      </div>
    </div>
  );
};

export default WritingSettings;
