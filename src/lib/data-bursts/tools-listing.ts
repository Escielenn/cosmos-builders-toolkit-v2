import type { DataBurstConfig } from "./types";

/** Watermarks for tool cards — keyed by tool slug */
export const TOOL_CARD_WATERMARKS: Record<string, string> = {
  "environmental-chain-reaction": "ΔT = f(albedo, GHG)",
  "spacecraft-designer": "Δv = Isp · g₀ · ln(m₀/mf)",
  "propulsion-consequences-map": "F = ṁ · vₑ + (pₑ − p₀)Aₑ",
  "planetary-profile": "M⊕ = 5.972 × 10²⁴ kg",
  "space-expansion-modeler": "H₀ = 67.4 km/s/Mpc",
  "drake-equation-calculator": "N = R* · fp · ne · fl · fi · fc · L",
  "xenomythology-framework-builder": "MYTHTYPE: COSMOGONIC",
  "evolutionary-biology": "μ = 2.2 × 10⁻⁸ /bp/gen",
  "star-system-builder": "L = 4πR²σT⁴",
  "empire-designer": "POLITY CLASS: HEGEMONIC",
  "technology-consequences": "TRL: 9 (OPERATIONAL)",
  "species-interaction-matrix": "r/K SELECTION INDEX",
  "one-big-lie": "AXIOM DEVIATION: 1σ",
  "time-dilation": "τ = t√(1 − v²/c²)",
  "habitable-zone-calculator": "S_eff = L / d²",
  "lexdrift": "λ(t) = λ₀ · e^(−μt)",
  "surface-gravity-calculator": "g = GM/r²",
  "timeline": "Δt = t₁ − t₀",
  "sensorium": "λ_peak = b/T",
  "gravitas": "F = Gm₁m₂/r²",
};

/** Section headers between tool rows */
export const SECTION_BURSTS: DataBurstConfig[] = [
  {
    content: "MANIFEST: TOOL INVENTORY",
    position: { top: "2%", right: "3%" },
    variant: "status",
    parallax: -0.05,
  },
  {
    content: "v_esc = √(2GM/r)",
    position: { top: "35%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
  {
    content: "CATALOG: ANALYTICAL",
    position: { top: "55%", right: "1%" },
    variant: "margin",
    parallax: -0.08,
  },
  {
    content: "INSTRUMENTS: CALIBRATED",
    position: { top: "75%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.12,
  },
  {
    content: "INDEX: COMPLETE",
    position: { top: "90%", right: "1.5%" },
    variant: "coordinates",
    parallax: -0.06,
  },
];
