/**
 * Appearance — base × primary accent. Embeddable in the Profile page.
 *
 * Every combination is pre-solved for contrast (design/themes.py), so this
 * control cannot produce an illegible screen. Base swatches are grouped by
 * mode; the primary row re-renders its swatches in the CURRENT base's solved
 * values, because "cyan on paper" and "cyan on void" are different hexes.
 */

import { Palette } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  useTheme,
  THEME_BASES,
  THEME_PRIMARIES,
  primaryHex,
  type ThemeBase,
} from "@/hooks/use-theme";

const PRIMARY_LABEL: Record<string, string> = {
  teal: "Teal",
  cyan: "Cyan",
  emerald: "Emerald",
  azure: "Azure",
  violet: "Violet",
  amber: "Amber",
  magenta: "Magenta",
};

const AppearanceSettings = () => {
  const { base, primary, setBase, setPrimary, reset, id } = useTheme();
  const bases = Object.entries(THEME_BASES) as [ThemeBase, (typeof THEME_BASES)[ThemeBase]][];
  const dark = bases.filter(([, b]) => b.mode === "dark");
  const light = bases.filter(([, b]) => b.mode === "light");

  const swatch = ([key, b]: (typeof bases)[number]) => {
    const selected = base === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setBase(key)}
        aria-pressed={selected}
        aria-label={`${b.label} — ${b.blurb}`}
        className={cn(
          "flex min-h-hit flex-col items-start gap-sf-1 rounded-none border p-sf-3 text-left",
          "transition-sf duration-fast ease-sf-out",
          selected
            ? "border-sf-primary"
            : "border-sf-line-interactive hover:border-sf-line-emphasis",
        )}
      >
        <span
          aria-hidden
          className="block h-6 w-full border border-sf-line"
          style={{ background: b.seed }}
        />
        <span className="font-mono text-sf-mono uppercase text-t3">{b.label}</span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center gap-2">
        <Palette className="h-5 w-5 text-primary" />
        <h3 className="font-heading text-lg font-medium">Appearance</h3>
        <span className="ml-auto font-mono text-sf-mono uppercase text-t4">{id}</span>
      </div>

      <div className="space-y-3">
        <Label>Base · dark</Label>
        <div className="grid grid-cols-3 gap-sf-2 sm:grid-cols-6">{dark.map(swatch)}</div>
      </div>

      <div className="space-y-3">
        <Label>Base · light</Label>
        <div className="grid grid-cols-3 gap-sf-2 sm:grid-cols-4">{light.map(swatch)}</div>
      </div>

      <div className="space-y-3">
        <Label>Primary accent</Label>
        <div className="flex flex-wrap gap-sf-2">
          {THEME_PRIMARIES.map((p) => {
            const hex = primaryHex(base, p);
            const selected = primary === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPrimary(p)}
                aria-pressed={selected}
                aria-label={PRIMARY_LABEL[p] ?? p}
                title={PRIMARY_LABEL[p] ?? p}
                className={cn(
                  "min-h-hit min-w-hit rounded-none border-2 transition-sf duration-fast",
                  selected ? "border-t1" : "border-transparent hover:border-sf-line-emphasis",
                )}
                style={{ background: hex }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-sf-mono text-t4 sf-measure">
          // EVERY COMBINATION IS CONTRAST-SOLVED. PHYSICS, STOP, WORLDS AND LORE KEEP THEIR
          COLOURS IN ALL OF THEM.
        </p>
        <button
          type="button"
          onClick={reset}
          className="min-h-hit shrink-0 border border-sf-line-interactive px-sf-3 font-sans text-[12px] font-medium uppercase tracking-[1.2px] text-t2 transition-sf duration-fast hover:border-sf-primary hover:text-sf-primary-text"
        >
          Reset to Void · Teal
        </button>
      </div>
    </div>
  );
};

export default AppearanceSettings;
