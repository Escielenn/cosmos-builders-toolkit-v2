/**
 * Ark visuals: the generations strip, the inbreeding curve, the minimum
 * viable population scale, the habitat cross-section and the deck plan.
 *
 * Shapes are SVG and take every colour from Tailwind token classes
 * (fill-sf-*, stroke-sf-*), so they follow the theme. Every label is HTML
 * laid over the SVG, never SVG text, so it never scales below 12px on a
 * phone.
 */
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { DriftEvent, DriftLayer } from "@/lib/generation-ship/drift-events";
import type { GenShipFormState, GenShipResults } from "@/lib/generation-ship/calculations";
import { F_DANGER, F_FIRST_COUSIN, MVP_REFERENCES } from "@/lib/generation-ship/data";
import { fmt } from "@/lib/generation-ship/markdown";
import { LAYER_BG, LAYER_LABEL, LAYER_STROKE } from "./layers";

// ─── Generations strip ──────────────────────────────────────────────────

export function GenerationsStrip({
  totalYears,
  generationYears,
  events,
  selectedId,
  onSelect,
}: {
  totalYears: number;
  generationYears: number;
  events: DriftEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}): JSX.Element | null {
  const gens = useMemo(() => {
    if (!(totalYears > 0) || !(generationYears > 0)) return [];
    const n = Math.min(400, Math.ceil(totalYears / generationYears));
    return Array.from({ length: n }, (_, i) => ({
      i,
      x0: (i * generationYears) / totalYears,
      x1: Math.min(1, ((i + 1) * generationYears) / totalYears),
    }));
  }, [totalYears, generationYears]);
  if (gens.length === 0) return null;

  // Label every generation when there is room, otherwise every k-th.
  const labelEvery = Math.max(1, Math.ceil(gens.length / 12));

  return (
    <div className="space-y-2">
      <div className="relative h-24 w-full border border-sf-line bg-sf-void">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
          {gens.map((g) => (
            <rect
              key={g.i}
              x={g.x0 * 1000}
              y={0}
              width={Math.max(0.5, (g.x1 - g.x0) * 1000)}
              height={60}
              className={g.i % 2 === 0 ? "fill-sf-surface" : "fill-sf-surface-elevated"}
            />
          ))}
          <line x1={0} y1={60} x2={1000} y2={60} className="stroke-sf-line" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {events.map((e) => {
            const x = Math.min(999, Math.max(1, (e.shipYear / totalYears) * 1000));
            const sel = e.id === selectedId;
            return (
              <line
                key={e.id}
                x1={x}
                x2={x}
                y1={sel ? 0 : 12}
                y2={60}
                className={LAYER_STROKE[e.layer]}
                strokeWidth={sel ? 3 : 1.5}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        {/* Event pins: real buttons over the strip so they are focusable. */}
        {events.map((e) => {
          const left = Math.min(99.5, Math.max(0.5, (e.shipYear / totalYears) * 100));
          const sel = e.id === selectedId;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => onSelect(e.id)}
              aria-label={`Year ${Math.round(e.shipYear)} of the voyage: ${e.title}`}
              aria-pressed={sel}
              className="group absolute top-0 flex h-[60px] w-6 -translate-x-1/2 items-start justify-center pt-1"
              style={{ left: `${left}%` }}
            >
              <span
                className={cn(
                  "block h-2.5 w-2.5 rotate-45 border transition-transform duration-fast ease-sf-out group-hover:scale-125",
                  sel ? "border-t1" : "border-sf-void",
                  LAYER_BG[e.layer],
                )}
              />
            </button>
          );
        })}
        {gens.filter((g) => g.i % labelEvery === 0).map((g) => (
          <span
            key={g.i}
            className="pointer-events-none absolute bottom-1 font-mono text-[12px] leading-none text-t4"
            style={{ left: `calc(${g.x0 * 100}% + 4px)` }}
          >
            G{g.i + 1}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {(Object.keys(LAYER_LABEL) as DriftLayer[]).map((l) => (
          <span key={l} className="inline-flex items-center gap-1.5 font-mono text-[12px] text-t3">
            <span className={cn("h-2 w-2 rotate-45", LAYER_BG[l])} aria-hidden="true" />
            {LAYER_LABEL[l]}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Inbreeding curve ───────────────────────────────────────────────────

export function InbreedingCurve({ fSeries, generations }: { fSeries: number[]; generations: number }): JSX.Element | null {
  if (fSeries.length < 2 || !(generations > 0)) return null;
  const n = fSeries.length - 1;
  const fMax = Math.max(F_DANGER * 1.3, ...fSeries) * 1.05;
  const y = (f: number) => 100 - (f / fMax) * 100;
  const x = (g: number) => (g / n) * 1000;
  const pts = fSeries.map((f, g) => `${x(g)},${y(f)}`).join(" ");
  const arrivalX = (Math.min(generations, n) / n) * 100;
  const lines = [
    { f: F_FIRST_COUSIN, label: "0.0625 FIRST COUSINS", cls: "stroke-sf-amber", text: "text-sf-amber-text" },
    { f: F_DANGER, label: "0.1 DANGER", cls: "stroke-sf-crimson", text: "text-sf-crimson-text" },
  ];
  return (
    <figure className="space-y-1">
      <div className="relative h-36 w-full border border-sf-line bg-sf-void">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
          {lines.map((l) => (
            <line key={l.f} x1={0} x2={1000} y1={y(l.f)} y2={y(l.f)} className={l.cls} strokeDasharray="6 6" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          <line x1={arrivalX * 10} x2={arrivalX * 10} y1={0} y2={100} className="stroke-sf-line-emphasis" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <polyline points={pts} fill="none" className="stroke-sf-emerald" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        </svg>
        {lines.map((l) => (
          <span key={l.f} className={cn("pointer-events-none absolute right-2 -translate-y-full font-mono text-[12px] leading-none", l.text)} style={{ top: `${y(l.f)}%` }}>
            {l.label}
          </span>
        ))}
        <span className="pointer-events-none absolute bottom-1 font-mono text-[12px] leading-none text-t3" style={{ left: `calc(${Math.min(arrivalX, 85)}% + 4px)` }}>
          ARRIVAL
        </span>
      </div>
      <figcaption className="text-[13px] text-t3">
        Average inbreeding coefficient F by generation, launch to arrival. Each generation of a population of effective size Nₑ adds 1/(2Nₑ) of new relatedness.
      </figcaption>
    </figure>
  );
}

// ─── MVP scale ──────────────────────────────────────────────────────────

const LOG_MIN = 1; // 10
const LOG_MAX = 5; // 100,000

function logPos(n: number): number {
  const l = Math.log10(Math.max(10, Math.min(100000, n)));
  return ((l - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;
}

export function MvpScale({ founding, ne }: { founding: number; ne: number }): JSX.Element {
  return (
    <div className="space-y-3">
      <div className="relative w-full border border-sf-line bg-sf-void" style={{ height: `${MVP_REFERENCES.length * 28 + 40}px` }}>
        {[10, 100, 1000, 10000, 100000].map((t) => (
          <span key={t} className="absolute top-0 h-full border-l border-sf-line-hairline" style={{ left: `${logPos(t)}%` }}>
            <span className="absolute bottom-1 left-1 whitespace-nowrap font-mono text-[12px] leading-none text-t4">{t.toLocaleString("en-US")}</span>
          </span>
        ))}
        {MVP_REFERENCES.map((m, i) => {
          const l = logPos(m.low);
          const r = logPos(m.high);
          return (
            <div key={m.id} className="absolute flex items-center" style={{ top: `${8 + i * 28}px`, left: `${l}%`, width: `${Math.max(1.5, r - l)}%`, height: "20px" }}>
              <span className="h-2.5 w-full border border-sf-stellar bg-sf-stellar/[0.12]" aria-hidden="true" />
              <span className={cn("absolute whitespace-nowrap font-mono text-[12px] leading-none text-t2", l > 60 ? "right-full mr-2" : "left-full ml-2")}>
                {m.label}
              </span>
            </div>
          );
        })}
        {[
          { v: founding, label: "CREW", cls: "border-t1" },
          { v: ne, label: "Nₑ", cls: "border-sf-emerald" },
        ].map((m) => (
          <span key={m.label} className={cn("absolute top-0 h-full border-l-2", m.cls)} style={{ left: `${logPos(m.v)}%` }} aria-hidden="true">
            <span className="absolute -top-0 left-1 bg-sf-void px-1 font-mono text-[12px] leading-none text-t1">{m.label}</span>
          </span>
        ))}
      </div>
      <p className="sr-only">
        Crew of {Math.round(founding)} and effective population of {Math.round(ne)} plotted against published minimum population estimates.
      </p>
    </div>
  );
}

// ─── Habitat cross-section ──────────────────────────────────────────────

export function HabitatSchematic({ form, results }: { form: GenShipFormState; results: GenShipResults }): JSX.Element {
  const h = form.habitat;
  const decks = results.habitat.decks;
  const R = 180; // drawn outer radius in viewBox units, centre (200, 200)
  const realDepth = decks.length * h.deckHeightM;
  const realRatio = h.radiusM > 0 ? realDepth / h.radiusM : 0;
  // Exaggerate a thin deck stack so the decks are visible; say so when we do.
  const drawnRatio = Math.min(0.6, Math.max(realRatio, 0.12));
  const exaggerated = drawnRatio > realRatio * 1.05;
  const band = R * drawnRatio;
  const deckStep = decks.length > 0 ? band / decks.length : 0;
  const spokes = h.shape === "cylinder" ? 0 : 6;
  const isCyl = h.shape === "cylinder";

  return (
    <figure className="space-y-2">
      <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_1fr] md:items-center">
        <div className="relative mx-auto aspect-square w-full max-w-[320px]">
          <svg viewBox="0 0 400 400" className="h-full w-full" role="img" aria-label={`${isCyl ? "Cylinder" : "Ring"} cross-section, radius ${Math.round(h.radiusM)} metres, ${decks.length} decks`}>
            <circle cx={200} cy={200} r={R} className="fill-sf-surface stroke-sf-line-emphasis" strokeWidth={1.5} />
            <circle cx={200} cy={200} r={R - band} className="fill-sf-void stroke-sf-line" strokeWidth={1} />
            {decks.map((d, i) => (
              <circle key={d.index} cx={200} cy={200} r={R - i * deckStep} fill="none" className="stroke-sf-teal" strokeWidth={i === 0 ? 2 : 1} />
            ))}
            {Array.from({ length: spokes }, (_, i) => {
              const a = (i / spokes) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={200 + Math.cos(a) * 18}
                  y1={200 + Math.sin(a) * 18}
                  x2={200 + Math.cos(a) * (R - band)}
                  y2={200 + Math.sin(a) * (R - band)}
                  className="stroke-sf-line"
                  strokeWidth={3}
                />
              );
            })}
            {isCyl && (
              <circle cx={200} cy={200} r={(R - band) * 0.35} className="fill-sf-amber/[0.15] stroke-sf-amber" strokeWidth={1} />
            )}
            <circle cx={200} cy={200} r={16} className="fill-sf-surface-elevated stroke-sf-line-emphasis" strokeWidth={1.5} />
            {/* Spin direction */}
            <path d={`M ${200 + R + 8} 200 A ${R + 8} ${R + 8} 0 0 1 ${200 + (R + 8) * Math.cos(0.5)} ${200 + (R + 8) * Math.sin(0.5)}`} fill="none" className="stroke-sf-primary" strokeWidth={2} />
            {/* Radius line */}
            <line x1={200} y1={200} x2={200} y2={200 - R} className="stroke-t3" strokeWidth={1} strokeDasharray="4 4" />
          </svg>
          <span className="pointer-events-none absolute left-1/2 top-[22%] ml-2 font-mono text-[12px] text-t2">R {fmt(h.radiusM, 0)} m</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
          {decks.map((d) => (
            <div key={d.index} className="contents">
              <dt className="font-heading uppercase tracking-[0.12em] text-[12px] text-t4">Deck {d.index + 1}</dt>
              <dd className="font-mono text-t1">
                {d.g.toFixed(2)} g <span className="text-t4">· {fmt(d.areaM2, 0)} m²</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <figcaption className="text-[13px] text-t3">
        {isCyl ? "Cylinder" : "Ring"} seen along the spin axis. Teal circles are deck floors, outermost first; gravity falls on every deck inward.
        {isCyl ? " The amber core is the low-gravity axis zone." : " Spokes carry lifts to the hub."}
        {exaggerated ? " Deck depth is exaggerated so the decks are visible; at true scale they would be a hairline." : ""}
      </figcaption>
    </figure>
  );
}

// ─── Deck plan allocation ───────────────────────────────────────────────

export function DeckPlan({ results }: { results: GenShipResults }): JSX.Element | null {
  const h = results.habitat;
  const total = Math.max(h.availableAreaM2, h.requiredAreaM2);
  if (!(total > 0)) return null;
  const infra = h.requiredAreaM2 - h.cropAreaM2 - h.livingAreaM2;
  const free = Math.max(0, h.availableAreaM2 - h.requiredAreaM2);
  const short = Math.max(0, h.requiredAreaM2 - h.availableAreaM2);
  const segments = [
    { id: "crops", label: "CROPS", v: h.cropAreaM2, cls: "bg-sf-emerald/[0.35] border-sf-emerald", text: "text-sf-emerald-text" },
    { id: "living", label: "LIVING", v: h.livingAreaM2, cls: "bg-sf-violet/[0.35] border-sf-violet", text: "text-sf-violet-text" },
    { id: "infra", label: "MACHINERY & CORRIDORS", v: infra, cls: "bg-sf-amber/[0.25] border-sf-amber", text: "text-sf-amber-text" },
    { id: "free", label: "SPARE", v: free, cls: "bg-sf-surface border-sf-line", text: "text-t3" },
    { id: "short", label: "// SHORTFALL", v: short, cls: "bg-sf-crimson/[0.25] border-sf-crimson", text: "text-sf-crimson-text" },
  ].filter((s) => s.v > 0);

  return (
    <div className="space-y-2">
      <div className="flex h-10 w-full overflow-hidden border border-sf-line" role="img" aria-label="Deck area allocation">
        {segments.map((s) => (
          <div key={s.id} className={cn("h-full border-r", s.cls)} style={{ width: `${(s.v / total) * 100}%` }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <li key={s.id} className={cn("font-mono text-[12px]", s.text)}>
            {s.label} <span className="text-t2">{fmt(s.v, 0)} m²</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
