import { AlertTriangle, FileText, Plus } from "lucide-react";
import { MarketingSection, SectionHeading } from "./marketing-ui";

const FEATURES = [
  {
    label: "Contradiction flag",
    body: "Prose that disagrees with canon is underlined and filed in a ledger with three ways out: revise the line, amend the canon, or keep it as an unreliable narrator.",
  },
  {
    label: "Claim capture",
    body: "Write a new fact into a scene and the Studio offers to put it on file. One click adopts it; nothing is adopted for you.",
  },
  {
    label: "Canon-changed badge",
    body: "When a decision moves, every scene that leaned on it is marked in the binder, so revision starts where it matters.",
  },
] as const;

/**
 * The Studio: what writing feels like, as one compact panel (binder,
 * page, ledger) with three plain-language notes beside it.
 */
export default function StudioSection(): JSX.Element {
  return (
    <MarketingSection id="studio" labelledBy="studio-title">
      <SectionHeading
        id="studio-title"
        label="The Studio"
        title="A manuscript that argues back"
        lede="A Scrivener-style writing space, free with every account: binder, corkboard, outliner, snapshots and compile. The difference is that it knows your world."
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <StudioPanel />

        <ol className="space-y-8">
          {FEATURES.map((f, i) => (
            <li key={f.label} className="grid grid-cols-[auto_1fr] gap-x-4">
              <span className="pt-1 font-mono text-sf-mono text-sf-primary-text">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="mb-1.5 font-heading text-lg font-normal text-t1">{f.label}</h3>
                <p className="text-sf-body text-t2">{f.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </MarketingSection>
  );
}

function StudioPanel(): JSX.Element {
  return (
    <figure
      className="border border-sf-line bg-sf-surface"
      aria-label="The Studio: binder, scene and contradiction ledger"
    >
      <div className="grid md:grid-cols-[170px_minmax(0,1fr)_200px]">
        {/* Binder */}
        <div className="hidden border-r border-sf-line-hairline py-3 md:block">
          <p className="px-4 pb-2 font-mono text-sf-mono uppercase text-t4">Binder</p>
          <ul className="text-[13px]">
            <BinderRow title="Ch. 12 · Ashfall" />
            <BinderRow title="Ch. 13 · The rim" changed />
            <BinderRow title="Ch. 14 · Mourning" active />
            <BinderRow title="Ch. 15 · Descent" />
          </ul>
        </div>

        {/* Page */}
        <div className="px-5 py-5 md:px-6">
          <p className="mb-3 font-mono text-sf-mono uppercase text-t4">Ch. 14 · Scene 2</p>
          <p className="font-serif text-[16px] leading-[1.8] text-t2">
            The elders came down from the rim at dusk.{" "}
            <span className="text-t1 underline decoration-sf-amber decoration-2 underline-offset-4">
              Their eyes caught the last green of the sky
            </span>
            , and Ilsevar felt the infrasound of the drums before she heard it, a{" "}
            <span className="text-t1 underline decoration-sf-primary decoration-dotted decoration-2 underline-offset-4">
              nine-day vigil
            </span>{" "}
            beginning in the bones.
          </p>
        </div>

        {/* Ledger */}
        <div className="space-y-4 border-t border-sf-line-hairline px-4 py-4 md:border-t-0 md:border-l">
          <div className="border-l-2 border-sf-amber pl-3">
            <p className="mb-1 flex items-center gap-1.5 font-mono text-sf-mono uppercase text-sf-amber-text">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Contradiction
            </p>
            <p className="mb-2 text-[13px] leading-snug text-t2">Verrid see no green. Sensorium canon.</p>
            <ul className="space-y-1 font-mono text-sf-mono uppercase text-t3">
              <li>Revise prose</li>
              <li>Amend canon</li>
              <li>Unreliable narrator</li>
            </ul>
          </div>
          <div className="border-l-2 border-sf-primary pl-3">
            <p className="mb-1 flex items-center gap-1.5 font-mono text-sf-mono uppercase text-sf-primary-text">
              <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Claim
            </p>
            <p className="text-[13px] leading-snug text-t2">Vigil length: 9 days</p>
            <p className="mt-1 font-mono text-sf-mono uppercase text-t3">Adopt?</p>
          </div>
        </div>
      </div>
    </figure>
  );
}

function BinderRow({ title, active, changed }: { title: string; active?: boolean; changed?: boolean }) {
  return (
    <li
      className={
        active
          ? "flex items-center gap-2 border-l-2 border-sf-primary bg-sf-primary/[0.06] px-3.5 py-1.5 text-t1"
          : "flex items-center gap-2 border-l-2 border-transparent px-3.5 py-1.5 text-t3"
      }
    >
      <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {changed && (
        <span
          className="shrink-0 font-mono text-sf-mono text-sf-primary-text"
          role="img"
          aria-label="Canon changed"
          title="Canon changed"
        >
          Δ
        </span>
      )}
    </li>
  );
}
