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
}

const S = {
  panel:
    "absolute left-3 top-14 z-10 w-52 bg-[rgba(15,15,16,0.92)] border border-white/[0.08] backdrop-blur-[16px] rounded-none p-3.5 space-y-4 overflow-y-auto max-h-[calc(100%-80px)]",
  sectionLabel:
    "font-heading text-[10px] uppercase tracking-[2px] text-[rgba(21,193,123,0.35)] mb-1.5 block",
  btn: "px-2 py-1 text-[9px] uppercase tracking-[1.5px] font-heading transition-colors border",
  btnOff:
    "bg-transparent border-white/[0.06] text-white/30 hover:bg-[rgba(21,193,123,0.08)] hover:border-[rgba(21,193,123,0.2)]",
  btnOn:
    "bg-[rgba(21,193,123,0.1)] border-[rgba(21,193,123,0.3)] text-[#15C17B]",
  toggle:
    "flex items-center gap-2 py-0.5 text-[10px] font-sans text-white/50 cursor-pointer select-none",
  checkbox:
    "w-3 h-3 rounded-none border border-white/20 flex items-center justify-center text-[8px]",
  checkboxOn: "bg-[rgba(21,193,123,0.15)] border-[rgba(21,193,123,0.4)] text-[#15C17B]",
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
          {system.planets.slice(0, 5).map((p, i) => (
            <button
              key={p.name}
              className={`${S.btn} ${cameraMode === `planet-${i}` ? S.btnOn : S.btnOff}`}
              onClick={() => onCameraMode(`planet-${i}`)}
            >
              {p.name.length > 8 ? p.name.slice(0, 7) + "\u2026" : p.name}
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

      {/* Speed */}
      <div>
        <span className={S.sectionLabel}>Time</span>
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
