import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONDITIONS_BRIEF_LABEL, type BriefLine } from "@/lib/simulators/scene-prose";

/**
 * Conditions brief (doc 11 §3): a labelled, cited field-manual entry about
 * what is physically true where a scene is set. Replaces "Describe This
 * Scene". It never writes into the manuscript: there is no insert button,
 * and the text can only be selected and copied by hand.
 */
export function ConditionsBriefToggle({
  open,
  onOpenChange,
  disabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={() => onOpenChange(!open)}
      aria-expanded={open}
      aria-controls="conditions-brief"
      className="bg-sf-primary/[0.06] border-sf-primary text-sf-primary-text hover:bg-sf-primary/[0.12] hover:text-t1 text-[13px] min-h-hit px-3"
    >
      <FileText className="w-3 h-3 mr-1" />
      Conditions brief
    </Button>
  );
}

export function ConditionsBriefPanel({ lines }: { lines: BriefLine[] }) {
  return (
    <section id="conditions-brief" aria-label="Conditions brief" className="max-h-[50vh] overflow-y-auto sf-sb select-text">
      <p className="font-mono text-sf-mono text-t4">{CONDITIONS_BRIEF_LABEL}</p>
      {lines.length === 0 ? (
        <p className="mt-2 font-sans text-[14px] text-t2">Not enough values yet. Change any setting to read the simulator.</p>
      ) : (
        <ul className="mt-2 space-y-3">
          {lines.map((line) => (
            <li key={line.id}>
              <p className="font-sans text-[14px] leading-relaxed text-t2">{line.text}</p>
              <p className="mt-0.5 font-mono text-[12px] leading-snug text-t4">
                {line.cites.map((c) => `${c.label} ${c.value}`).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
