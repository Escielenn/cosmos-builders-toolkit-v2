/**
 * SolarisUI — Floating data readout panel (right side).
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
  panel:
    "absolute right-3 top-14 z-10 w-56 bg-[rgba(15,15,16,0.92)] border border-white/[0.08] backdrop-blur-[16px] rounded-none p-3.5 space-y-3 max-h-[calc(100%-80px)] overflow-y-auto",
  sectionLabel:
    "font-heading text-[10px] uppercase tracking-[2px] text-[rgba(0,212,255,0.35)] mb-1.5 block",
  row: "flex items-baseline justify-between py-0.5",
  label: "font-heading text-[10px] uppercase tracking-[1.5px] text-white/30",
  value: "font-mono text-[12px] text-white/80",
  name: "font-heading text-[12px] uppercase tracking-[2px] text-white/90 mb-1",
  badge:
    "inline-block px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-mono border rounded-sm mt-1",
  badgeHz:
    "bg-[rgba(46,204,113,0.1)] border-[rgba(46,204,113,0.3)] text-[#2ECC71]",
  ghost:
    "text-[10px] text-white/15 font-mono uppercase tracking-wider text-center py-4",
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
      <div className="pb-2 border-b border-white/[0.06]">
        <p className="font-heading text-[9px] uppercase tracking-[2px] text-[#00D4FF]/50">
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
      <div className="pt-2 border-t border-white/[0.06]">
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
  return (
    <div>
      <span className={S.sectionLabel}>{planet.name}</span>
      <Row label="Type" value={planet.type.replace("-", " ")} />
      <Row label="Mass" value={`${fmt(planet.massEarth)} M\u2295`} />
      <Row label="Radius" value={`${fmt(planet.radiusEarth)} R\u2295`} />
      <Row label="Orbit" value={`${fmt(planet.semiMajorAxisAU)} AU`} />
      <Row label="Period" value={`${fmt(planet.orbitalPeriodYears)} yr`} />
      <Row label="Moons" value={String(planet.moons.length)} />
      <Row label="Surface" value={fmtTemp(planet.surfaceTempK)} />
      {planet.inHabitableZone && (
        <span className={`${S.badge} ${S.badgeHz}`}>In Habitable Zone</span>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={S.row}>
      <span className={S.label}>{label}</span>
      <span className={S.value}>{value}</span>
    </div>
  );
}
