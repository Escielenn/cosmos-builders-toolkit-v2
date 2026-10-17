/**
 * SolarisUI, Floating data readout panel (right side).
 * Shows star info + selected body info.
 * HTML overlay in the simulator aesthetic (product primary on the sim canvas).
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
    "absolute right-3 top-14 z-10 w-56 bg-sf-surface/90 border border-sf-line backdrop-blur-sf-panel rounded-none p-3.5 space-y-3 max-h-[44%] overflow-y-auto sf-sb",
  // Readout contrast: labels were white/30, which is below the tier-3 floor for
  // text you are meant to read rather than skim past.
  sectionLabel:
    "font-heading text-[13px] uppercase tracking-wide text-sf-primary-text mb-1.5 block",
  row: "flex items-baseline justify-between gap-2 py-0.5",
  label: "font-heading text-[13px] uppercase tracking-[1.5px] text-t3 shrink-0",
  value: "font-mono text-[14px] text-t1 text-right",
  name: "font-heading text-[14px] uppercase tracking-wide text-t1 mb-1",
  badge:
    "inline-block px-1.5 py-0.5 text-[12px] uppercase tracking-wider font-mono border rounded-sf-tag mt-1",
  badgeHz:
    "bg-sf-emerald/[0.06] border-sf-emerald text-sf-emerald-text",
  ghost:
    "text-[13px] text-t3 font-mono uppercase tracking-wider text-center py-4",
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
      <div className="pb-2 border-b border-sf-line">
        <p className="font-heading text-[12px] uppercase tracking-wide text-t4">
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
      <div className="pt-2 border-t border-sf-line">
        {selectedBody && selectedBody.type === "planet" ? (
          <PlanetReadout planet={selectedBody.data as PlanetData} />
        ) : selectedBody && selectedBody.type === "star" ? (
          <p className={S.ghost}>STAR SELECTED.</p>
        ) : (
          <p className={S.ghost}>SELECT A BODY TO INSPECT.</p>
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
        <div className="mt-2 pt-2 border-t border-sf-line">
          <Row label="Band" value={m.band} />
          <Row label="Life" value={m.life} />
          <Row label="Atmosphere" value={m.atmosphere} />
          <Row label="Water" value={m.water} />
          <Row label="Hazard" value={m.hazard} />
          <Row label="Resources" value={m.resources} />
          {m.note && (
            <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-t2">
              {m.note}
            </p>
          )}
        </div>
      )}

      {planet.moons.length > 0 && (
        <div className="mt-2 pt-2 border-t border-sf-line">
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
