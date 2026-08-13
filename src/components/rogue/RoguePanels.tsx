/**
 * RoguePanels, the control and readout surfaces for the native ROGUE.
 *
 * Styling follows the contrast pass applied to Solaris in 0.6960: interactive
 * text at tier 2 or brighter, borders you can actually see, section labels in
 * bright teal, and the primary action filled rather than outlined. The earlier
 * simulator panels used white/30 text on 0.06 borders and were reported as
 * invisible against the starfield.
 *
 * Left panel is setup and controls, right is the readout. Both cap their height
 * as a percentage of the viewer so they cannot overlap, which is the bug that
 * hid Solaris's transport row entirely.
 */

import { speedKmS, type RogueDisplay } from "./rogueView";
import {
  INTRUDER_TYPES,
  SYSTEMS,
  intruderMass,
  systemScale,
  type IntruderConfig,
  type IntruderKind,
  type RogueBody,
  type SystemDef,
} from "@/lib/simulators/rogue-systems";
import { orbitalPeriod } from "@/lib/simulators/nbody";
import type { EncounterStatus } from "@/lib/simulators/nbody";

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const S = {
  panelBase:
    "absolute z-20 w-[268px] max-w-[calc(100vw-24px)] bg-[rgba(13,13,15,0.94)] border border-white/[0.1] backdrop-blur-[16px] rounded-none p-3 overflow-y-auto",
  sec: "font-mono text-[12px] uppercase tracking-[2px] text-[#3DFFCD]/80 mb-1.5 block",
  chip: "px-2 py-1 text-[11px] uppercase tracking-wide border rounded-none transition-colors min-h-[26px]",
  chipOff:
    "bg-white/[0.05] border-white/[0.18] text-white/75 hover:border-[#15C17B]/50 hover:bg-[#15C17B]/[0.12] hover:text-white",
  chipOn: "bg-[rgba(21,193,123,0.22)] border-[#15C17B] text-white",
  row: "flex items-baseline justify-between gap-2 py-0.5",
  label: "font-heading text-[12px] uppercase tracking-[1.5px] text-white/50 shrink-0",
  value: "font-mono text-[13px] text-white/95 text-right",
  toggle:
    "flex items-center gap-2 py-1 text-[12px] text-white/80 cursor-pointer select-none hover:text-white",
  box: "w-3.5 h-3.5 rounded-none border border-white/40 flex items-center justify-center text-[10px]",
  boxOn: "bg-[#15C17B] border-[#15C17B] text-[#0A0E17]",
};

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-2">
      <label className="mb-1 flex items-center justify-between text-[12px] uppercase tracking-wider text-white/55">
        <span>{label}</span>
        <span className="font-mono text-[12px] text-[#3DFFCD]">{display}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 w-full cursor-pointer accent-[#15C17B]"
        aria-label={label}
      />
    </div>
  );
}

function Toggle({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button className={S.toggle} onClick={onClick} aria-pressed={on} type="button">
      <span className={`${S.box} ${on ? S.boxOn : ""}`}>{on ? "✓" : ""}</span>
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

interface ControlsProps {
  systemKey: string;
  onSystemChange: (key: string) => void;
  system: SystemDef;
  intruder: IntruderConfig;
  onIntruderChange: (next: IntruderConfig) => void;
  launched: boolean;
  running: boolean;
  onLaunch: () => void;
  onTogglePause: () => void;
  onStep: () => void;
  onRewind: () => void;
  onReset: () => void;
  canRewind: boolean;
  display: RogueDisplay;
  onDisplayChange: (next: RogueDisplay) => void;
  speedScale: number;
  onSpeedScale: (v: number) => void;
}

export function RogueControls({
  systemKey,
  onSystemChange,
  system,
  intruder,
  onIntruderChange,
  launched,
  running,
  onLaunch,
  onTogglePause,
  onStep,
  onRewind,
  onReset,
  canRewind,
  display,
  onDisplayChange,
  speedScale,
  onSpeedScale,
}: ControlsProps) {
  const scale = systemScale(system);
  const mass = intruderMass(intruder.kind, intruder.massFraction);
  const set = <K extends keyof IntruderConfig>(k: K, v: IntruderConfig[K]) =>
    onIntruderChange({ ...intruder, [k]: v });

  return (
    <div className={`${S.panelBase} left-3 top-3 max-h-[calc(100%-24px)]`}>
      {/* ── System ── */}
      <div>
        <span className={S.sec}>System</span>
        <div className="flex flex-wrap gap-1">
          {Object.entries(SYSTEMS).map(([key, sys]) => (
            <button
              key={key}
              type="button"
              title={sys.note}
              onClick={() => onSystemChange(key)}
              className={`${S.chip} ${systemKey === key ? S.chipOn : S.chipOff}`}
            >
              {sys.name.replace("Our ", "")}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">{system.note}</p>
      </div>

      {/* ── Intruder ── */}
      <div className="mt-3 border-t border-white/[0.08] pt-2.5">
        <span className={S.sec}>Intruder</span>
        <div className="mb-2 flex flex-wrap gap-1">
          {(Object.keys(INTRUDER_TYPES) as IntruderKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => set("kind", kind)}
              className={`${S.chip} ${intruder.kind === kind ? S.chipOn : S.chipOff}`}
              style={
                intruder.kind === kind
                  ? { borderColor: INTRUDER_TYPES[kind].color }
                  : undefined
              }
            >
              {INTRUDER_TYPES[kind].name}
            </button>
          ))}
        </div>

        <Slider
          label="Mass"
          value={intruder.massFraction}
          min={0}
          max={1}
          step={0.01}
          display={mass.display}
          onChange={(v) => set("massFraction", v)}
        />
        <Slider
          label="Miss distance"
          value={intruder.distanceAU}
          min={scale.distMin}
          max={scale.distMax}
          step={scale.distStep}
          display={`${intruder.distanceAU.toFixed(scale.distStep < 0.01 ? 3 : 2)} AU`}
          onChange={(v) => set("distanceAU", v)}
        />
        <Slider
          label="Speed"
          value={intruder.speedKmS}
          min={scale.speedMin}
          max={scale.speedMax}
          step={1}
          display={`${Math.round(intruder.speedKmS)} km/s`}
          onChange={(v) => set("speedKmS", v)}
        />
        <Slider
          label="Approach"
          value={intruder.angleDeg}
          min={0}
          max={359}
          step={1}
          display={`${Math.round(intruder.angleDeg)}°`}
          onChange={(v) => set("angleDeg", v)}
        />
      </div>

      {/* ── Transport ── */}
      <div className="mt-3 border-t border-white/[0.08] pt-2.5">
        <span className={S.sec}>Time</span>
        {!launched ? (
          <button
            type="button"
            onClick={onLaunch}
            className="w-full border border-[#15C17B] bg-[#15C17B] px-2 py-2 font-heading text-[12px] font-medium uppercase tracking-[1.5px] text-[#0A0E17] transition-colors hover:bg-[#3DFFCD]"
          >
            ▶ Launch intruder
          </button>
        ) : (
          <>
            <div className="mb-2 flex gap-1">
              <button
                type="button"
                onClick={onTogglePause}
                aria-pressed={!running}
                className={`${S.chip} flex-1 font-medium ${
                  running
                    ? "border-[#15C17B]/55 bg-[#15C17B]/[0.14] text-[#3DFFCD] hover:bg-[#15C17B]/25"
                    : "border-[#15C17B] bg-[#15C17B] text-[#0A0E17]"
                }`}
              >
                {running ? "⏸ Pause" : "▶ Play"}
              </button>
              <button
                type="button"
                onClick={onRewind}
                disabled={!canRewind}
                title={canRewind ? "Step back" : "Nothing recorded yet"}
                className={`${S.chip} ${
                  canRewind ? S.chipOff : "cursor-not-allowed border-white/[0.08] text-white/25"
                }`}
              >
                ◀◀
              </button>
              <button type="button" onClick={onStep} className={`${S.chip} ${S.chipOff}`}>
                ▶|
              </button>
            </div>
            <button
              type="button"
              onClick={onReset}
              className={`${S.chip} ${S.chipOff} w-full`}
            >
              Reset system
            </button>
          </>
        )}

        <div className="mt-2">
          <Slider
            label="Sim rate"
            value={speedScale}
            min={0.25}
            max={4}
            step={0.25}
            display={`${speedScale}x`}
            onChange={onSpeedScale}
          />
        </div>
      </div>

      {/* ── Display ── */}
      <div className="mt-3 border-t border-white/[0.08] pt-2.5">
        <span className={S.sec}>Display</span>
        <Toggle
          on={display.trails}
          label="Trails"
          onClick={() => onDisplayChange({ ...display, trails: !display.trails })}
        />
        <Toggle
          on={display.orbits}
          label="Original orbits"
          onClick={() => onDisplayChange({ ...display, orbits: !display.orbits })}
        />
        <Toggle
          on={display.habitableZone}
          label="Habitable zone"
          onClick={() =>
            onDisplayChange({ ...display, habitableZone: !display.habitableZone })
          }
        />
        <Toggle
          on={display.labels}
          label="Labels"
          onClick={() => onDisplayChange({ ...display, labels: !display.labels })}
        />
        <Toggle
          on={display.gravityLines}
          label="Gravity lines"
          onClick={() =>
            onDisplayChange({ ...display, gravityLines: !display.gravityLines })
          }
        />
        <Toggle
          on={display.grid}
          label="Grid"
          onClick={() => onDisplayChange({ ...display, grid: !display.grid })}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Readout
// ---------------------------------------------------------------------------

const STATUS_COPY: Record<EncounterStatus, { text: string; tone: string }> = {
  awaiting: { text: "Awaiting launch", tone: "text-white/55" },
  approaching: { text: "Intruder approaching", tone: "text-[#3DFFCD]" },
  perturbed: { text: "Orbits perturbed", tone: "text-[#FFB800]" },
  "post-encounter": { text: "Post-encounter", tone: "text-[#3DFFCD]" },
  ejecting: { text: "Planets ejected", tone: "text-[#FF9F43]" },
  disrupted: { text: "System disrupted", tone: "text-[#FF3366]" },
};

interface ReadoutProps {
  system: SystemDef;
  bodies: RogueBody[];
  status: EncounterStatus;
  ejected: Set<string>;
  simYears: number;
  selected: RogueBody | null;
  onFollow: (name: string | null) => void;
  followName: string | null;
}

export function RogueReadout({
  system,
  bodies,
  status,
  ejected,
  simYears,
  selected,
  onFollow,
  followName,
}: ReadoutProps) {
  const stars = bodies.filter((b) => b.isStar);
  const planets = bodies.filter((b) => b.isPlanet);
  const intruder = bodies.find((b) => b.isIntruder);
  const copy = STATUS_COPY[status];

  const fastest = planets.reduce<RogueBody | null>(
    (best, p) => (!best || speedKmS(p) > speedKmS(best) ? p : best),
    null,
  );

  return (
    <div className={`${S.panelBase} right-3 top-3 max-h-[calc(100%-24px)]`}>
      <div className="border-b border-white/[0.08] pb-2">
        <span className={S.sec}>Status</span>
        <p className={`font-heading text-[13px] uppercase tracking-[1.5px] ${copy.tone}`}>
          ● {copy.text}
        </p>
      </div>

      <div className="mt-2">
        <span className={S.sec}>{system.name}</span>
        <Row label="Elapsed" value={`${simYears.toFixed(2)} yr`} />
        <Row
          label={stars.length > 1 ? "Stars" : "Star"}
          value={stars.map((s) => `${s.starType ?? "?"} ${s.mass.toFixed(3)}`).join(" + ")}
        />
        <Row label="Planets" value={`${planets.length - ejected.size} of ${planets.length} held`} />
        {ejected.size > 0 && (
          <Row label="Ejected" value={String(ejected.size)} />
        )}
        {fastest && (
          <Row label="Fastest" value={`${Math.round(speedKmS(fastest))} km/s`} />
        )}
        {intruder && intruder.active && (
          <Row
            label="Intruder"
            value={`${Math.hypot(intruder.x, intruder.y).toFixed(2)} AU out`}
          />
        )}
      </div>

      {/* ── Selected body ── */}
      <div className="mt-2 border-t border-white/[0.08] pt-2">
        {selected ? (
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className={S.sec + " mb-0"}>{selected.name}</span>
              <button
                type="button"
                onClick={() => onFollow(followName === selected.name ? null : selected.name)}
                className={`${S.chip} ${followName === selected.name ? S.chipOn : S.chipOff}`}
              >
                {followName === selected.name ? "Following" : "Follow"}
              </button>
            </div>
            <Row
              label="Distance"
              value={`${Math.hypot(selected.x, selected.y).toFixed(3)} AU`}
            />
            <Row label="Speed" value={`${Math.round(speedKmS(selected))} km/s`} />
            {selected.a && (
              <>
                <Row label="Started at" value={`${selected.a.toFixed(3)} AU`} />
                <Row
                  label="Original year"
                  value={formatYears(orbitalPeriod(starMassOf(bodies), selected.a))}
                />
              </>
            )}
            {selected.mass > 0 && (
              <Row label="Mass" value={`${(selected.mass / 3.003e-6).toFixed(2)} M⊕`} />
            )}
            {ejected.has(selected.name) && (
              <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[1.2px] text-[#2ECC71]">
                Unbound and leaving
              </p>
            )}
          </div>
        ) : (
          <p className="py-3 text-center font-mono text-[12px] uppercase tracking-wider text-white/45">
            Click any body to inspect
          </p>
        )}
      </div>

      {/* ── Bodies list, doubles as a camera picker ── */}
      <div className="mt-2 border-t border-white/[0.08] pt-2">
        <span className={S.sec}>Bodies</span>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => onFollow(null)}
            className={`${S.chip} ${followName === null ? S.chipOn : S.chipOff}`}
          >
            Free
          </button>
          {[...stars, ...planets].map((b) => (
            <button
              key={b.name}
              type="button"
              title={b.name}
              onClick={() => onFollow(b.name)}
              className={`${S.chip} ${followName === b.name ? S.chipOn : S.chipOff} ${
                ejected.has(b.name) ? "opacity-60" : ""
              }`}
            >
              {b.sym ?? b.name.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>
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

function starMassOf(bodies: RogueBody[]): number {
  return bodies.filter((b) => b.isStar).reduce((s, b) => s + b.mass, 0) || 1;
}

/** Years read as nothing below one, where days are the natural unit. */
function formatYears(years: number): string {
  if (years < 1) return `${Math.round(years * 365.25)} days`;
  return `${years.toFixed(2)} yr`;
}
