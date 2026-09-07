// ---------------------------------------------------------------------------
// TypographyMenu — spacing, font and column width for the manuscript editor.
//
// These three lived as a permanent row wedged between the document title and
// the first line of prose. A writer opening a scene should see their words,
// not a settings panel; every serious writing app keeps typography one click
// away rather than always on screen. Law VII: this absorbs that row, it does
// not add a surface beside it.
//
// The menu deliberately does not close on a click. Choosing a leading means
// looking at the result and trying the next one.
// ---------------------------------------------------------------------------

import { Type } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MEASURE_LABELS,
  WRITING_FONTS,
  WRITING_MEASURES,
} from "@/lib/writing-surface-style";
import type {
  LineSpacing,
  WritingFont,
  WritingMeasure,
  WritingPreferences,
} from "@/hooks/use-writing-preferences";

const SPACINGS: LineSpacing[] = ["1", "1.5", "2"];
const SPACING_LABELS: Record<LineSpacing, string> = {
  "1": "1x",
  "1.5": "1.5x",
  "2": "2x",
};

interface TypographyMenuProps {
  preferences: WritingPreferences;
  onChange: (updates: Partial<WritingPreferences>) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-2">
      <span className="mb-1.5 block font-heading text-[12px] uppercase tracking-[1.5px] text-t4">
        {label}
      </span>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  labels,
  onSelect,
  name,
}: {
  options: readonly T[];
  value: T;
  labels: Record<T, string>;
  onSelect: (v: T) => void;
  name: string;
}) {
  return (
    <div className="flex" role="group" aria-label={name}>
      {options.map((opt, i) => (
        <button
          key={opt}
          type="button"
          aria-pressed={value === opt}
          onClick={() => onSelect(opt)}
          className={`min-h-hit flex-1 border px-2 font-mono text-[12px] transition-colors ${
            i > 0 ? "-ml-px" : ""
          } ${
            value === opt
              ? "border-sf-primary text-sf-primary-text"
              : "border-sf-line-interactive text-t3 hover:text-t1"
          }`}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}

export function TypographyMenu({ preferences, onChange }: TypographyMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 border border-sf-line-interactive px-2.5 py-1 text-[12px] text-t3 transition-colors hover:text-t1"
          title="Spacing, font and column width"
          aria-label="Typography"
        >
          <Type className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">Type</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        // Settings, not commands: keep it open while the writer tries options.
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="w-64 rounded-none border-sf-line-interactive bg-sf-surface-elevated p-0"
      >
        <Row label="Spacing">
          <Segmented
            name="Line spacing"
            options={SPACINGS}
            labels={SPACING_LABELS}
            value={preferences.lineSpacing}
            onSelect={(lineSpacing) => onChange({ lineSpacing })}
          />
        </Row>

        <Row label="Width">
          <Segmented
            name="Column width"
            options={WRITING_MEASURES}
            labels={MEASURE_LABELS}
            value={preferences.writingMeasure}
            onSelect={(writingMeasure) => onChange({ writingMeasure })}
          />
        </Row>

        <Row label="Opening">
          <button
            type="button"
            role="switch"
            aria-checked={preferences.dropCap}
            onClick={() => onChange({ dropCap: !preferences.dropCap })}
            className={`min-h-hit w-full border px-2 text-left text-[13px] transition-colors ${
              preferences.dropCap
                ? "border-sf-primary text-sf-primary-text"
                : "border-sf-line-interactive text-t3 hover:text-t1"
            }`}
          >
            Drop cap {preferences.dropCap ? "on" : "off"}
          </button>
        </Row>

        <Row label="Font">
          <div className="flex flex-col">
            {WRITING_FONTS.map((font: WritingFont) => (
              <button
                key={font}
                type="button"
                aria-pressed={preferences.writingFont === font}
                onClick={() => onChange({ writingFont: font })}
                className={`min-h-hit border px-2 text-left text-[14px] transition-colors ${
                  preferences.writingFont === font
                    ? "border-sf-primary text-t1"
                    : "border-transparent text-t3 hover:text-t1"
                }`}
                // The point of a font list is seeing the font.
                style={{ fontFamily: FONT_PREVIEW[font] }}
              >
                {font}
              </button>
            ))}
          </div>
        </Row>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Preview stacks, so each row renders in the face it names. */
const FONT_PREVIEW: Record<WritingFont, string> = {
  "DM Sans": "'DM Sans', system-ui, sans-serif",
  Lora: "'Lora', Georgia, serif",
  Georgia: "Georgia, 'Times New Roman', serif",
  Merriweather: "'Merriweather', Georgia, serif",
  "Times New Roman": "'Times New Roman', Times, serif",
  "Courier New": "'Courier New', Courier, monospace",
};

export default TypographyMenu;
