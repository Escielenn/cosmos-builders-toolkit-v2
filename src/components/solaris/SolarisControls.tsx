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
    "absolute left-3 top-14 z-10 w-52 bg-sf-surface/90 border border-sf-line backdrop-blur-sf-panel rounded-none p-4 space-y-4 overflow-y-auto sf-sb max-h-[46%]",
  // Contrast: the previous values (label teal at 0.35, button text at white/30,
  // borders at 0.06) left every control barely visible against the panel, and
  // the transport row unfindable. Interactive text now sits at tier 2 or above
  // and every button carries a border you can actually see.
  sectionLabel:
    "font-heading text-[13px] uppercase tracking-wide text-sf-primary-text mb-1.5 block",
  btn: "px-3 py-1 text-[12px] uppercase tracking-[1.5px] font-heading transition-colors duration-base border sf-hit min-h-[26px]",
  // Transport buttons are the controls a writer reaches for most; they get the
  // full 44px hit target even where the chip rows stay compact.
  transport: "min-h-hit",
  btnOff:
    "bg-sf-surface border-sf-line text-t2 hover:bg-sf-primary/[0.12] hover:border-sf-line-emphasis hover:text-t1",
  btnOn:
    "bg-sf-primary/[0.12] border-sf-primary text-t1",
  toggle:
    "flex w-full items-center gap-2 py-1 text-left text-[13px] font-sans text-t2 cursor-pointer select-none transition-colors duration-base hover:text-t1",
  checkbox:
    "w-3.5 h-3.5 rounded-none border border-sf-line-emphasis flex items-center justify-center text-[12px]",
  checkboxOn: "bg-sf-primary border-sf-primary text-sf-on-primary",
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
        <div className="flex flex-wrap gap-2">
          <button
            className={`${S.btn} ${cameraMode === "free" ? S.btnOn : S.btnOff}`}
            onClick={() => onCameraMode("free")}
            aria-pressed={cameraMode === "free"}
          >
            Free
          </button>
          <button
            className={`${S.btn} ${cameraMode === "star" ? S.btnOn : S.btnOff}`}
            onClick={() => onCameraMode("star")}
            aria-pressed={cameraMode === "star"}
          >
            Star
          </button>
          {system.planets.slice(0, 6).map((p, i) => (
            <button
              key={p.id ?? p.name}
              className={`${S.btn} ${cameraMode === `planet-${i}` ? S.btnOn : S.btnOff}`}
              onClick={() => onCameraMode(`planet-${i}`)}
              aria-pressed={cameraMode === `planet-${i}`}
              aria-label={`Camera: ${p.name}`}
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
        <div className="mb-2 flex gap-2">
          <button
            className={`${S.btn} ${S.transport} flex-1 font-medium ${
              paused
                ? "bg-sf-primary border-sf-primary text-sf-on-primary"
                : "bg-sf-primary/[0.12] border-sf-primary text-sf-primary-text hover:bg-sf-primary/[0.2]"
            }`}
            onClick={onTogglePause}
            title={paused ? "Resume (space)" : "Pause (space)"}
            aria-pressed={paused}
          >
            {paused ? "▶ Play" : "⏸ Pause"}
          </button>
          <button
            className={`${S.btn} ${S.transport} ${
              paused ? S.btnOff : "bg-sf-disabled-bg border-sf-disabled-line text-sf-disabled-text cursor-not-allowed"
            }`}
            onClick={onStep}
            disabled={!paused}
            title={paused ? "Advance one frame" : "Pause first to step"}
          >
            Step
          </button>
        </div>
        <p className="mb-2 font-mono text-[12px] uppercase text-t4">SPACE · PLAY / PAUSE</p>

        <div className="flex flex-wrap gap-2">
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={`${S.btn} ${speedMultiplier === s ? S.btnOn : S.btnOff}`}
              onClick={() => onSpeedChange(s)}
              aria-pressed={speedMultiplier === s}
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
    <button type="button" className={S.toggle} onClick={onClick} aria-pressed={on}>
      <span className={`${S.checkbox} ${on ? S.checkboxOn : ""}`} aria-hidden>
        {on ? "\u2713" : ""}
      </span>
      {label}
    </button>
  );
}
