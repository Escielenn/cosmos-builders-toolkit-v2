/**
 * SolarisUI, Floating data readout panel (right side).
 * Shows star info + selected body info.
 * HTML overlay in simulator aesthetic (cyan on deep black).
 */

import type { StarData, PlanetData, SelectedBody } from "./types";

interface SolarisUIProps {
  systemName: string;
  star: StarData;
  selectedBody: SelectedBody | null;
}

const S = {
  // Top-right, above the generate panel. Capped so the two cannot overlap.
  panel:
    "absolute right-3 top-14 z-10 w-56 bg-[rgba(15,15,16,0.92)] border border-white/[0.35] backdrop-blur-[16px] rounded-none p-3.5 space-y-3 max-h-[44%] overflow-y-auto",
  // Readout contrast: labels were white/30, which is below the tier-3 floor for
  // text you are meant to read rather than skim past.
  sectionLabel:
    "font-heading text-[13px] uppercase tracking-[2px] text-[#3DFFCD]/80 mb-1.5 block",
  row: "flex items-baseline justify-between gap-2 py-0.5",
  label: "font-heading text-[13px] uppercase tracking-[1.5px] text-white/50 shrink-0",
  value: "font-mono text-[14px] text-white/95 text-right",
  name: "font-heading text-[14px] uppercase tracking-[2px] text-white mb-1",
  badge:
    "inline-block px-1.5 py-0.5 text-[12px] uppercase tracking-wider font-mono border rounded-sm mt-1",
  badgeHz:
    "bg-[rgba(46,204,113,0.1)] border-[rgba(46,204,113,0.3)] text-[#2ECC71]",
  ghost:
    "text-[13px] text-white/45 font-mono uppercase tracking-wider text-center py-4",
};

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtTemp(k: number): string {
  return `${Math.round(k).toLocaleString()} K`;
}

export default function SolarisUI({ systemName, star, selectedBody }: SolarisUIProps) {
  return (
    <div className={S.panel}>
      {/* Title */}
      <div className="pb-2 border-b border-white/[0.35]">
        <p className="font-heading text-[12px] uppercase tracking-[2px] text-[#15C17B]/50">
          System
        </p>
        <p className={S.name}>{systemName}</p>
      </div>

      {/* Star block */}
      <div>
        <span className={S.sectionLabel}>{star.name}</span>
        <Row label="Class" value={star.classification} />
        <Row label="Temp" value={fmtTemp(star.temperatureK)} />
        <Row label="Luminosity" value={`${fmt(star.luminositySOL)} L\u2609`} />
        <Row label="Mass" value={`${fmt(star.massSOL)} M\u2609`} />
        <Row
          label="HZ"
          value={`${fmt(star.habitableZoneInnerAU)} \u2013 ${fmt(star.habitableZoneOuterAU)} AU`}
        />
      </div>

      {/* Selected body */}
      <div className="pt-2 border-t border-white/[0.35]">
        {selectedBody && selectedBody.type === "planet" ? (
          <PlanetReadout planet={selectedBody.data as PlanetData} />
        ) : selectedBody && selectedBody.type === "star" ? (
          <p className={S.ghost}>Star selected</p>
        ) : (
          <p className={S.ghost}>Click any body to inspect</p>
        )}
      </div>
    </div>
  );
}

function PlanetReadout({ planet }: { planet: PlanetData }) {
  const m = planet.meta;

  return (
    <div>
      <span className={S.sectionLabel}>{planet.name}</span>
      <Row label="Type" value={m?.displayName ?? planet.type.replace(/-/g, " ")} />
      <Row label="Mass" value={`${fmt(planet.massEarth)} M\u2295`} />
      <Row label="Radius" value={`${fmt(planet.radiusEarth)} R\u2295`} />
      <Row label="Orbit" value={`${fmt(planet.semiMajorAxisAU)} AU`} />
      <Row label="Period" value={formatPeriod(planet.orbitalPeriodYears)} />
      <Row label="Eccentricity" value={fmt(planet.eccentricity, 3)} />
      <Row label="Tilt" value={`${Math.round(planet.axialTiltDeg)}\u00b0`} />
      <Row label="Moons" value={String(planet.moons.length)} />
      <Row label="Surface" value={fmtTemp(planet.surfaceTempK)} />

      {planet.inHabitableZone && (
        <span className={`${S.badge} ${S.badgeHz}`}>In Habitable Zone</span>
      )}

      {/* The narrative attributes. These were carried through generation and
          save all along and simply never displayed, which left the panel
          showing numbers when the useful part for a writer is the prose. */}
      {m && (
        <div className="mt-2 pt-2 border-t border-white/[0.35]">
          <Row label="Band" value={m.band} />
          <Row label="Life" value={m.life} />
          <Row label="Atmosphere" value={m.atmosphere} />
          <Row label="Water" value={m.water} />
          <Row label="Hazard" value={m.hazard} />
          <Row label="Resources" value={m.resources} />
          {m.note && (
            <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-white/40">
              {m.note}
            </p>
          )}
        </div>
      )}

      {planet.moons.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/[0.35]">
          <span className={S.sectionLabel}>Moons</span>
          {planet.moons.map((moon, i) => (
            <Row
              key={i}
              label={moon.name || `Moon ${i + 1}`}
              value={`${Math.round(moon.radiusKM).toLocaleString()} km`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Years read as nothing under about one, where days are the natural unit. */
function formatPeriod(years: number): string {
  if (years < 1) return `${Math.round(years * 365.25).toLocaleString()} days`;
  return `${fmt(years)} yr`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={S.row}>
      <span className={S.label}>{label}</span>
      <span className={S.value}>{value}</span>
    </div>
  );
}
