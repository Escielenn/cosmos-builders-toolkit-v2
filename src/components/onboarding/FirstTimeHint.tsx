import { X } from "lucide-react";
import { useHintDismissed } from "@/hooks/use-hint-dismissed";
import { HINTS } from "@/lib/onboarding/hints";
import type { LucideIcon } from "lucide-react";

interface FirstTimeHintProps {
  hintId: string;
  icon?: LucideIcon;
  variant?: "default" | "warning" | "compact";
  className?: string;
}

const FirstTimeHint = ({ hintId, icon: Icon, variant, className = "" }: FirstTimeHintProps) => {
  const [isDismissed, dismiss] = useHintDismissed(hintId);
  const hint = HINTS[hintId];

  if (isDismissed || !hint) return null;

  const resolvedVariant = variant ?? hint.variant;

  const borderColor =
    resolvedVariant === "warning"
      ? "border-amber-500/20"
      : "border-primary/20";

  const bgColor =
    resolvedVariant === "warning"
      ? "bg-amber-500/5"
      : "bg-primary/5";

  const textColor =
    resolvedVariant === "warning"
      ? "text-sf-amber/70"
      : "text-primary/70";

  const iconColor =
    resolvedVariant === "warning"
      ? "text-sf-amber/60"
      : "text-primary/60";

  const fontSize =
    resolvedVariant === "compact"
      ? "text-[12px]"
      : "text-[12px]";

  const iconSize =
    resolvedVariant === "compact"
      ? "w-3 h-3"
      : "w-3.5 h-3.5";

  return (
    <div
      className={`relative border ${borderColor} ${bgColor} px-3 py-2 animate-in fade-in duration-300 ${className}`}
    >
      <div className="flex items-start gap-2 pr-5">
        {Icon && (
          <Icon className={`${iconSize} ${iconColor} shrink-0 mt-0.5`} />
        )}
        <p className={`font-mono ${fontSize} uppercase tracking-wider ${textColor} leading-relaxed`}>
          {hint.copy}
        </p>
      </div>
      <button
        onClick={dismiss}
        className="absolute top-1.5 right-1.5 text-t3/30 hover:text-t3/60 transition-colors"
        aria-label="Dismiss hint"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export default FirstTimeHint;
