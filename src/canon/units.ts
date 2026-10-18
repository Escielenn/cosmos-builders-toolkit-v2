// ---------------------------------------------------------------------------
// canon/units, the one unit registry (08-VOCABULARY.md "Units").
//
// Units live on the value, never in a predicate name. Storage uses these
// canonical ids; display symbols are for the edge only. Conversions belong
// here when they are needed, and nowhere else.
// ---------------------------------------------------------------------------

export const UNITS = {
  earth_radii: "R⊕",
  earth_masses: "M⊕",
  solar_masses: "M☉",
  solar_lum: "L☉",
  au: "AU",
  ly: "ly",
  pc: "pc",
  K: "K",
  C: "°C",
  bar: "bar",
  g: "g",
  m_s2: "m/s²",
  km_s: "km/s",
  c: "c",
  hours: "h",
  days: "d",
  local_days: "local days",
  local_years: "local years",
  yr: "yr",
  kyr: "kyr",
  myr: "Myr",
  gyr: "Gyr",
  kg: "kg",
  m: "m",
  km: "km",
  km2: "km²",
  W: "W",
  w_kg: "W/kg",
  g_cm3: "g/cm³",
  deg: "°",
  individuals: "individuals",
  fraction: "",
  kg_C_m2_yr: "kg C/m²/yr",
} as const;

export type Unit = keyof typeof UNITS;

export function isUnit(u: unknown): u is Unit {
  return typeof u === "string" && Object.prototype.hasOwnProperty.call(UNITS, u);
}

/** "1.4" + "g" → "1.4 g". Unknown or empty units leave the number bare. */
export function formatWithUnit(value: string, unit: string | null | undefined): string {
  if (!unit) return value;
  const sym = isUnit(unit) ? UNITS[unit] : unit;
  return sym ? `${value} ${sym}` : value;
}
