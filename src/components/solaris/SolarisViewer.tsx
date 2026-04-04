/**
 * SolarisViewer — Top-level integration component.
 * Renders the full orrery: Three.js canvas + floating HTML panels.
 *
 * Usage:
 *   <SolarisViewer system={generatedSystem} height={640} />
 */

import { useState, useCallback } from "react";
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
}: SolarisViewerProps) {
  const [cameraMode, setCameraMode] = useState<CameraMode>(initialCameraMode);
  const [selectedBody, setSelectedBody] = useState<SelectedBody | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState(10);

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
        <p className="font-sans text-[8px] uppercase tracking-[2px] text-white/[0.28]">
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
