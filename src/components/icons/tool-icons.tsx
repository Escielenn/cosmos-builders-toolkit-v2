// Tool Icons for StellarForge
// Uses SVG illustration files from /public/icons/

import React from "react";

interface ToolIconProps {
  className?: string;
}

// Map tool IDs to their SVG filenames in /public/icons/
const ICON_FILES: Record<string, string> = {
  "drake-equation-calculator": "drake-equation.svg",
  "empire-designer": "empire-government.svg",
  "environmental-chain-reaction": "environmental-chain-reaction.svg",
  "evolutionary-biology": "evolutionary-biology.svg",
  "habitable-zone-calculator": "habitable-zone.svg",
  "spacecraft-designer": "lived-in-spacecraft.svg",
  "one-big-lie": "physics-declaration-the-one-big-lie.svg",
  "planetary-profile": "planetary-profile.svg",
  "propulsion-consequences-map": "propulsion-consequences.svg",
  "space-expansion-modeler": "space-expansion.svg",
  "species-interaction-matrix": "technology-consequences.svg",
  "star-system-builder": "star-system-builder.svg",
  "technology-consequences": "species-interaction.svg",
  "time-dilation": "time-dilation-calculator.svg",
  "xenomythology-framework-builder": "xenomythology-framework.svg",
  "lexdrift": "003-book.svg",
  "surface-gravity-calculator": "013-meteorite.svg",
  "timeline": "029-time machine.svg",
  "rogue": "035-black hole.svg",
  "tidelock": "044-day and night.svg",
  "exosky": "016-constellation.svg",
  "exoforge": "049-planet.svg",
  "sensorium": "006-eye-scan.svg",
  "gravitas": "045-planet.svg",
  "stellar-cartographer": "003-map.svg",
};

function createImgIcon(filename: string): React.FC<ToolIconProps> {
  const Component = ({ className = "" }: ToolIconProps) => (
    <img src={`/icons/${filename}`} alt="" className={className} draggable={false} />
  );
  Component.displayName = `ToolIcon(${filename})`;
  return Component;
}

// Map tool IDs to their icon components
export const TOOL_ICONS: Record<string, React.FC<ToolIconProps>> = Object.fromEntries(
  Object.entries(ICON_FILES).map(([id, file]) => [id, createImgIcon(file)])
);

export const getToolIcon = (toolId: string): React.FC<ToolIconProps> | null => {
  return TOOL_ICONS[toolId] || null;
};
