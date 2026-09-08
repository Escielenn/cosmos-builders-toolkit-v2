/**
 * Render quality — how much the 3D scenes are allowed to spend.
 *
 * Lives inside Appearance rather than in a surface of its own: this is how
 * things look, which is what that page is already for (Law VII — name the view
 * you absorb, or do not add one).
 *
 * The control shows the decision AND its reason, because a quality setting
 * that silently does nothing is worse than none. When an accessibility or
 * legibility rule has forced the tier, the buttons say so plainly instead of
 * pretending the choice is live.
 */

import { MonitorCog } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useQualityTier } from "@/gl/engine/use-quality-tier";
import {
  readQualityOverride,
  setQualityOverride,
  type QualityOverride,
} from "@/gl/engine/quality-override";

const CHOICES: Array<{ id: QualityOverride; label: string; blurb: string }> = [
  { id: "auto", label: "Auto", blurb: "Measured from your own frames." },
  { id: "cinematic", label: "Cinematic", blurb: "Bloom, grain, full sharpness." },
  { id: "standard", label: "Standard", blurb: "Bloom at half resolution." },
  { id: "chart", label: "Chart", blurb: "Flat and still. Reads as an instrument." },
];

const RenderQualitySettings = () => {
  const tier = useQualityTier();
  const chosen = readQualityOverride();

  return (
    <div className="space-y-3">
      <Label>
        <span className="flex items-center gap-1.5">
          <MonitorCog className="h-3.5 w-3.5" aria-hidden />
          Render quality
        </span>
      </Label>

      <div className="grid grid-cols-2 gap-sf-2 sm:grid-cols-4">
        {CHOICES.map((choice) => {
          const selected = chosen === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => setQualityOverride(choice.id)}
              aria-pressed={selected}
              disabled={tier.forced && choice.id !== "auto"}
              className={cn(
                "flex min-h-hit flex-col items-start gap-sf-1 rounded-none border p-sf-3 text-left",
                "transition-sf duration-fast ease-sf-out",
                tier.forced && choice.id !== "auto"
                  ? "border-sf-disabled-line bg-sf-disabled-bg text-sf-disabled-text"
                  : selected
                    ? "border-sf-primary"
                    : "border-sf-line-interactive hover:border-sf-line-emphasis",
              )}
            >
              <span className="font-mono text-sf-mono uppercase text-t2">
                {choice.label}
              </span>
              <span className="text-[12px] leading-relaxed text-t3">
                {choice.blurb}
              </span>
            </button>
          );
        })}
      </div>

      <p className="font-mono text-sf-mono text-t4 sf-measure">
        {`// RUNNING AT ${tier.tier.toUpperCase()}. ${tier.reason.toUpperCase()}`}
        {tier.forced
          ? " THIS ONE IS NOT NEGOTIABLE — IT PROTECTS LEGIBILITY AND MOTION SENSITIVITY."
          : ""}
      </p>
    </div>
  );
};

export default RenderQualitySettings;
