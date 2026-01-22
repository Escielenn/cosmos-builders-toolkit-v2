import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, FileText, Check } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useWorldNotes } from "@/hooks/use-world-notes";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface WorldNotesProps {
  worldId: string;
}

const WorldNotes = ({ worldId }: WorldNotesProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { content, updateContent, isLoading, isSaving, lastUpdated } =
    useWorldNotes(worldId);

  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <GlassPanel className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 h-auto rounded-none hover:bg-accent/50"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-display font-semibold">World Notes</span>
            </div>
            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              )}
              {!isSaving && lastUpdated && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  Saved
                </span>
              )}
              {isOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <Textarea
                  value={content}
                  onChange={(e) => updateContent(e.target.value)}
                  placeholder="Add notes about your world here... This is a great place for backstory, world history, important details, or anything else you want to remember."
                  className="min-h-[200px] resize-y"
                />
                {formattedLastUpdated && (
                  <p className="text-xs text-muted-foreground">
                    Last updated: {formattedLastUpdated}
                  </p>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </GlassPanel>
  );
};

export default WorldNotes;
