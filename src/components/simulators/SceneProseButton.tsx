import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { generateSceneProse } from "@/lib/simulators/scene-prose";
import type { WorksheetFact } from "@/lib/worksheet-facts";

interface SceneProseButtonProps {
  facts: WorksheetFact[];
  simulatorType: string;
}

export function SceneProseButton({ facts, simulatorType }: SceneProseButtonProps) {
  const [prose, setProse] = useState<string | null>(null);
  const canGenerate = facts.length > 0;

  // Facts change identity when the writer loads a different save (or the
  // simulator's live state refreshes). Without this, prose generated for a
  // previous world would keep sitting next to a UI that now shows a
  // different one's numbers, which reads as a stale description no writer
  // asked for.
  useEffect(() => {
    setProse(null);
  }, [facts]);

  return (
    <div className="mt-3">
      <Button
        variant="outline"
        size="sm"
        disabled={!canGenerate}
        onClick={() => setProse(generateSceneProse(facts, simulatorType))}
      >
        Describe This Scene
      </Button>
      {prose && (
        <p className="mt-2 border-l border-sf-border pl-3 font-serif text-[14px] italic leading-relaxed text-t2">
          {prose}
        </p>
      )}
    </div>
  );
}
