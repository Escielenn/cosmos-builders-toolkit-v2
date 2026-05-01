/**
 * Export preferences panel, embeddable in Profile page.
 * Lets users pick their default format, theme, and filename options.
 */

import { Download, Check } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EXPORT_THEMES } from "@/lib/export/themes";
import { useExportPreferences } from "@/hooks/use-export-preferences";
import type { ExportFormat } from "@/components/tools/ExportDialog";

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "pdf-summary", label: "PDF Summary" },
  { value: "pdf-full", label: "PDF Full Report" },
  { value: "text", label: "Plain Text (.txt)" },
  { value: "word", label: "Microsoft Word (.docx)" },
  { value: "json", label: "JSON (.json)" },
];

const ExportSettings = () => {
  const { preferences, updatePreferences, isUpdating } = useExportPreferences();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Download className="w-5 h-5 text-primary" />
        <h3 className="font-heading text-lg font-semibold">Export Settings</h3>
        {isUpdating && <Loader variant="inline" size="sm" />}
      </div>

      {/* Default Format */}
      <div className="space-y-2">
        <Label>Default Export Format</Label>
        <Select
          value={preferences.defaultFormat}
          onValueChange={(value) =>
            updatePreferences({ defaultFormat: value as ExportFormat })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMAT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-t3">
          Used by Quick Export and as the initial selection in the Export dialog.
        </p>
      </div>

      {/* Theme */}
      <div className="space-y-3">
        <Label>PDF Theme</Label>
        <div className="grid grid-cols-2 gap-3">
          {EXPORT_THEMES.map((theme) => {
            const isSelected = preferences.themeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => updatePreferences({ themeId: theme.id })}
                className={cn(
                  "relative flex items-start gap-3 p-3 rounded-none border text-left transition-all",
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
          Theme affects PDF exports. DOCX and text exports are unaffected.
        </p>
      </div>

      {/* Filename Options */}
      <div className="space-y-3">
        <Label>Filename Defaults</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="exportWorldName"
              checked={preferences.includeWorldName}
              onCheckedChange={(checked) =>
                updatePreferences({ includeWorldName: checked as boolean })
              }
            />
            <Label htmlFor="exportWorldName" className="text-sm cursor-pointer">
              Include world name in filename
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="exportDate"
              checked={preferences.includeDate}
              onCheckedChange={(checked) =>
                updatePreferences({ includeDate: checked as boolean })
              }
            />
            <Label htmlFor="exportDate" className="text-sm cursor-pointer">
              Include date in filename
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportSettings;
