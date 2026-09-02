/**
 * SolarisEditPanel, Native editing UI for the Solaris rebuild (M4, dev route).
 * Palette (add planets), per-planet sliders (radius/mass/eccentricity), rings
 * toggle, and a moon panel. Edits flow up as patches; the parent mutates the
 * system state and the physics engine reconciles smoothly.
 */
import { useEffect, useState } from "react";
import type { PlanetData, MoonData, StarSystem } from "./types";
import { PALETTE, PALETTE_BANDS } from "./generator";

interface Props {
  system: StarSystem;
  selectedIndex: number | null;
  onAddPlanet: (archKey: string) => void;
  onPatchPlanet: (index: number, patch: Partial<PlanetData>) => void;
  onRemovePlanet: (index: number) => void;
  onAddMoon: (index: number) => void;
  onPatchMoon: (index: number, moonIdx: number, patch: Partial<MoonData>) => void;
  onRemoveMoon: (index: number, moonIdx: number) => void;
  onRenameSystem: (name: string) => void;
  onRenameStar: (starIndex: number, name: string) => void;
}

const NAME_INPUT =
  "w-full bg-white/[0.04] border border-white/[0.3] focus:border-sf-primary/40 outline-none rounded-none px-2 py-1 font-mono text-[14px] text-white/85 tracking-wide";

/**
 * A text field for a body's name.
 *
 * Held locally while focused and committed on blur or Enter. Writing straight
 * through on every keystroke would push a new system object into the physics
 * engine mid-word, and Escape would have nothing to revert to.
 */
function NameField({
  value,
  onCommit,
  label,
  placeholder,
}: {
  value: string;
  onCommit: (next: string) => void;
  label: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);

  // Follow external changes (regenerate, load) unless the writer is mid-edit.
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== value) onCommit(next);
    else setDraft(value);
  };

  return (
    <label className="block mb-1.5">
      <span className="block text-[12px] uppercase tracking-[1.5px] text-white/30 mb-0.5">
        {label}
      </span>
      <input
        value={draft}
        placeholder={placeholder}
        spellCheck={false}
        onFocus={() => setEditing(true)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className={NAME_INPUT}
      />
    </label>
  );
}

// Bottom-left, under the camera/display/time panel. The cap is a percentage of
// the viewer rather than the viewport: the viewer sits below the site header, so
// a vh-based cap overshot and pushed this panel over the controls above it.
const PANEL =
  "absolute left-3 bottom-3 z-20 w-64 bg-[rgba(13,13,15,0.94)] border border-white/[0.35] backdrop-blur-[16px] rounded-none p-3 space-y-3 max-h-[48%] overflow-y-auto";
const SEC = "font-mono text-[13px] uppercase tracking-[2px] text-[#3DFFCD]/80 mb-1.5 block";

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-2">
      <label className="flex items-center justify-between text-[13px] uppercase tracking-wider text-white/45 mb-1">
        <span>{label}</span>
        <span className="font-mono text-[13px] text-sf-primary-text">
          {value}
          {unit}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 accent-sf-primary cursor-pointer"
        draggable={false}
      />
    </div>
  );
}

export default function SolarisEditPanel({
  system,
  selectedIndex,
  onAddPlanet,
  onPatchPlanet,
  onRemovePlanet,
  onAddMoon,
  onPatchMoon,
  onRemoveMoon,
  onRenameSystem,
  onRenameStar,
}: Props) {
  const planet = selectedIndex != null ? system.planets[selectedIndex] : null;
  const stars = system.stars ?? [system.star];

  return (
    <div className={PANEL}>
      {/* ── Names ──
          The system and its stars were seed-derived and unnameable, which made
          the simulator useless as a source of reference material: nothing it
          produced could be called by a name the writer chose. */}
      <div>
        <span className={SEC}>Names</span>
        <NameField label="System" value={system.name} onCommit={onRenameSystem} />
        {stars.map((s, i) => (
          <NameField
            key={i}
            label={stars.length === 1 ? "Star" : `Star ${String.fromCharCode(65 + i)}`}
            value={s.name}
            onCommit={(name) => onRenameStar(i, name)}
          />
        ))}
      </div>

      {/* ── Palette ── */}
      <div className="pt-2 border-t border-white/[0.35]">
        <span className={SEC}>Add Planet</span>
        {PALETTE_BANDS.map((band) => (
          <div key={band} className="mb-2">
            <div className="text-[12px] uppercase tracking-wider text-white/25 mb-1">{band}</div>
            <div className="flex flex-wrap gap-1">
              {PALETTE.filter((p) => p.band === band).map((p) => (
                <button
                  key={p.key}
                  onClick={() => onAddPlanet(p.key)}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/solaris-archetype", p.key)}
                  title={`Add ${p.name}`}
                  className="flex items-center gap-1 px-1.5 py-0.5 border border-white/[0.35] bg-white/[0.02] hover:border-sf-primary/30 hover:bg-sf-primary/[0.06] text-[12px] uppercase tracking-wide text-white/60 rounded-none"
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Selected planet editor ── */}
      {planet && selectedIndex != null ? (
        <div className="pt-2 border-t border-white/[0.35]">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0 flex-1">
              <NameField
                label="Planet"
                value={planet.name}
                onCommit={(name) => onPatchPlanet(selectedIndex, { name })}
              />
            </div>
            <button
              onClick={() => onRemovePlanet(selectedIndex)}
              className="mt-4 shrink-0 text-[12px] uppercase tracking-wider text-red-400/70 hover:text-red-400 border border-white/10 hover:border-red-400/40 px-1.5 py-0.5 rounded-none"
            >
              Remove
            </button>
          </div>
          <div className="text-[13px] uppercase tracking-wider text-white/30 mb-2">{planet.meta?.displayName ?? planet.type}</div>

          <Slider label="Radius" value={planet.radiusEarth} min={0.2} max={15} step={0.1} unit=" R⊕" onChange={(v) => onPatchPlanet(selectedIndex, { radiusEarth: v })} />
          <Slider label="Mass" value={planet.massEarth} min={0.02} max={400} step={0.1} unit=" M⊕" onChange={(v) => onPatchPlanet(selectedIndex, { massEarth: v })} />
          <Slider label="Eccentricity" value={planet.eccentricity} min={0} max={0.5} step={0.01} onChange={(v) => onPatchPlanet(selectedIndex, { eccentricity: v })} />

          <label className="flex items-center gap-2 py-1 text-[13px] uppercase tracking-wider text-white/50 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={planet.hasRings}
              onChange={(e) => onPatchPlanet(selectedIndex, { hasRings: e.target.checked, ringColorHex: planet.ringColorHex ?? "#D8C6A0" })}
              className="w-3 h-3 accent-sf-primary"
            />
            Rings
          </label>

          {/* ── Moons ── */}
          <div className="pt-2 mt-1 border-t border-white/[0.35]">
            <div className="flex items-center justify-between mb-1.5">
              <span className={SEC + " mb-0"}>Moons ({planet.moons.length})</span>
              <button
                onClick={() => onAddMoon(selectedIndex)}
                className="text-[12px] uppercase tracking-wider text-sf-primary-text border border-sf-primary/30 bg-sf-primary/[0.08] hover:bg-sf-primary/20 px-1.5 py-0.5 rounded-none"
              >
                + Add
              </button>
            </div>
            {planet.moons.map((moon, mi) => (
              <div key={mi} className="mb-1.5 pl-2 border-l border-white/[0.35]">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    <NameField
                      label={`Moon ${mi + 1}`}
                      value={moon.name}
                      placeholder="Moon"
                      onCommit={(name) => onPatchMoon(selectedIndex, mi, { name })}
                    />
                  </div>
                  <button
                    onClick={() => onRemoveMoon(selectedIndex, mi)}
                    className="mt-4 shrink-0 text-[12px] text-red-400/60 hover:text-red-400"
                    aria-label={`Remove moon ${mi + 1}`}
                  >
                    ✕
                  </button>
                </div>
                <Slider
                  label="Size"
                  value={Math.round(moon.radiusKM)}
                  min={100}
                  max={2500}
                  step={10}
                  unit=" km"
                  onChange={(v) => onPatchMoon(selectedIndex, mi, { radiusKM: v })}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-white/[0.35] text-[13px] text-white/25 uppercase tracking-wider text-center py-3">
          Click a planet to edit
        </div>
      )}
    </div>
  );
}
