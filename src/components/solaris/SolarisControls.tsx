/**
 * SolarisControls, Camera mode buttons, display toggles, and speed controls.
 * HTML overlay positioned over the Three.js canvas.
 * Uses the simulator aesthetic (cyan on deep black).
 */

import type { CameraMode, StarSystem } from "./types";

const SPEEDS = [0.1, 1, 10, 100];

interface SolarisControlsProps {
  system: StarSystem;
  cameraMode: CameraMode;
  onCameraMode: (mode: CameraMode) => void;
  showOrbitalPaths: boolean;
  onToggleOrbitalPaths: () => void;
  showHabitableZone: boolean;
  onToggleHabitableZone: () => void;
  showAsteroidBelts: boolean;
  onToggleAsteroidBelts: () => void;
  showMoons: boolean;
  onToggleMoons: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  speedMultiplier: number;
  onSpeedChange: (speed: number) => void;
  paused: boolean;
  onTogglePause: () => void;
  onStep: () => void;
}

// The left edge carries two panels: this one and the edit panel anchored to the
// bottom. Capping the height keeps them from overlapping, which previously hid
// the transport controls entirely behind the editor.
const S = {
  panel:
    "absolute left-3 top-14 z-10 w-52 bg-[rgba(15,15,16,0.92)] border border-white/[0.08] backdrop-blur-[16px] rounded-none p-3.5 space-y-4 overflow-y-auto max-h-[46%]",
  // Contrast: the previous values (label teal at 0.35, button text at white/30,
  // borders at 0.06) left every control barely visible against the panel, and
  // the transport row unfindable. Interactive text now sits at tier 2 or above
  // and every button carries a border you can actually see.
  sectionLabel:
    "font-heading text-[12px] uppercase tracking-[2px] text-[#3DFFCD]/80 mb-1.5 block",
  btn: "px-2 py-1 text-[11px] uppercase tracking-[1.5px] font-heading transition-colors border min-h-[26px]",
  btnOff:
    "bg-white/[0.05] border-white/[0.18] text-white/75 hover:bg-[rgba(21,193,123,0.12)] hover:border-[rgba(21,193,123,0.45)] hover:text-white",
  btnOn:
    "bg-[rgba(21,193,123,0.22)] border-[#15C17B] text-white",
  toggle:
    "flex items-center gap-2 py-1 text-[12px] font-sans text-white/80 cursor-pointer select-none hover:text-white",
  checkbox:
    "w-3.5 h-3.5 rounded-none border border-white/40 flex items-center justify-center text-[10px]",
  checkboxOn: "bg-[#15C17B] border-[#15C17B] text-[#0A0E17]",
};

export default function SolarisControls({
  system,
  cameraMode,
  onCameraMode,
  showOrbitalPaths,
  onToggleOrbitalPaths,
  showHabitableZone,
  onToggleHabitableZone,
  showAsteroidBelts,
  onToggleAsteroidBelts,
  showMoons,
  onToggleMoons,
  showLabels,
  onToggleLabels,
  speedMultiplier,
  onSpeedChange,
  paused,
  onTogglePause,
  onStep,
}: SolarisControlsProps) {
  return (
    <div className={S.panel}>
      {/* Camera */}
      <div>
        <span className={S.sectionLabel}>Camera</span>
        <div className="flex flex-wrap gap-1">
          <button
            className={`${S.btn} ${cameraMode === "free" ? S.btnOn : S.btnOff}`}
            onClick={() => onCameraMode("free")}
          >
            Free
          </button>
          <button
            className={`${S.btn} ${cameraMode === "star" ? S.btnOn : S.btnOff}`}
            onClick={() => onCameraMode("star")}
          >
            Star
          </button>
          {system.planets.slice(0, 6).map((p, i) => (
            <button
              key={p.id ?? p.name}
              className={`${S.btn} ${cameraMode === `planet-${i}` ? S.btnOn : S.btnOff}`}
              onClick={() => onCameraMode(`planet-${i}`)}
              title={p.name}
            >
              {shortLabel(p.name, i)}
            </button>
          ))}
        </div>
      </div>

      {/* Display */}
      <div>
        <span className={S.sectionLabel}>Display</span>
        <div className="space-y-1">
          <Toggle on={showOrbitalPaths} onClick={onToggleOrbitalPaths} label="Orbital Paths" />
          <Toggle on={showHabitableZone} onClick={onToggleHabitableZone} label="Habitable Zone" />
          <Toggle on={showLabels} onClick={onToggleLabels} label="Labels" />
          <Toggle on={showMoons} onClick={onToggleMoons} label="Moons" />
          <Toggle on={showAsteroidBelts} onClick={onToggleAsteroidBelts} label="Asteroid Belt" />
        </div>
      </div>

      {/* Time */}
      <div>
        <span className={S.sectionLabel}>Time</span>

        {/* Transport. Pausing is what lets a writer hold a conjunction still
            long enough to describe it, so it leads and it is the one control
            here styled as primary. */}
        <div className="mb-2 flex gap-1">
          <button
            className={`${S.btn} flex-1 font-medium ${
              paused
                ? "bg-[#15C17B] border-[#15C17B] text-[#0A0E17]"
                : "bg-[rgba(21,193,123,0.14)] border-[rgba(21,193,123,0.55)] text-[#3DFFCD] hover:bg-[rgba(21,193,123,0.24)]"
            }`}
            onClick={onTogglePause}
            title={paused ? "Resume (space)" : "Pause (space)"}
            aria-pressed={paused}
          >
            {paused ? "▶ Play" : "⏸ Pause"}
          </button>
          <button
            className={`${S.btn} ${
              paused ? S.btnOff : "bg-transparent border-white/[0.08] text-white/25 cursor-not-allowed"
            }`}
            onClick={onStep}
            disabled={!paused}
            title={paused ? "Advance one frame" : "Pause first to step"}
          >
            Step
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={`${S.btn} ${speedMultiplier === s ? S.btnOn : S.btnOff}`}
              onClick={() => onSpeedChange(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * A camera button label that stays distinguishable.
 *
 * Generated planets are named "<System>-I", "<System>-II" and so on, so simple
 * truncation turned every button into the same "ASTRAVA…". Prefer the part after
 * the last separator, which is the part that differs; fall back to a numbered
 * label for a renamed planet whose name is too long to fit.
 */
function shortLabel(name: string, index: number): string {
  const tail = name.split(/[-–—\s]+/).filter(Boolean).pop() ?? "";
  if (tail && tail.length <= 5) return tail;
  if (name.length <= 7) return name;
  return `P${index + 1}`;
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <label className={S.toggle} onClick={onClick}>
      <span className={`${S.checkbox} ${on ? S.checkboxOn : ""}`}>
        {on ? "\u2713" : ""}
      </span>
      {label}
    </label>
  );
}
