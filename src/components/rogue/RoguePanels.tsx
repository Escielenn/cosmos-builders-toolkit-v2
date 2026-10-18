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
    "absolute z-20 w-[268px] max-w-[calc(100vw-24px)] bg-sf-surface/90 border border-sf-line backdrop-blur-sf-panel rounded-none p-4 overflow-y-auto sf-sb",
  sec: "font-mono text-[13px] uppercase tracking-wide text-sf-primary-text mb-1.5 block",
  chip: "px-3 py-1 text-[12px] uppercase tracking-wide border rounded-none transition-colors duration-base min-h-[26px]",
  chipOff:
    "bg-sf-surface border-sf-line text-t2 hover:border-sf-primary hover:bg-sf-primary/[0.12] hover:text-t1",
  chipOn: "bg-sf-primary/[0.12] border-sf-primary text-t1",
  // An ejected body recedes by tier and a strike, never by opacity.
  chipEjected:
    "bg-sf-surface border-sf-line text-t4 line-through hover:border-sf-primary hover:text-t2",
  row: "flex items-baseline justify-between gap-2 py-0.5",
  label: "font-heading text-[13px] uppercase tracking-[1.5px] text-t3 shrink-0",
  value: "font-mono text-[14px] text-t1 text-right",
  toggle:
    "flex items-center gap-2 py-1 text-[13px] text-t2 cursor-pointer select-none hover:text-t1",
  box: "w-3.5 h-3.5 rounded-none border border-sf-line-emphasis flex items-center justify-center text-[12px]",
  boxOn: "bg-sf-primary border-sf-primary text-sf-on-primary",
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
      <label className="mb-1 flex items-center justify-between text-[13px] uppercase tracking-wider text-t3">
        <span>{label}</span>
        <span className="font-mono text-[13px] text-sf-primary-text">{display}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 w-full cursor-pointer accent-sf-primary"
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
        <div className="flex flex-wrap gap-2">
          {Object.entries(SYSTEMS).map(([key, sys]) => (
            <button
              key={key}
              type="button"
              title={sys.note}
              onClick={() => onSystemChange(key)}
              aria-pressed={systemKey === key}
              className={`${S.chip} ${systemKey === key ? S.chipOn : S.chipOff}`}
            >
              {sys.name.replace("Our ", "")}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-t3">{system.note}</p>
      </div>

      {/* ── Intruder ── */}
      <div className="mt-3 border-t border-sf-line-hairline pt-2.5">
        <span className={S.sec}>Intruder</span>
        <div className="mb-2 flex flex-wrap gap-2">
          {(Object.keys(INTRUDER_TYPES) as IntruderKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => set("kind", kind)}
              aria-pressed={intruder.kind === kind}
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
      <div className="mt-3 border-t border-sf-line-hairline pt-2.5">
        <span className={S.sec}>Time</span>
        {!launched ? (
          <button
            type="button"
            onClick={onLaunch}
            className="w-full min-h-hit border border-sf-primary bg-sf-primary px-3 py-2 font-heading text-[13px] font-medium uppercase tracking-[1.5px] text-sf-on-primary transition-shadow duration-base ease-sf-out hover:shadow-sf-glow-teal"
          >
            ▶ Launch intruder
          </button>
        ) : (
          <>
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={onTogglePause}
                aria-pressed={!running}
                className={`${S.chip} min-h-hit flex-1 font-medium ${
                  running
                    ? "border-sf-primary bg-sf-primary/[0.12] text-sf-primary-text hover:bg-sf-primary/[0.2]"
                    : "border-sf-primary bg-sf-primary text-sf-on-primary"
                }`}
              >
                {running ? "⏸ Pause" : "▶ Play"}
              </button>
              <button
                type="button"
                onClick={onRewind}
                disabled={!canRewind}
                title={canRewind ? "Step back" : "Nothing recorded yet"}
                aria-label="Step back"
                className={`${S.chip} min-h-hit min-w-hit ${
                  canRewind ? S.chipOff : "cursor-not-allowed border-sf-disabled-line bg-sf-disabled-bg text-sf-disabled-text"
                }`}
              >
                ◀◀
              </button>
              <button
                type="button"
                onClick={onStep}
                title="Step forward"
                aria-label="Step forward"
                className={`${S.chip} ${S.chipOff} min-h-hit min-w-hit`}
              >
                ▶|
              </button>
            </div>
            <p className="mb-2 font-mono text-[12px] uppercase text-t4">SPACE · PLAY / PAUSE</p>
            <button
              type="button"
              onClick={onReset}
              className={`${S.chip} ${S.chipOff} min-h-hit w-full`}
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
      <div className="mt-3 border-t border-sf-line-hairline pt-2.5">
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

// Colour is never the only signal: warnings and failures also change the
// leading glyph ("//" for danger, "!" for a warning) as well as the text.
const STATUS_COPY: Record<EncounterStatus, { text: string; tone: string; glyph: string }> = {
  awaiting: { text: "Awaiting launch", tone: "text-t3", glyph: "○" },
  approaching: { text: "Intruder approaching", tone: "text-sf-primary-text", glyph: "●" },
  perturbed: { text: "Orbits perturbed", tone: "text-sf-amber-text", glyph: "!" },
  "post-encounter": { text: "Post-encounter", tone: "text-sf-primary-text", glyph: "●" },
  ejecting: { text: "Planets ejected", tone: "text-sf-amber-warm-text", glyph: "!" },
  disrupted: { text: "System disrupted", tone: "text-sf-crimson-text", glyph: "//" },
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
      <div className="border-b border-sf-line-hairline pb-2">
        <span className={S.sec}>Status</span>
        <p role="status" className={`font-heading text-[14px] uppercase tracking-[1.5px] ${copy.tone}`}>
          <span aria-hidden>{copy.glyph}</span> {copy.text}
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
      <div className="mt-2 border-t border-sf-line-hairline pt-2">
        {selected ? (
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className={S.sec + " mb-0"}>{selected.name}</span>
              <button
                type="button"
                onClick={() => onFollow(followName === selected.name ? null : selected.name)}
                aria-pressed={followName === selected.name}
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
              <p className="mt-1.5 font-mono text-[12px] uppercase tracking-[1.2px] text-sf-emerald-text">
                Unbound and leaving
              </p>
            )}
          </div>
        ) : (
          <p className="py-3 text-center font-mono text-[13px] uppercase tracking-wider text-t3">
            SELECT A BODY TO INSPECT.
          </p>
        )}
      </div>

      {/* ── Bodies list, doubles as a camera picker ── */}
      <div className="mt-2 border-t border-sf-line-hairline pt-2">
        <span className={S.sec}>Bodies</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onFollow(null)}
            aria-pressed={followName === null}
            className={`${S.chip} ${followName === null ? S.chipOn : S.chipOff}`}
          >
            Free
          </button>
          {[...stars, ...planets].map((b) => (
            <button
              key={b.name}
              type="button"
              title={ejected.has(b.name) ? `${b.name} (ejected)` : b.name}
              aria-label={ejected.has(b.name) ? `Follow ${b.name}, ejected` : `Follow ${b.name}`}
              onClick={() => onFollow(b.name)}
              aria-pressed={followName === b.name}
              className={`${S.chip} ${
                followName === b.name
                  ? S.chipOn
                  : ejected.has(b.name)
                    ? S.chipEjected
                    : S.chipOff
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
