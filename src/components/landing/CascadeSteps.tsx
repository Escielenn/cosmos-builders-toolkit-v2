// ---------------------------------------------------------------------------
// "How it works": the cascade in three steps, each a small vignette built
// from the product's own UI vocabulary (readouts, stale marks, the
// canon-changed badge) in HTML/CSS, so it follows the theme and never goes
// stale the way a screenshot does. Shared by the landing and Features.
// ---------------------------------------------------------------------------

import { cn } from "@/lib/utils";

const vignetteFrame = "border border-sf-line bg-sf-surface";

function VignetteBar({ left, right }: { left: string; right?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-sf-line-hairline px-4 py-2">
      <span className="font-mono text-sf-mono uppercase text-t4">{left}</span>
      {right && <span className="font-mono text-sf-mono uppercase text-t4">{right}</span>}
    </div>
  );
}

/** Step 1: a parameter being set. */
export function DecideVignette(): JSX.Element {
  return (
    <figure className={vignetteFrame} aria-label="A planetary profile with surface gravity set to 1.8 g">
      <VignetteBar left="Genesis · Planetary profile" />
      <div className="space-y-5 px-4 py-5">
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-sans text-xs font-medium uppercase text-t3">Surface gravity</span>
            <span className="font-mono text-lg text-t1">
              1.8 <span className="text-sf-mono text-t4">g</span>
            </span>
          </div>
          <div className="relative h-1 bg-sf-line-interactive" aria-hidden>
            <div className="absolute inset-y-0 left-0 w-[58%] bg-sf-primary" />
            <div className="absolute top-1/2 left-[58%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 border-2 border-sf-primary bg-sf-void" />
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <dt className="font-mono text-sf-mono uppercase text-t4">Star</dt>
          <dd className="text-right font-mono text-sm text-t2">K2 V</dd>
          <dt className="font-mono text-sf-mono uppercase text-t4">Day</dt>
          <dd className="text-right font-mono text-sm text-t2">31.4 h</dd>
        </dl>
      </div>
    </figure>
  );
}

const DERIVED = [
  { label: "Escape velocity", value: "15.2 km/s", layer: "bg-sf-amber" },
  { label: "Tallest trees", value: "31 m", layer: "bg-sf-emerald" },
  { label: "Verrid stature", value: "1.3 m", layer: "bg-sf-magenta" },
  { label: "Sky-burial rite", value: "revised", layer: "bg-sf-stellar" },
] as const;

/** Step 2: everything downstream marked stale, offered, not silently recomputed. */
export function ShiftVignette(): JSX.Element {
  return (
    <figure className={vignetteFrame} aria-label="Four derived values marked stale after the gravity change">
      <VignetteBar left="Parameter revised" right="4 stale" />
      <ul className="divide-y divide-sf-line-hairline">
        {DERIVED.map((d) => (
          <li key={d.label} className="flex items-center gap-3 px-4 py-2.5">
            <span aria-hidden className={cn("h-2 w-2 shrink-0", d.layer)} />
            <span className="flex-1 text-sm text-t2">{d.label}</span>
            <span className="font-mono text-sm text-t1">{d.value}</span>
            <span className="rounded-sf-tag border border-sf-amber px-1.5 font-mono text-sf-mono uppercase text-sf-amber-text">
              Stale
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Step 3: the scenes that depend on it say so. */
export function PageKnowsVignette(): JSX.Element {
  return (
    <figure className={vignetteFrame} aria-label="A scene flagged canon-changed in the binder">
      <VignetteBar left="Binder · Act I" />
      <div className="space-y-3 px-4 py-4">
        <div className="border-l-2 border-sf-primary bg-sf-primary/[0.06] px-3 py-2.5">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="text-sm text-t1">Ch. 3 · The long climb</span>
            <span className="rounded-sf-tag border border-sf-primary px-1.5 font-mono text-sf-mono uppercase text-sf-primary-text">
              Canon changed
            </span>
          </div>
          <p className="font-mono text-sf-mono uppercase text-t4">Gravity 1.4 → 1.8 g</p>
        </div>
        <p className="px-3 font-serif text-[15px] leading-[1.7] text-t2">
          Every step up the stair was a negotiation with her own weight…
        </p>
        <div className="px-3 py-1 text-sm text-t3">Ch. 4 · Salt market</div>
      </div>
    </figure>
  );
}

export const CASCADE_STEPS = [
  {
    n: "01",
    title: "Decide a number",
    body: "Set what is true in an instrument: a star, a gravity, a sense, a god. It goes on file as canon.",
    detail:
      "Every instrument writes to one canon graph, so the planet you define in Genesis is the planet Phylo evolves life on and the planet Dossier's characters were born under.",
    Vignette: DecideVignette,
  },
  {
    n: "02",
    title: "The world shifts",
    body: "Everything downstream of that decision is marked stale and offered back to you. Nothing changes behind your back.",
    detail:
      "Physics shapes environment, environment shapes biology, biology shapes minds, minds make myths, myths make culture. Change one and the rest knows.",
    Vignette: ShiftVignette,
  },
  {
    n: "03",
    title: "The page knows",
    body: "Scenes that lean on the old value say so in the binder, and contradictions surface while you write.",
    detail:
      "Claims in your prose are captured as proposed canon. The prose itself is never edited for you; the Studio only points.",
    Vignette: PageKnowsVignette,
  },
] as const;

export function CascadeSteps({ detailed = false }: { detailed?: boolean }): JSX.Element {
  return (
    <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
      {CASCADE_STEPS.map(({ n, title, body, detail, Vignette }) => (
        <li key={n} className="flex flex-col">
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-mono text-sf-mono text-sf-primary-text">{n}</span>
            <h3 className="font-heading text-sf-h3 font-normal text-t1">{title}</h3>
          </div>
          <p className="mb-6 text-sf-body text-t2">{body}</p>
          {detailed && <p className="mb-6 -mt-2 text-sm leading-[1.6] text-t2">{detail}</p>}
          <div className="mt-auto">
            <Vignette />
          </div>
        </li>
      ))}
    </ol>
  );
}
