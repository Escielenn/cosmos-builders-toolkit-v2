// ConfidenceTag, the canon tier of a fact: CANON / PROPOSED / PROJECTED.
//
// Colour and text together, never colour alone. Teal is Integration (the
// graph itself holds it), amber is a warning (awaiting adoption), and a
// projected value, the computed-on-read majority, recedes to a quiet line
// rather than an accent so the two stored tiers stand out.

import { Tag } from "@/components/ui/tag";
import type { Confidence } from "@/canon/types";

const STYLE: Record<Confidence, { variant: "teal" | "amber"; className: string; title: string }> = {
  canon: {
    variant: "teal",
    className: "text-sf-teal-text",
    title: "Canon: adopted by the writer. Outranks any computed value.",
  },
  proposed: {
    variant: "amber",
    className: "text-sf-amber-text",
    title: "Proposed: asserted, not yet adopted as canon.",
  },
  projected: {
    variant: "teal",
    className: "bg-transparent border-sf-line text-t3",
    title: "Projected: computed from its source on read.",
  },
};

export function ConfidenceTag({
  confidence = "projected",
  outranked = false,
}: {
  confidence?: Confidence;
  /** A stored fact outranks this one for the same subject and predicate. */
  outranked?: boolean;
}): JSX.Element {
  const s = STYLE[confidence];
  const title = outranked ? `${s.title} Outranked by a stored fact.` : s.title;
  return (
    <Tag variant={s.variant} className={s.className} title={title}>
      {confidence.toUpperCase()}
      {outranked && <span aria-hidden="true">·</span>}
      {outranked && "OUTRANKED"}
    </Tag>
  );
}

export default ConfidenceTag;
