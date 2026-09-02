/**
 * SolarisViewer, Top-level integration component.
 * Renders the full orrery: Three.js canvas + floating HTML panels.
 *
 * Usage:
 *   <SolarisViewer system={generatedSystem} height={640} />
 */

import { useState, useCallback, useEffect } from "react";
import type {
  SolarisViewerProps,
  CameraMode,
  SelectedBody,
} from "./types";
import SolarisScene from "./SolarisScene";
import SolarisControls from "./SolarisControls";
import SolarisUI from "./SolarisUI";

export default function SolarisViewer({
  system,
  height = 600,
  initialCameraMode = "free",
  showUI = true,
  onBodySelect,
  onReorbit,
}: SolarisViewerProps) {
  const [cameraMode, setCameraMode] = useState<CameraMode>(initialCameraMode);
  const [selectedBody, setSelectedBody] = useState<SelectedBody | null>(null);
  // 1x, not 10x. Opening at 10x made a system look frantic before the writer
  // had read anything, and the inner planets blurred rather than moved.
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [paused, setPaused] = useState(false);
  const [stepTick, setStepTick] = useState(0);

  // Display toggles
  const [showOrbitalPaths, setShowOrbitalPaths] = useState(true);
  const [showHabitableZone, setShowHabitableZone] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showMoons, setShowMoons] = useState(true);
  const [showAsteroidBelts, setShowAsteroidBelts] = useState(false);

  const handleBodySelect = useCallback(
    (body: SelectedBody | null) => {
      setSelectedBody(body);
      onBodySelect?.(body);
    },
    [onBodySelect]
  );

  const [showKeys, setShowKeys] = useState(false);

  /**
   * Keyboard control, matching the set the native Rogue uses so the two
   * simulators are learned once rather than twice.
   *
   * Ignored while a field has focus, so renaming a planet does not pause the
   * orrery or step it a frame mid-word.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (el instanceof HTMLElement && el.isContentEditable) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          setPaused((p) => !p);
          break;
        case ".":
          // Step a frame, which only means anything while paused.
          setStepTick((t) => t + 1);
          break;
        case "1":
          setCameraMode("free");
          break;
        case "2":
          setCameraMode("star");
          break;
        case "l":
        case "L":
          setShowLabels((v) => !v);
          break;
        case "o":
        case "O":
          setShowOrbitalPaths((v) => !v);
          break;
        case "h":
        case "H":
          setShowHabitableZone((v) => !v);
          break;
        case "?":
          setShowKeys((v) => !v);
          break;
        case "Escape":
          setShowKeys(false);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Title block */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <p
          className="font-heading text-[22px] uppercase tracking-[6px] text-white/90"
          style={{ fontWeight: 300 }}
        >
          SOLARIS
        </p>
        <p className="font-sans text-[12px] uppercase tracking-[2px] text-white/[0.28]">
          STELLARFORGE.TOOLS
        </p>
      </div>

      {/* Three.js canvas */}
      <SolarisScene
        system={system}
        showOrbitalPaths={showOrbitalPaths}
        showHabitableZone={showHabitableZone}
        showAsteroidBelts={showAsteroidBelts}
        showMoons={showMoons}
        showLabels={showLabels}
        onBodySelect={handleBodySelect}
        selectedBody={selectedBody}
        cameraMode={cameraMode}
        speedMultiplier={speedMultiplier}
        paused={paused}
        stepTick={stepTick}
        onReorbit={onReorbit}
      />

      {/* Floating HTML panels */}
      {showUI && (
        <>
          <SolarisControls
            system={system}
            cameraMode={cameraMode}
            onCameraMode={setCameraMode}
            showOrbitalPaths={showOrbitalPaths}
            onToggleOrbitalPaths={() => setShowOrbitalPaths((v) => !v)}
            showHabitableZone={showHabitableZone}
            onToggleHabitableZone={() => setShowHabitableZone((v) => !v)}
            showAsteroidBelts={showAsteroidBelts}
            onToggleAsteroidBelts={() => setShowAsteroidBelts((v) => !v)}
            showMoons={showMoons}
            onToggleMoons={() => setShowMoons((v) => !v)}
            showLabels={showLabels}
            onToggleLabels={() => setShowLabels((v) => !v)}
            speedMultiplier={speedMultiplier}
            onSpeedChange={setSpeedMultiplier}
            paused={paused}
            onTogglePause={() => setPaused((p) => !p)}
            onStep={() => setStepTick((t) => t + 1)}
          />
          <SolarisUI
            systemName={system.name}
            star={system.star}
            selectedBody={selectedBody}
          />

          {/* Keyboard help, same affordance and place as the native Rogue. */}
          <button
            type="button"
            onClick={() => setShowKeys((v) => !v)}
            title="Keyboard shortcuts (?)"
            aria-pressed={showKeys}
            className={`absolute bottom-3 right-3 z-20 min-w-[30px] border px-2 py-1 font-mono text-[12px] backdrop-blur-sm transition-colors ${
              showKeys
                ? "border-sf-primary bg-sf-primary/25 text-white"
                : "border-white/[0.35] bg-[rgba(13,13,15,0.94)] text-white/80 hover:text-white"
            }`}
          >
            ?
          </button>

          {showKeys && (
            <div className="absolute bottom-14 right-3 z-30 w-[228px] border border-white/[0.3] bg-[rgba(13,13,15,0.97)] p-3 backdrop-blur-sm">
              <span className="mb-2 block font-mono text-[12px] uppercase tracking-[2px] text-sf-primary-bright/80">
                Keyboard
              </span>
              {[
                ["Space", paused ? "Resume" : "Pause"],
                [".", "Step one frame"],
                ["1 / 2", "Free / star camera"],
                ["L", "Labels"],
                ["O", "Orbital paths"],
                ["H", "Habitable zone"],
                ["?", "This list"],
              ].map(([k, what]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 py-0.5">
                  <span className="shrink-0 font-mono text-[12px] text-sf-primary-bright">{k}</span>
                  <span className="text-right text-[12px] text-white/75">{what}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { SolarisViewer };
export type { SolarisViewerProps } from "./types";
