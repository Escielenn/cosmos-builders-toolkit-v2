import type { LucideIcon } from "lucide-react";
import { useHintDismissed } from "@/hooks/use-hint-dismissed";
import { HINTS } from "@/lib/onboarding/hints";
import { Notice } from "@/components/layout/page-chrome";

/**
 * FirstTimeHint renders a one-time hint through the shared Notice
 * (15-PAGE-CHROME): a short mono label and a readable sentence-case body,
 * instead of a box of uppercase mono text.
 *
 * Hint copy is written "LABEL: body". The part before the first colon becomes
 * the label; the rest is the body.
 */
interface FirstTimeHintProps {
  hintId: string;
  icon?: LucideIcon;
  variant?: "default" | "warning" | "compact";
  className?: string;
}

export function splitHint(copy: string): { label: string | undefined; body: string } {
  const i = copy.indexOf(":");
  if (i > 0 && i < 40 && copy.slice(0, i) === copy.slice(0, i).toUpperCase()) {
    return { label: copy.slice(0, i).trim(), body: copy.slice(i + 1).trim() };
  }
  return { label: undefined, body: copy };
}

const FirstTimeHint = ({ hintId, icon: Icon, variant, className = "" }: FirstTimeHintProps) => {
  const [isDismissed, dismiss] = useHintDismissed(hintId);
  const hint = HINTS[hintId];
  if (isDismissed || !hint) return null;
  const resolved = variant ?? hint.variant;
  const { label, body } = splitHint(hint.copy);
  return (
    <Notice
      label={label}
      tone={resolved === "warning" ? "caution" : "info"}
      icon={Icon ? <Icon className="h-4 w-4" /> : undefined}
      onDismiss={dismiss}
      compact={resolved === "compact"}
      className={className}
    >
      {body}
    </Notice>
  );
};

export default FirstTimeHint;
