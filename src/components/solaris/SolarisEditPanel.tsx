/**
 * SolarisEditPanel, Native editing UI for the Solaris rebuild (M4, dev route).
 * Palette (add planets), per-planet sliders (radius/mass/eccentricity), rings
 * toggle, and a moon panel. Edits flow up as patches; the parent mutates the
 * system state and the physics engine reconciles smoothly.
 */
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
}

const PANEL =
  "absolute left-3 bottom-3 z-20 w-64 bg-[rgba(13,13,15,0.94)] border border-white/[0.08] backdrop-blur-[16px] rounded-none p-3 space-y-3 max-h-[calc(100vh-260px)] overflow-y-auto";
const SEC = "font-mono text-[12px] uppercase tracking-[2px] text-sf-teal/50 mb-1.5 block";

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
      <label className="flex items-center justify-between text-[12px] uppercase tracking-wider text-white/45 mb-1">
        <span>{label}</span>
        <span className="font-mono text-[12px] text-sf-teal">
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
        className="w-full h-1 accent-sf-teal cursor-pointer"
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
}: Props) {
  const planet = selectedIndex != null ? system.planets[selectedIndex] : null;

  return (
    <div className={PANEL}>
      {/* ── Palette ── */}
      <div>
        <span className={SEC}>Add Planet</span>
        {PALETTE_BANDS.map((band) => (
          <div key={band} className="mb-2">
            <div className="text-[11px] uppercase tracking-wider text-white/25 mb-1">{band}</div>
            <div className="flex flex-wrap gap-1">
              {PALETTE.filter((p) => p.band === band).map((p) => (
                <button
                  key={p.key}
                  onClick={() => onAddPlanet(p.key)}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/solaris-archetype", p.key)}
                  title={`Add ${p.name}`}
                  className="flex items-center gap-1 px-1.5 py-0.5 border border-white/[0.06] bg-white/[0.02] hover:border-sf-teal/30 hover:bg-sf-teal/[0.06] text-[11px] uppercase tracking-wide text-white/60 rounded-none"
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
        <div className="pt-2 border-t border-white/[0.07]">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[13px] uppercase tracking-[1.5px] text-white/90">{planet.name}</span>
            <button
              onClick={() => onRemovePlanet(selectedIndex)}
              className="text-[11px] uppercase tracking-wider text-red-400/70 hover:text-red-400 border border-white/10 hover:border-red-400/40 px-1.5 py-0.5 rounded-none"
            >
              Remove
            </button>
          </div>
          <div className="text-[12px] uppercase tracking-wider text-white/30 mb-2">{planet.meta?.displayName ?? planet.type}</div>

          <Slider label="Radius" value={planet.radiusEarth} min={0.2} max={15} step={0.1} unit=" R⊕" onChange={(v) => onPatchPlanet(selectedIndex, { radiusEarth: v })} />
          <Slider label="Mass" value={planet.massEarth} min={0.02} max={400} step={0.1} unit=" M⊕" onChange={(v) => onPatchPlanet(selectedIndex, { massEarth: v })} />
          <Slider label="Eccentricity" value={planet.eccentricity} min={0} max={0.5} step={0.01} onChange={(v) => onPatchPlanet(selectedIndex, { eccentricity: v })} />

          <label className="flex items-center gap-2 py-1 text-[12px] uppercase tracking-wider text-white/50 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={planet.hasRings}
              onChange={(e) => onPatchPlanet(selectedIndex, { hasRings: e.target.checked, ringColorHex: planet.ringColorHex ?? "#D8C6A0" })}
              className="w-3 h-3 accent-sf-teal"
            />
            Rings
          </label>

          {/* ── Moons ── */}
          <div className="pt-2 mt-1 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-1.5">
              <span className={SEC + " mb-0"}>Moons ({planet.moons.length})</span>
              <button
                onClick={() => onAddMoon(selectedIndex)}
                className="text-[11px] uppercase tracking-wider text-sf-teal border border-sf-teal/30 bg-sf-teal/[0.08] hover:bg-sf-teal/20 px-1.5 py-0.5 rounded-none"
              >
                + Add
              </button>
            </div>
            {planet.moons.map((moon, mi) => (
              <div key={mi} className="mb-1.5 pl-2 border-l border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-white/35">Moon {mi + 1}</span>
                  <button onClick={() => onRemoveMoon(selectedIndex, mi)} className="text-[11px] text-red-400/60 hover:text-red-400">
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
        <div className="pt-2 border-t border-white/[0.07] text-[12px] text-white/25 uppercase tracking-wider text-center py-3">
          Click a planet to edit
        </div>
      )}
    </div>
  );
}
