// ---------------------------------------------------------------------------
// Planet preview — PlanetScene on forge-gl, side by side with the iframes it
// will replace (Tidelock, ExoForge). A NEW route; the iframes stay until the
// scene reads canon through bind/ and the owner has seen it.
//
// Two ways in:
//   ?entityId=<uuid>   a planet from canon. Its facts are read through
//                      bind/planet-scene-canon (canon first, then what a
//                      simulator published). Clicking the planet or the star
//                      opens its canon entry (Law III).
//   ?preset=<id>       a reference world (Earth-like, locked ocean world,
//                      airless M-dwarf world, Venus analogue, ringed giant).
//
// The controls are the same quantities Tidelock and ExoForge take. Moving
// one changes the PREVIEW ONLY: nothing here is saved (Law I: explicitly
// ephemeral), and when the world came from canon the panel says the preview
// now differs and points to the entry where canon is edited.
// ---------------------------------------------------------------------------

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import SimulatorTitle from "@/components/simulators/SimulatorTitle";
import { SIM_MAIN } from "@/components/simulators/sim-chrome";
import { Loader } from "@/components/ui/loader";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { useSubjectEntityId } from "@/hooks/use-subject-entity";
import { useCanonFacts } from "@/canon/hooks";
import { getEntry } from "@/services/world-entries";
import { codexHref } from "@/lib/recent-work";
import { bindPlanetScene, type PlanetSceneFacts } from "@/gl/bind/planet-scene";
import { PLANET_PRESETS, presetById } from "@/gl/bind/planet-presets";
import { planetSceneFactsFromCanon } from "@/gl/bind/planet-scene-canon";
import type { PlanetSceneTarget } from "@/gl/scenes/PlanetScene";
import { cn } from "@/lib/utils";

const PlanetScene = lazy(() => import("@/gl/scenes/PlanetScene"));

const STAR_TYPES = ["M8V", "M5V", "M3V", "M0V", "K5V", "K3V", "K0V", "G5V", "G2V", "F5V", "F0V", "A5V"] as const;
const COMPOSITIONS = [
  { id: "N2 78%, O2 21%, Ar 1%", label: "Nitrogen–oxygen" },
  { id: "N2 90%, CO2 10%", label: "Nitrogen, some CO₂" },
  { id: "CO2 96.5%, N2 3.5%", label: "Carbon dioxide" },
  { id: "N2 95%, CH4 5%", label: "Nitrogen–methane" },
  { id: "H2 86%, He 14%", label: "Hydrogen–helium" },
] as const;

type Lock = "auto" | "locked" | "turning";

const fmt = (n: number, digits = 0) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }) : "—";

function Readout({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-sf-line-hairline py-1.5">
      <dt className="font-sans text-[12px] font-medium uppercase text-t3">{label}</dt>
      <dd className="m-0 text-right font-mono text-[13px] text-t1">
        {value}
        {unit && <span className="ml-1 text-[12px] text-t4">{unit}</span>}
      </dd>
    </div>
  );
}

function Control({
  id,
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
  display,
}: {
  id: string;
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display?: string;
}) {
  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="font-mono text-[12px] text-t2">
          {display ?? fmt(value, step < 1 ? (step < 0.01 ? 3 : 2) : 0)}
          {unit && <span className="ml-1 text-t4">{unit}</span>}
        </span>
      </div>
      <Slider
        id={id}
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        className="min-h-hit"
      />
    </div>
  );
}

const PANEL = "border border-sf-line bg-sf-surface/90 backdrop-blur-sf-panel px-[18px] py-[14px]";
const CHIP =
  "min-h-hit px-3 font-sans text-[13px] font-medium border transition-sf duration-fast ease-sf-out focus-visible:outline-none";

export default function PlanetPreview() {
  useMetaTags({ title: "Planet preview" });
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const entityId = useSubjectEntityId();
  const presetId = params.get("preset");

  // -- Canon ---------------------------------------------------------------
  const entryQuery = useQuery({
    queryKey: ["planet-preview-entry", entityId],
    queryFn: () => getEntry(entityId!),
    enabled: !!entityId,
    staleTime: 30_000,
  });
  const entry = entryQuery.data ?? null;
  const factsQuery = useCanonFacts(entry?.world_id ?? undefined);
  const parentQuery = useQuery({
    queryKey: ["planet-preview-entry", entry?.parent_id],
    queryFn: () => getEntry(entry!.parent_id!),
    enabled: !!entry?.parent_id,
    staleTime: 30_000,
  });
  const parent = parentQuery.data ?? null;

  const canonFacts = useMemo<PlanetSceneFacts | null>(
    () => (entry ? planetSceneFactsFromCanon({ entry, facts: factsQuery.data ?? [] }) : null),
    [entry, factsQuery.data],
  );

  // -- Preview inputs (ephemeral) -------------------------------------------
  const base = canonFacts ?? (presetById(presetId) ?? PLANET_PRESETS[0]).facts;
  const [edits, setEdits] = useState<Partial<PlanetSceneFacts>>({});
  const [lock, setLock] = useState<Lock>("auto");
  useEffect(() => {
    setEdits({});
    setLock("auto");
  }, [base]);
  const facts = useMemo<PlanetSceneFacts>(() => {
    const merged = { ...base, ...edits };
    if (lock !== "auto") merged.tidallyLocked = lock === "locked";
    return merged;
  }, [base, edits, lock]);
  const binding = useMemo(() => bindPlanetScene(facts), [facts]);
  const edited = Object.keys(edits).length > 0 || lock !== "auto";
  const set = <K extends keyof PlanetSceneFacts>(k: K, v: PlanetSceneFacts[K]) => setEdits((e) => ({ ...e, [k]: v }));

  // -- Click-to-canon ---------------------------------------------------------
  const [status, setStatus] = useState<string | null>(null);
  const [tier, setTier] = useState<{ id: string; reason: string } | null>(null);
  const onTier = useCallback((id: string, reason: string) => setTier({ id, reason }), []);
  const open = useCallback(
    (target: PlanetSceneTarget) => {
      const e = target === "planet" ? entry : parent;
      if (e) navigate(codexHref({ id: e.id, world_id: e.world_id }));
      else setStatus(target === "planet" ? "PLANET NOT IN CANON. PREVIEW ONLY." : "STAR NOT IN CANON. PREVIEW ONLY.");
    },
    [entry, parent, navigate],
  );

  const choosePreset = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("preset", id);
    next.delete("entityId");
    next.delete("entity");
    setParams(next, { replace: true });
    setStatus(null);
  };

  const b = binding;
  const loadingCanon = !!entityId && (entryQuery.isLoading || factsQuery.isLoading);
  const starLabel = parent?.entry_type === "star" ? "Open star entry" : "Open system entry";

  return (
    <div className="min-h-screen bg-sf-void flex flex-col">
      <Header />
      <main id="main" tabIndex={-1} className={cn(SIM_MAIN, "max-lg:h-auto")} style={{ marginTop: 64 }}>
        {/* Stage: full-bleed at lg+, a fixed-height band above the panels on phones. */}
        <div className="relative h-[58dvh] shrink-0 lg:absolute lg:inset-0 lg:h-auto">
          {loadingCanon ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader message="READING CANON" />
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader message="LOADING RENDER ENGINE" />
                </div>
              }
            >
              <PlanetScene facts={facts} binding={b} onSelect={open} onTier={onTier} className="absolute inset-0" />
            </Suspense>
          )}
          <SimulatorTitle
            name="Planet preview"
            subtitle="forge-gl · preview"
            context={entry ? entry.title : presetById(presetId)?.label ?? PLANET_PRESETS[0].label}
          />
        </div>

        <div className="flex flex-col gap-3 p-3 lg:contents">
          {/* Controls: left, under the title (doc 11 panel placement). */}
          <section
            aria-label="Preview inputs"
            className={cn(PANEL, "lg:absolute lg:left-[18px] lg:top-[108px] lg:z-10 lg:w-[260px] lg:max-h-[calc(100%-200px)] lg:overflow-y-auto sf-sb")}
          >
            <h2 className="mb-2 font-heading text-sf-eyebrow uppercase text-t4">World</h2>
            <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Reference worlds">
              {PLANET_PRESETS.map((p) => {
                const active = !entry && (presetId ?? PLANET_PRESETS[0].id) === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => choosePreset(p.id)}
                    className={cn(
                      CHIP,
                      active
                        ? "bg-sf-primary/[0.06] border-sf-primary text-sf-primary-text"
                        : "border-sf-line text-t2 hover:border-sf-line-emphasis hover:text-t1",
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <p className="mb-2 font-sans text-[13px] leading-snug text-t2">
              {entry ? "Read from canon." : "Reference values."} Changes here are a preview and are not saved.
            </p>
            {entry && edited && (
              <p className="mb-2 font-sans text-[13px] leading-snug text-sf-amber-text" role="status">
                // Preview differs from canon.{" "}
                <Link className="underline text-sf-primary-text" to={codexHref({ id: entry.id, world_id: entry.world_id })}>
                  Edit the entry
                </Link>{" "}
                to change it.
              </p>
            )}

            <h2 className="mb-1 mt-3 font-heading text-sf-eyebrow uppercase text-t4">Star</h2>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Star type">
              {STAR_TYPES.map((s) => {
                const active = (b.star.spectralClass ?? "").toUpperCase() === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setEdits((e) => ({ ...e, spectralClass: s, starTeffK: null, starLuminosityLsun: null, starMassMsun: null, starRadiusRsun: null }))}
                    className={cn(
                      CHIP,
                      "px-2 font-mono text-[12px]",
                      active ? "bg-sf-primary/[0.06] border-sf-primary text-sf-primary-text" : "border-sf-line text-t2 hover:border-sf-line-emphasis",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            <h2 className="mb-1 mt-3 font-heading text-sf-eyebrow uppercase text-t4">Orbit and body</h2>
            <Control id="pp-a" label="Orbit" unit="AU" value={b.aAU} min={0.01} max={12} step={0.001} onChange={(v) => set("aAU", v)} display={fmt(b.aAU, b.aAU < 0.1 ? 4 : 3)} />
            <Control id="pp-mass" label="Mass" unit="M⊕" value={b.massEarth} min={0.05} max={320} step={0.01} onChange={(v) => setEdits((e) => ({ ...e, massEarth: v, radiusEarth: null }))} display={fmt(b.massEarth, 2)} />
            <Control id="pp-albedo" label="Albedo" value={b.albedo} min={0.03} max={0.9} step={0.01} onChange={(v) => set("albedo", v)} />
            <Control id="pp-tilt" label="Axial tilt" unit="°" value={(b.tilt * 180) / Math.PI} min={0} max={180} step={0.5} onChange={(v) => set("obliquityDeg", v)} display={fmt((b.tilt * 180) / Math.PI, 1)} />

            <div className="py-1.5" role="group" aria-label="Rotation">
              <Label>Rotation</Label>
              <div className="mt-1 flex gap-1">
                {(["auto", "locked", "turning"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={lock === l}
                    onClick={() => setLock(l)}
                    className={cn(
                      CHIP,
                      "flex-1 px-2",
                      lock === l ? "bg-sf-primary/[0.06] border-sf-primary text-sf-primary-text" : "border-sf-line text-t2 hover:border-sf-line-emphasis",
                    )}
                  >
                    {l === "auto" ? "From physics" : l === "locked" ? "Locked" : "Turning"}
                  </button>
                ))}
              </div>
            </div>

            {b.kind === "rocky" && (
              <>
                <h2 className="mb-1 mt-3 font-heading text-sf-eyebrow uppercase text-t4">Air and water</h2>
                <Control id="pp-p" label="Pressure" unit="bar" value={b.pressureBar} min={0} max={100} step={0.01} onChange={(v) => set("pressureBar", v)} display={fmt(b.pressureBar, b.pressureBar < 10 ? 2 : 0)} />
                <div className="py-1.5">
                  <Label htmlFor="pp-comp">Composition</Label>
                  <select
                    id="pp-comp"
                    value={COMPOSITIONS.find((c) => c.id === facts.composition)?.id ?? ""}
                    onChange={(e) => set("composition", e.target.value || null)}
                    className="sf-field mt-1 w-full min-h-hit rounded-none bg-sf-surface px-2 font-sans text-[16px] text-t1"
                  >
                    <option value="">{facts.composition ? `Canon: ${facts.composition}` : "Not set"}</option>
                    {COMPOSITIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Control id="pp-gh" label="Greenhouse τ" value={b.greenhouseTau} min={0} max={200} step={0.01} onChange={(v) => set("greenhouseTau", v)} display={fmt(b.greenhouseTau, b.greenhouseTau < 10 ? 2 : 0)} />
                <Control id="pp-ocean" label="Ocean" unit="%" value={b.water.fraction * 100} min={0} max={100} step={1} onChange={(v) => set("hydrosphere", v / 100)} />
                <Control id="pp-cloud" label="Cloud cover" unit="%" value={b.clouds.coverage * 100} min={0} max={100} step={1} onChange={(v) => set("cloudCover", v / 100)} />
              </>
            )}

            <h2 className="mb-1 mt-3 font-heading text-sf-eyebrow uppercase text-t4">From canon</h2>
            <div className="flex min-h-hit items-center justify-between">
              <Label htmlFor="pp-civ">Civilisation</Label>
              <Switch id="pp-civ" checked={facts.civilisation === true} onCheckedChange={(v) => set("civilisation", v || null)} />
            </div>
            <div className="flex min-h-hit items-center justify-between">
              <Label htmlFor="pp-life">Photosynthetic life</Label>
              <Switch id="pp-life" checked={facts.life === true} onCheckedChange={(v) => set("life", v || null)} />
            </div>
            <div className="flex min-h-hit items-center justify-between">
              <Label htmlFor="pp-rings">Rings</Label>
              <Switch id="pp-rings" checked={!!facts.rings} onCheckedChange={(v) => set("rings", v ? { inner: 1.3, outer: 2.2 } : null)} />
            </div>
          </section>

          {/* Readout: top right. */}
          <section
            aria-label="Readout"
            className={cn(PANEL, "max-lg:order-first lg:absolute lg:right-[58px] lg:top-[18px] lg:z-10 lg:w-[260px] lg:max-h-[calc(100%-120px)] lg:overflow-y-auto sf-sb")}
          >
            <h2 className="mb-1 font-heading text-sf-eyebrow uppercase text-t4">{b.name}</h2>
            <dl className="m-0">
              <Readout label="Star" value={`${b.star.spectralClass ?? "—"} · ${fmt(b.star.teffK)}`} unit="K" />
              <Readout label="Insolation" value={fmt(b.insolation, b.insolation < 10 ? 2 : 0)} unit="S⊕" />
              <Readout label="Equilibrium" value={fmt(b.temperature.equilibrium)} unit="K" />
              <Readout
                label="Surface"
                value={b.kind === "rocky" ? `${fmt(b.temperature.min)}–${fmt(b.temperature.max)}` : fmt(b.temperature.mean)}
                unit="K"
              />
              <Readout label="Rotation" value={b.tidallyLocked ? "Locked" : fmt(b.rotationHours, 1)} unit={b.tidallyLocked ? undefined : "h"} />
              {b.tidallyLocked && <Readout label="Heat carried" value={fmt(b.epsilon * 100)} unit="%" />}
              <Readout label="Air τ (550 nm)" value={b.atmosphere.present ? fmt(b.atmosphere.scattering.tau550, 3) : "None"} />
              {b.kind === "rocky" && <Readout label="Ocean" value={fmt(b.water.fraction * 100)} unit="%" />}
              {b.water.bandDeg && (
                <Readout label="Liquid band" value={`${fmt(b.water.bandDeg.inner)}–${fmt(b.water.bandDeg.outer)}`} unit="° from star" />
              )}
              {b.kind !== "rocky" && <Readout label="Cloud class" value={b.kind === "ice" ? "Ice giant" : `Sudarsky ${b.sudarsky}`} />}
            </dl>

            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => open("planet")}
                className={cn(CHIP, entry ? "border-sf-primary bg-sf-primary/[0.06] text-sf-primary-text" : "border-sf-line text-t2")}
              >
                {entry ? "Open planet entry" : "Planet entry"}
              </button>
              <button
                type="button"
                onClick={() => open("star")}
                className={cn(CHIP, parent ? "border-sf-primary bg-sf-primary/[0.06] text-sf-primary-text" : "border-sf-line text-t2")}
              >
                {parent ? starLabel : "Star entry"}
              </button>
              <p className="m-0 font-sans text-[13px] leading-snug text-t2">
                {entry ? "Click the planet or the star to open it." : "A reference world has no entry. Publish a planet from Tidelock or ExoForge, then open it here."}
              </p>
              {status && (
                <p className="m-0 font-mono text-[12px] text-sf-amber-text" role="status" aria-live="polite">
                  {status}
                </p>
              )}
            </div>

            {b.notes.length > 0 && (
              <details className="mt-3">
                <summary className="min-h-hit cursor-pointer py-2 font-sans text-[13px] font-medium text-t2">
                  What this render inferred ({b.notes.length})
                </summary>
                <ul className="m-0 list-none p-0">
                  {b.notes.map((n) => (
                    <li key={n} className="border-b border-sf-line-hairline py-1.5 font-sans text-[13px] leading-snug text-t2">
                      {n}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          {/* Tier: bottom right. */}
          <div className={cn(PANEL, "lg:absolute lg:bottom-[18px] lg:right-[58px] lg:z-10 lg:max-w-[320px] py-2")}>
            <p className="m-0 font-sans text-[12px] font-medium uppercase text-t3">
              {tier ? `${tier.id.charAt(0).toUpperCase()}${tier.id.slice(1)} tier` : "Measuring"}
            </p>
            <p className="m-0 font-sans text-[13px] leading-snug text-t2">
              {tier?.reason}{" "}
              <Link to="/profile" className="text-sf-primary-text underline">
                Display settings
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
