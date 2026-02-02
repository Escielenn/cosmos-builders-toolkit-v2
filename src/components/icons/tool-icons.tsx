// Custom Tool Icons for StellarForge
// Each icon features a distinct color with glow effect on dark background

import { SVGProps } from "react";

interface ToolIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

// Environmental Chain Reaction - Cyan chain links
export const ChainReactionIcon = ({ className = "", ...props }: ToolIconProps) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <filter id="chainGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 0  0 1 0 0 0.9  0 0 1 0 1  0 0 0 0.6 0"/>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="48" height="48" rx="8" fill="#0A0A0A"/>
    <g filter="url(#chainGlow)">
      {/* First chain link */}
      <ellipse cx="18" cy="20" rx="7" ry="10" stroke="#00E5E5" strokeWidth="2.5" fill="none"/>
      {/* Second chain link - interlocked */}
      <ellipse cx="30" cy="28" rx="7" ry="10" stroke="#00E5E5" strokeWidth="2.5" fill="none"/>
      {/* Connection highlight */}
      <path d="M22 16 L26 22" stroke="#00FFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
    </g>
  </svg>
);

// Spacecraft Designer - Orange rocket
export const SpacecraftIcon = ({ className = "", ...props }: ToolIconProps) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <filter id="rocketGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 1  0 0 0 0 0.4  0 0 0 0 0.2  0 0 0 0.6 0"/>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="48" height="48" rx="8" fill="#0A0A0A"/>
    <g filter="url(#rocketGlow)">
      {/* Rocket body */}
      <path d="M24 8 L30 28 L24 32 L18 28 Z" stroke="#FF6B35" strokeWidth="2" fill="none"/>
      {/* Nose cone */}
      <path d="M24 8 Q28 14 30 20" stroke="#FF6B35" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M24 8 Q20 14 18 20" stroke="#FF6B35" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Fins */}
      <path d="M18 28 L12 36 L18 32" stroke="#FF6B35" strokeWidth="1.5" fill="none"/>
      <path d="M30 28 L36 36 L30 32" stroke="#FF6B35" strokeWidth="1.5" fill="none"/>
      {/* Exhaust */}
      <path d="M21 34 L24 42 L27 34" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
    </g>
  </svg>
);

// Propulsion Consequences - Green atom
export const PropulsionIcon = ({ className = "", ...props }: ToolIconProps) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <filter id="atomGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 0  0 0 0 0 1  0 0 0 0 0.5  0 0 0 0.6 0"/>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="48" height="48" rx="8" fill="#0A0A0A"/>
    <g filter="url(#atomGlow)">
      {/* Nucleus */}
      <circle cx="24" cy="24" r="4" fill="#00FF88"/>
      {/* Orbits */}
      <ellipse cx="24" cy="24" rx="14" ry="6" stroke="#00FF88" strokeWidth="1.5" fill="none" transform="rotate(0 24 24)"/>
      <ellipse cx="24" cy="24" rx="14" ry="6" stroke="#00FF88" strokeWidth="1.5" fill="none" transform="rotate(60 24 24)"/>
      <ellipse cx="24" cy="24" rx="14" ry="6" stroke="#00FF88" strokeWidth="1.5" fill="none" transform="rotate(120 24 24)"/>
      {/* Electrons */}
      <circle cx="38" cy="24" r="2" fill="#00FF88" opacity="0.9"/>
      <circle cx="17" cy="12" r="2" fill="#00FF88" opacity="0.9"/>
      <circle cx="17" cy="36" r="2" fill="#00FF88" opacity="0.9"/>
    </g>
  </svg>
);

// Planetary Profile - Green globe
export const PlanetaryIcon = ({ className = "", ...props }: ToolIconProps) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <filter id="planetGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 0  0 0 0 0 1  0 0 0 0 0.5  0 0 0 0.6 0"/>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="48" height="48" rx="8" fill="#0A0A0A"/>
    <g filter="url(#planetGlow)">
      {/* Planet circle */}
      <circle cx="24" cy="24" r="14" stroke="#00FF88" strokeWidth="2" fill="none"/>
      {/* Latitude lines */}
      <ellipse cx="24" cy="24" rx="14" ry="5" stroke="#00FF88" strokeWidth="1" fill="none" opacity="0.6"/>
      <ellipse cx="24" cy="17" rx="10" ry="3" stroke="#00FF88" strokeWidth="1" fill="none" opacity="0.4"/>
      <ellipse cx="24" cy="31" rx="10" ry="3" stroke="#00FF88" strokeWidth="1" fill="none" opacity="0.4"/>
      {/* Meridian */}
      <ellipse cx="24" cy="24" rx="5" ry="14" stroke="#00FF88" strokeWidth="1" fill="none" opacity="0.6"/>
    </g>
  </svg>
);

// Drake Equation - Teal calculator/equation
export const DrakeIcon = ({ className = "", ...props }: ToolIconProps) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <filter id="drakeGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 0  0 0 0 0 0.8  0 0 0 0 0.8  0 0 0 0.6 0"/>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="48" height="48" rx="8" fill="#0A0A0A"/>
    <g filter="url(#drakeGlow)">
      {/* N = text */}
      <text x="10" y="22" fontFamily="monospace" fontSize="14" fontWeight="bold" fill="#00CED1">N</text>
      <text x="20" y="22" fontFamily="monospace" fontSize="14" fill="#00CED1">=</text>
      {/* Equation symbols */}
      <text x="10" y="36" fontFamily="monospace" fontSize="10" fill="#00CED1" opacity="0.8">R*fp</text>
      {/* Multiplication dot */}
      <circle cx="33" cy="32" r="1.5" fill="#00CED1"/>
      {/* More symbols */}
      <text x="28" y="22" fontFamily="monospace" fontSize="10" fill="#00CED1" opacity="0.7">ne</text>
      {/* Stars decoration */}
      <circle cx="38" cy="14" r="1" fill="#00CED1" opacity="0.5"/>
      <circle cx="42" cy="18" r="0.8" fill="#00CED1" opacity="0.4"/>
      <circle cx="35" cy="10" r="0.6" fill="#00CED1" opacity="0.3"/>
    </g>
  </svg>
);

// Xenomythology - Cyan lightning rune
export const XenomythologyIcon = ({ className = "", ...props }: ToolIconProps) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <filter id="runeGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 0  0 0 0 0 0.9  0 0 0 0 1  0 0 0 0.6 0"/>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="48" height="48" rx="8" fill="#0A0A0A"/>
    <g filter="url(#runeGlow)">
      {/* Lightning bolt / rune shape */}
      <path d="M28 8 L22 20 L28 20 L20 40 L26 26 L20 26 L28 8" stroke="#00E5E5" strokeWidth="2" fill="none" strokeLinejoin="round"/>
      {/* Inner glow accent */}
      <path d="M26 12 L23 18" stroke="#00FFFF" strokeWidth="1" opacity="0.8"/>
      {/* Mystical circle */}
      <circle cx="24" cy="24" r="16" stroke="#00E5E5" strokeWidth="1" fill="none" opacity="0.3" strokeDasharray="3 3"/>
      {/* Corner runes */}
      <path d="M10 10 L14 14" stroke="#00E5E5" strokeWidth="1" opacity="0.4"/>
      <path d="M38 10 L34 14" stroke="#00E5E5" strokeWidth="1" opacity="0.4"/>
      <path d="M10 38 L14 34" stroke="#00E5E5" strokeWidth="1" opacity="0.4"/>
      <path d="M38 38 L34 34" stroke="#00E5E5" strokeWidth="1" opacity="0.4"/>
    </g>
  </svg>
);

// Species Creator - Purple DNA helix
export const SpeciesIcon = ({ className = "", ...props }: ToolIconProps) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <filter id="dnaGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 0.7  0 0 0 0 0.3  0 0 0 0 1  0 0 0 0.6 0"/>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="48" height="48" rx="8" fill="#0A0A0A"/>
    <g filter="url(#dnaGlow)">
      {/* DNA helix strands */}
      <path d="M16 8 Q24 14 32 8 Q24 20 16 14 Q24 26 32 20 Q24 32 16 26 Q24 38 32 32 Q24 44 16 40" stroke="#A855F7" strokeWidth="2" fill="none"/>
      <path d="M32 8 Q24 14 16 8 Q24 20 32 14 Q24 26 16 20 Q24 32 32 26 Q24 38 16 32 Q24 44 32 40" stroke="#A855F7" strokeWidth="2" fill="none"/>
      {/* Base pairs */}
      <line x1="18" y1="11" x2="30" y2="11" stroke="#A855F7" strokeWidth="1.5" opacity="0.6"/>
      <line x1="18" y1="17" x2="30" y2="17" stroke="#A855F7" strokeWidth="1.5" opacity="0.6"/>
      <line x1="18" y1="23" x2="30" y2="23" stroke="#A855F7" strokeWidth="1.5" opacity="0.6"/>
      <line x1="18" y1="29" x2="30" y2="29" stroke="#A855F7" strokeWidth="1.5" opacity="0.6"/>
      <line x1="18" y1="35" x2="30" y2="35" stroke="#A855F7" strokeWidth="1.5" opacity="0.6"/>
    </g>
  </svg>
);

// Culture Designer - Magenta branching tree
export const CultureIcon = ({ className = "", ...props }: ToolIconProps) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <filter id="treeGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 1  0 0 0 0 0  0 0 0 0 1  0 0 0 0.6 0"/>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="48" height="48" rx="8" fill="#0A0A0A"/>
    <g filter="url(#treeGlow)">
      {/* Trunk */}
      <path d="M24 40 L24 28" stroke="#FF00FF" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Main branches */}
      <path d="M24 28 L24 20" stroke="#FF00FF" strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 24 L16 16" stroke="#FF00FF" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M24 24 L32 16" stroke="#FF00FF" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Sub-branches */}
      <path d="M16 16 L12 10" stroke="#FF00FF" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
      <path d="M16 16 L18 9" stroke="#FF00FF" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
      <path d="M24 20 L22 12" stroke="#FF00FF" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
      <path d="M24 20 L26 12" stroke="#FF00FF" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
      <path d="M32 16 L30 9" stroke="#FF00FF" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
      <path d="M32 16 L36 10" stroke="#FF00FF" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
      {/* Leaves/nodes */}
      <circle cx="12" cy="10" r="2" fill="#FF00FF" opacity="0.7"/>
      <circle cx="18" cy="9" r="2" fill="#FF00FF" opacity="0.7"/>
      <circle cx="22" cy="12" r="2" fill="#FF00FF" opacity="0.7"/>
      <circle cx="26" cy="12" r="2" fill="#FF00FF" opacity="0.7"/>
      <circle cx="30" cy="9" r="2" fill="#FF00FF" opacity="0.7"/>
      <circle cx="36" cy="10" r="2" fill="#FF00FF" opacity="0.7"/>
    </g>
  </svg>
);

// Technology Mapper - Teal circuit cube
export const TechnologyIcon = ({ className = "", ...props }: ToolIconProps) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <filter id="circuitGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 0  0 0 0 0 0.8  0 0 0 0 0.8  0 0 0 0.6 0"/>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="48" height="48" rx="8" fill="#0A0A0A"/>
    <g filter="url(#circuitGlow)">
      {/* 3D Cube outline */}
      <path d="M24 8 L36 16 L36 32 L24 40 L12 32 L12 16 Z" stroke="#00CED1" strokeWidth="2" fill="none"/>
      <path d="M24 8 L24 24 L36 32" stroke="#00CED1" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <path d="M24 24 L12 32" stroke="#00CED1" strokeWidth="1.5" fill="none" opacity="0.6"/>
      {/* Circuit traces */}
      <line x1="24" y1="8" x2="24" y2="2" stroke="#00CED1" strokeWidth="1" opacity="0.5"/>
      <line x1="36" y1="16" x2="42" y2="14" stroke="#00CED1" strokeWidth="1" opacity="0.5"/>
      <line x1="12" y1="16" x2="6" y2="14" stroke="#00CED1" strokeWidth="1" opacity="0.5"/>
      <line x1="36" y1="32" x2="42" y2="34" stroke="#00CED1" strokeWidth="1" opacity="0.5"/>
      <line x1="12" y1="32" x2="6" y2="34" stroke="#00CED1" strokeWidth="1" opacity="0.5"/>
      <line x1="24" y1="40" x2="24" y2="46" stroke="#00CED1" strokeWidth="1" opacity="0.5"/>
      {/* Circuit nodes */}
      <circle cx="24" cy="2" r="2" fill="#00CED1" opacity="0.6"/>
      <circle cx="42" cy="14" r="2" fill="#00CED1" opacity="0.6"/>
      <circle cx="6" cy="14" r="2" fill="#00CED1" opacity="0.6"/>
      <circle cx="42" cy="34" r="2" fill="#00CED1" opacity="0.6"/>
      <circle cx="6" cy="34" r="2" fill="#00CED1" opacity="0.6"/>
      <circle cx="24" cy="46" r="2" fill="#00CED1" opacity="0.6"/>
    </g>
  </svg>
);

// Star System Builder - Yellow/Gold star system
export const StarSystemIcon = ({ className = "", ...props }: ToolIconProps) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 1  0 0 0 0 0.8  0 0 0 0 0  0 0 0 0.6 0"/>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="48" height="48" rx="8" fill="#0A0A0A"/>
    <g filter="url(#starGlow)">
      {/* Central star */}
      <circle cx="24" cy="24" r="6" fill="#FFD700"/>
      {/* Orbits */}
      <circle cx="24" cy="24" r="12" stroke="#FFD700" strokeWidth="1" fill="none" opacity="0.5"/>
      <circle cx="24" cy="24" r="18" stroke="#FFD700" strokeWidth="1" fill="none" opacity="0.3"/>
      {/* Planets */}
      <circle cx="36" cy="24" r="2" fill="#FFD700" opacity="0.8"/>
      <circle cx="24" cy="6" r="1.5" fill="#FFD700" opacity="0.6"/>
      <circle cx="8" cy="30" r="2.5" fill="#FFD700" opacity="0.7"/>
    </g>
  </svg>
);

// Empire Designer - Purple crown/throne
export const EmpireIcon = ({ className = "", ...props }: ToolIconProps) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <filter id="empireGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 0.6  0 0 0 0 0.2  0 0 0 0 0.8  0 0 0 0.6 0"/>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="48" height="48" rx="8" fill="#0A0A0A"/>
    <g filter="url(#empireGlow)">
      {/* Crown base */}
      <path d="M12 32 L12 24 L18 28 L24 20 L30 28 L36 24 L36 32 Z" stroke="#9333EA" strokeWidth="2" fill="none"/>
      {/* Crown points */}
      <circle cx="12" cy="24" r="2" fill="#9333EA"/>
      <circle cx="24" cy="20" r="2" fill="#9333EA"/>
      <circle cx="36" cy="24" r="2" fill="#9333EA"/>
      {/* Base band */}
      <rect x="12" y="32" width="24" height="4" stroke="#9333EA" strokeWidth="2" fill="none"/>
      {/* Jewel */}
      <circle cx="24" cy="34" r="1.5" fill="#9333EA"/>
    </g>
  </svg>
);

// Technology Consequences - Cyan circuit/network
export const TechConsequencesIcon = ({ className = "", ...props }: ToolIconProps) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <filter id="techGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 0  0 0 0 0 0.9  0 0 0 0 0.9  0 0 0 0.6 0"/>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="48" height="48" rx="8" fill="#0A0A0A"/>
    <g filter="url(#techGlow)">
      {/* Central chip */}
      <rect x="18" y="18" width="12" height="12" stroke="#06B6D4" strokeWidth="2" fill="none"/>
      {/* Connection lines */}
      <line x1="24" y1="18" x2="24" y2="8" stroke="#06B6D4" strokeWidth="1.5"/>
      <line x1="24" y1="30" x2="24" y2="40" stroke="#06B6D4" strokeWidth="1.5"/>
      <line x1="18" y1="24" x2="8" y2="24" stroke="#06B6D4" strokeWidth="1.5"/>
      <line x1="30" y1="24" x2="40" y2="24" stroke="#06B6D4" strokeWidth="1.5"/>
      {/* Diagonal connections */}
      <line x1="18" y1="18" x2="12" y2="12" stroke="#06B6D4" strokeWidth="1" opacity="0.7"/>
      <line x1="30" y1="18" x2="36" y2="12" stroke="#06B6D4" strokeWidth="1" opacity="0.7"/>
      <line x1="18" y1="30" x2="12" y2="36" stroke="#06B6D4" strokeWidth="1" opacity="0.7"/>
      <line x1="30" y1="30" x2="36" y2="36" stroke="#06B6D4" strokeWidth="1" opacity="0.7"/>
      {/* Nodes */}
      <circle cx="24" cy="8" r="2" fill="#06B6D4"/>
      <circle cx="24" cy="40" r="2" fill="#06B6D4"/>
      <circle cx="8" cy="24" r="2" fill="#06B6D4"/>
      <circle cx="40" cy="24" r="2" fill="#06B6D4"/>
    </g>
  </svg>
);

// Species Interaction Matrix - Pink interconnected nodes
export const SpeciesMatrixIcon = ({ className = "", ...props }: ToolIconProps) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <filter id="matrixGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 0.9  0 0 0 0 0.2  0 0 0 0 0.6  0 0 0 0.6 0"/>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="48" height="48" rx="8" fill="#0A0A0A"/>
    <g filter="url(#matrixGlow)">
      {/* Connection lines */}
      <line x1="14" y1="14" x2="34" y2="14" stroke="#EC4899" strokeWidth="1.5" opacity="0.6"/>
      <line x1="14" y1="14" x2="14" y2="34" stroke="#EC4899" strokeWidth="1.5" opacity="0.6"/>
      <line x1="34" y1="14" x2="34" y2="34" stroke="#EC4899" strokeWidth="1.5" opacity="0.6"/>
      <line x1="14" y1="34" x2="34" y2="34" stroke="#EC4899" strokeWidth="1.5" opacity="0.6"/>
      <line x1="14" y1="14" x2="34" y2="34" stroke="#EC4899" strokeWidth="1" opacity="0.4"/>
      <line x1="34" y1="14" x2="14" y2="34" stroke="#EC4899" strokeWidth="1" opacity="0.4"/>
      <line x1="24" y1="14" x2="24" y2="34" stroke="#EC4899" strokeWidth="1" opacity="0.4"/>
      <line x1="14" y1="24" x2="34" y2="24" stroke="#EC4899" strokeWidth="1" opacity="0.4"/>
      {/* Species nodes */}
      <circle cx="14" cy="14" r="4" fill="#EC4899"/>
      <circle cx="34" cy="14" r="4" fill="#EC4899"/>
      <circle cx="14" cy="34" r="4" fill="#EC4899"/>
      <circle cx="34" cy="34" r="4" fill="#EC4899"/>
      <circle cx="24" cy="24" r="3" fill="#EC4899" opacity="0.7"/>
    </g>
  </svg>
);

// Map tool IDs to their icon components
export const TOOL_ICONS: Record<string, React.FC<ToolIconProps>> = {
  'environmental-chain-reaction': ChainReactionIcon,
  'spacecraft-designer': SpacecraftIcon,
  'propulsion-consequences-map': PropulsionIcon,
  'planetary-profile': PlanetaryIcon,
  'drake-equation-calculator': DrakeIcon,
  'xenomythology-framework-builder': XenomythologyIcon,
  'evolutionary-biology': SpeciesIcon,
  'species-creator': SpeciesIcon,  // Legacy mapping
  'culture-designer': CultureIcon,
  'technology-mapper': TechnologyIcon,
  'star-system-builder': StarSystemIcon,
  'empire-designer': EmpireIcon,
  'technology-consequences': TechConsequencesIcon,
  'species-interaction-matrix': SpeciesMatrixIcon,
};

export const getToolIcon = (toolId: string): React.FC<ToolIconProps> | null => {
  return TOOL_ICONS[toolId] || null;
};
