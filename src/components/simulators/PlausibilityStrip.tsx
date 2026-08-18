import type { PlausibilityNote } from "@/lib/simulators/plausibility-notes";

interface PlausibilityStripProps {
  notes: PlausibilityNote[];
}

export function PlausibilityStrip({ notes }: PlausibilityStripProps) {
  if (notes.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      {notes.map((n) => (
        <p key={n.key} className="border-l border-sf-border pl-3 font-serif text-[13px] italic leading-relaxed text-t3">
          {n.message}
        </p>
      ))}
    </div>
  );
}
