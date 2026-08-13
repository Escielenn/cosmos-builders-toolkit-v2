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

  // Spacebar toggles playback, per the simulator spec in CLAUDE.md. Ignored
  // while a field has focus, so renaming a planet does not pause the orrery.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const el = document.activeElement;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (el instanceof HTMLElement && el.isContentEditable) return;
      e.preventDefault();
      setPaused((p) => !p);
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
        <p className="font-sans text-[10px] uppercase tracking-[2px] text-white/[0.28]">
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
        </>
      )}
    </div>
  );
}

export { SolarisViewer };
export type { SolarisViewerProps } from "./types";
