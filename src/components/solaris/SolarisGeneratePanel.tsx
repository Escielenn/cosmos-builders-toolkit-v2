/**
 * SolarisGeneratePanel, the controls that decide what gets generated.
 *
 * The native rebuild could only take a seed and an architecture, so everything
 * else the original offered was unreachable: how many planets, what class of
 * star, and the four conditions a writer can insist on. Without these the
 * generator is a slot machine, and a writer who needs a habitable world in a
 * red dwarf system has to reroll until one appears.
 *
 * Conditions are guarantees, not hints. See GenerateConditions in generator.ts.
 */

import type { GenerateConditions } from "./generator";
import type { Arch, StarClassChoice, GenerateSettings } from "./generateSettings";

const ARCH_PRESETS: { value: Arch; label: string; hint: string }[] = [
  { value: "auto", label: "Any", hint: "Weighted toward single stars" },
  { value: "single", label: "Single", hint: "One star" },
  { value: "binary", label: "Binary", hint: "Two stars orbiting a barycenter" },
  { value: "trinary", label: "Trinary", hint: "Close pair plus a distant third" },
  { value: "quaternary", label: "Quaternary", hint: "Hierarchical four-star system" },
];

const STAR_CLASSES: { value: StarClassChoice; label: string; hint: string }[] = [
  { value: "auto", label: "Any", hint: "Weighted toward cooler stars" },
  { value: "blue", label: "Blue", hint: "B class, hot and short-lived" },
  { value: "white", label: "White", hint: "A class" },
  { value: "yellow", label: "Yellow", hint: "G class, Sun-like" },
  { value: "orange", label: "Orange", hint: "K class, long-lived" },
  { value: "red", label: "Red", hint: "M class, dim and very long-lived" },
];

/**
 * Conditions read as "guarantee one of X".
 *
 * The labels are deliberately not bare archetype names. The edit panel's
 * add-planet palette carries buttons called exactly "Gas Giant", "Tidal Lock"
 * and "Rogue World", and two panels offering the same words for different
 * actions (add one now, versus require one at generation) is the kind of
 * duplicate-control confusion this pass exists to remove.
 */
const CONDITIONS: { key: keyof GenerateConditions; label: string; hint: string }[] = [
  { key: "habitable", label: "+ Habitable", hint: "Guarantee a habitable world inside the zone" },
  { key: "gasGiant", label: "+ Gas Giant", hint: "Guarantee a gas giant in the outer system" },
  { key: "tidalLock", label: "+ Locked", hint: "Make the habitable world tidally locked" },
  { key: "rogue", label: "+ Rogue", hint: "Make the outermost body a starless rogue world" },
];

const S = {
  // Bottom-right, under the readout panel. Sits above the status strip.
  panel:
    "absolute right-3 bottom-10 z-20 w-60 bg-[rgba(13,13,15,0.94)] border border-white/[0.35] backdrop-blur-[16px] rounded-none p-3 space-y-3 max-h-[52%] overflow-y-auto",
  // Contrast raised to match SolarisControls: chips were white/45 on a 0.02 fill
  // with a 0.06 border, which read as absent rather than merely inactive.
  sec: "font-mono text-[13px] uppercase tracking-[2px] text-[#3DFFCD]/80 mb-1.5 block",
  chip: "px-2 py-1 text-[12px] uppercase tracking-wide border rounded-none transition-colors min-h-[26px]",
  chipOff:
    "bg-white/[0.05] border-white/[0.35] text-white/75 hover:border-sf-primary/50 hover:bg-sf-primary/[0.12] hover:text-white",
  chipOn: "bg-[rgba(21,193,123,0.22)] border-[#15C17B] text-white",
  field:
    "w-full bg-white/[0.06] border border-white/[0.2] focus:border-sf-primary focus:bg-white/[0.08] outline-none rounded-none px-2 py-1.5 font-mono text-[14px] text-white tracking-wide",
  action:
    "flex-1 px-2 py-2 text-[13px] uppercase tracking-[1.5px] font-heading font-medium border rounded-none transition-colors",
};

interface Props {
  settings: GenerateSettings;
  onChange: (next: GenerateSettings) => void;
  onGenerate: () => void;
  onRandomize: () => void;
}

export default function SolarisGeneratePanel({
  settings,
  onChange,
  onGenerate,
  onRandomize,
}: Props) {
  const set = <K extends keyof GenerateSettings>(key: K, value: GenerateSettings[K]) =>
    onChange({ ...settings, [key]: value });

  const toggleCondition = (key: keyof GenerateConditions) =>
    onChange({
      ...settings,
      conditions: { ...settings.conditions, [key]: !settings.conditions[key] },
    });

  const activeConditions = CONDITIONS.filter((c) => settings.conditions[c.key]).length;

  return (
    <div className={S.panel}>
      <div>
        <span className={S.sec}>Generate</span>
        <input
          value={settings.seed}
          onChange={(e) => set("seed", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onGenerate()}
          placeholder="seed"
          spellCheck={false}
          aria-label="Generation seed"
          className={S.field}
        />
        <p className="mt-1 text-[12px] text-white/25">
          The same seed and settings always give the same system.
        </p>
      </div>

      {/* Architecture */}
      <div>
        <span className={S.sec}>Stars</span>
        <div className="flex flex-wrap gap-1 mb-1.5">
          {ARCH_PRESETS.map((a) => (
            <button
              key={a.value}
              title={a.hint}
              onClick={() => set("arch", a.value)}
              className={`${S.chip} ${settings.arch === a.value ? S.chipOn : S.chipOff}`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {STAR_CLASSES.map((c) => (
            <button
              key={c.value}
              title={c.hint}
              onClick={() => set("starClass", c.value)}
              className={`${S.chip} ${settings.starClass === c.value ? S.chipOn : S.chipOff}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Planet count */}
      <div>
        <label className="flex items-center justify-between text-[13px] uppercase tracking-wider text-white/45 mb-1">
          <span>Planets</span>
          <span className="font-mono text-[13px] text-sf-primary-text">
            {settings.planetCount ?? "auto"}
          </span>
        </label>
        <input
          type="range"
          min={0}
          max={14}
          step={1}
          // 0 is the "auto" position; the generator picks 4 to 8 itself.
          value={settings.planetCount ?? 0}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            set("planetCount", v === 0 ? null : v);
          }}
          className="w-full h-1 accent-sf-primary cursor-pointer"
          aria-label="Number of planets, leftmost is automatic"
        />
      </div>

      {/* Conditions */}
      <div>
        <span className={S.sec}>
          Require{activeConditions > 0 ? ` (${activeConditions})` : ""}
        </span>
        <div className="flex flex-wrap gap-1">
          {CONDITIONS.map((c) => (
            <button
              key={c.key}
              title={c.hint}
              onClick={() => toggleCondition(c.key)}
              aria-pressed={!!settings.conditions[c.key]}
              className={`${S.chip} ${settings.conditions[c.key] ? S.chipOn : S.chipOff}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[12px] text-white/25">
          Each one is a guarantee. The rest of the system still varies.
        </p>
      </div>

      {/* Asteroid belt */}
      <div>
        <span className={S.sec}>Asteroid Belt</span>
        <div className="flex gap-1">
          {[
            { v: null as boolean | null, l: "Auto" },
            { v: true as boolean | null, l: "Always" },
            { v: false as boolean | null, l: "Never" },
          ].map((o) => (
            <button
              key={String(o.v)}
              onClick={() => set("includeBelt", o.v)}
              className={`${S.chip} ${settings.includeBelt === o.v ? S.chipOn : S.chipOff}`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {/* Actions. Pinned to the foot of the panel: the settings above can
          overflow into a scroll, and Generate is the one control that must
          never be below the fold. */}
      <div className="sticky bottom-0 -mx-3 -mb-3 flex gap-1.5 border-t border-white/[0.35] bg-[rgba(13,13,15,0.97)] px-3 py-2.5">
        <button
          onClick={onGenerate}
          className={`${S.action} bg-[#15C17B] border-[#15C17B] text-[#0A0E17] hover:bg-[#3DFFCD] hover:border-[#3DFFCD]`}
        >
          Generate
        </button>
        <button
          onClick={onRandomize}
          title="New random seed, keeping your settings"
          className={`${S.action} bg-white/[0.06] border-white/[0.2] text-white/80 hover:bg-white/[0.12] hover:text-white`}
        >
          Random
        </button>
      </div>
    </div>
  );
}
