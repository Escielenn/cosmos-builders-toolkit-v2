/**
 * Physical constants shared by every StellarForge calculation.
 *
 * public/tools/_shared/physics.js carries the same numbers for the static
 * simulators; src/lib/physics/__tests__/parity.test.ts loads that file and
 * fails if any constant or formula drifts from this module.
 *
 * Sources: CODATA 2018 (G, σ, k_B, u); IAU 2015 Resolution B3 nominal solar
 * and planetary values (R☉, L☉, T☉, GM☉, R⊕, GM⊕); IAU 2012 B2 (AU);
 * Kopp & Lean 2011 (total solar irradiance, 1361 W/m²).
 */
export const G = 6.6743e-11; // m³ kg⁻¹ s⁻²
export const SIGMA_SB = 5.670374419e-8; // W m⁻² K⁻⁴
export const K_B = 1.380649e-23; // J/K
export const AMU = 1.66053906660e-27; // kg

export const AU_M = 1.495978707e11; // m
export const M_SUN_KG = 1.98847e30; // kg  (GM☉ / G)
export const R_SUN_M = 6.957e8; // m
export const L_SUN_W = 3.828e26; // W
export const T_SUN_K = 5772; // K, IAU 2015 nominal effective temperature
export const M_EARTH_KG = 5.9722e24; // kg
export const R_EARTH_M = 6.371e6; // m, mean radius
export const M_EARTH_IN_SUN = M_EARTH_KG / M_SUN_KG; // ≈ 3.003e-6
export const S_EARTH_WM2 = 1361; // W/m², solar constant at 1 AU
export const G_EARTH = 9.80665; // m/s², standard gravity
export const RHO_EARTH = 5.514; // g/cm³, Earth bulk density
export const V_ESC_EARTH_KMS = 11.186; // km/s

export const DAYS_PER_YEAR = 365.25; // Julian year
export const SECONDS_PER_YEAR = DAYS_PER_YEAR * 86400;

/** Molecular masses in g/mol (IUPAC standard atomic weights). */
export const MOLECULAR_MASS = {
  H2: 2.016,
  He: 4.003,
  CH4: 16.043,
  NH3: 17.031,
  H2O: 18.015,
  N2: 28.014,
  O2: 31.998,
  Ar: 39.948,
  CO2: 44.009,
} as const;
export type Molecule = keyof typeof MOLECULAR_MASS;
