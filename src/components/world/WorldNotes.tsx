import { useState, lazy, Suspense } from "react";
import { ChevronDown, ChevronUp, FileText, Check, Save } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { useWorldNotes } from "@/hooks/use-world-notes";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));

interface WorldNotesProps {
  worldId: string;
  readOnly?: boolean;
}

const WorldNotes = ({ worldId, readOnly }: WorldNotesProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { content, updateContent, saveNow, isLoading, isSaving, lastUpdated } =
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
              <span className="font-heading font-semibold">World Notes</span>
            </div>
            <div className="flex items-center gap-2">
              {!readOnly && isSaving && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader variant="inline" size="sm" />
                  Saving...
                </span>
              )}
              {!readOnly && !isSaving && lastUpdated && (
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
                <Loader size="sm" />
              </div>
            ) : (
              <>
                {!readOnly && (
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={saveNow}
                      disabled={isSaving}
                      className="h-8"
                    >
                      {isSaving ? (
                        <Loader variant="inline" size="sm" className="mr-1.5" />
                      ) : (
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}

                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-8">
                      <Loader size="sm" />
                    </div>
                  }
                >
                  <RichTextEditor
                    content={content}
                    onChange={updateContent}
                    readOnly={!!readOnly}
                    placeholder="Add notes about your world here... This is a great place for backstory, world history, important details, or anything else you want to remember."
                    minHeight="200px"
                  />
                </Suspense>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  {formattedLastUpdated && (
                    <p className="text-xs text-muted-foreground">
                      Last updated: {formattedLastUpdated}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </GlassPanel>
  );
};

export default WorldNotes;
