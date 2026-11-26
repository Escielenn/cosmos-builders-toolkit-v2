import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A still of the Studio: one scene and the canon rail beside it. Static
 * markup, not a screenshot, so it follows the user's theme and stays crisp.
 * The scene is the North Star's: a Verrid POV cannot see a red sunset.
 */
export function StudioGlimpse({ className }: { className?: string }): JSX.Element {
  return (
    <figure
      className={cn("relative border border-sf-line bg-sf-surface sf-panel-glow", className)}
      aria-label="The Studio: a scene beside its canon rail"
    >
      <div className="flex items-center justify-between gap-3 border-b border-sf-line-hairline px-4 py-2.5">
        <span className="font-mono text-sf-mono uppercase text-t4">Ch. 14 · Scene 2</span>
        <span className="font-mono text-sf-mono uppercase text-t4">1,284 words</span>
      </div>

      <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,210px)]">
        {/* The page */}
        <div className="px-5 py-6 sm:border-r sm:border-sf-line-hairline">
          <p className="font-serif text-[17px] leading-[1.75] text-t2">
            Ilsevar stood at the rim while the sun went down behind the spires,{" "}
            <span className="text-t1 underline decoration-sf-amber decoration-2 underline-offset-4">
              watching the sky bleed red
            </span>
            . Somewhere below, the mourners began the song, all{" "}
            <span className="text-t1 underline decoration-sf-primary decoration-dotted decoration-2 underline-offset-4">
              seven tones of it
            </span>
            .
          </p>
        </div>

        {/* The canon rail */}
        <div className="space-y-4 border-t border-sf-line-hairline px-4 py-5 sm:border-t-0">
          <div>
            <p className="mb-1 font-mono text-sf-mono uppercase text-t4">POV · Verrid</p>
            <p className="text-[13px] leading-snug text-t2">No trichromatic vision. Hears infrasound.</p>
          </div>
          <div className="border-l-2 border-sf-amber pl-3">
            <p className="mb-1 flex items-center gap-1.5 font-mono text-sf-mono uppercase text-sf-amber-text">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Contradiction
            </p>
            <p className="text-[13px] leading-snug text-t2">"bleed red" vs. Sensorium canon</p>
          </div>
          <div className="border-l-2 border-sf-primary pl-3">
            <p className="mb-1 font-mono text-sf-mono uppercase text-sf-primary-text">Claim detected</p>
            <p className="text-[13px] leading-snug text-t2">Mourning song: 7 tones</p>
            <p className="mt-1.5 font-mono text-sf-mono uppercase text-t3">Adopt as canon?</p>
          </div>
        </div>
      </div>

      <figcaption className="border-t border-sf-line-hairline px-4 py-2.5 font-mono text-sf-mono uppercase text-t4">
        Gravity 1.8 g · Epoch 2340 CE
      </figcaption>
    </figure>
  );
}
