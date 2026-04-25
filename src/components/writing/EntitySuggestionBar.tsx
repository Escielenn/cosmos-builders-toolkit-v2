/**
 * EntitySuggestionBar — Shown after saving a writing entry when entity
 * names are detected in the text content.
 *
 * "This entry mentions Kepler-442b and Voss. Link to these entities?"
 *
 * Spec: StellarForge_Final_Remediation_Spec_v2 — Issue 6
 */

import { Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EntitySuggestion {
  entryId: string;
  title: string;
  entryType: string;
}

interface EntitySuggestionBarProps {
  suggestions: EntitySuggestion[];
  onLink: (entityId: string) => void;
  onDismiss: () => void;
}

export default function EntitySuggestionBar({
  suggestions,
  onLink,
  onDismiss,
}: EntitySuggestionBarProps) {
  if (suggestions.length === 0) return null;

  const names = suggestions.map((s) => s.title);
  const nameList =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} and ${names[1]}`
        : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;

  return (
    <div className="border border-primary/15 bg-primary/5 px-4 py-2.5 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start gap-3">
        <Link2 className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-primary/70 leading-relaxed">
            This entry mentions {nameList}. Link to{" "}
            {suggestions.length === 1 ? "this entity" : "these entities"}?
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {suggestions.map((s) => (
              <Button
                key={s.entryId}
                variant="outline"
                size="sm"
                onClick={() => onLink(s.entryId)}
                className="h-6 text-[10px] px-2 gap-1 text-primary border-primary/20 hover:bg-primary/10"
              >
                <Link2 className="w-2.5 h-2.5" />
                {s.title}
              </Button>
            ))}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-t3/30 hover:text-t3/60 transition-colors shrink-0"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
