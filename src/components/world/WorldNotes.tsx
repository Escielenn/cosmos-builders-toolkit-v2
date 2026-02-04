import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import { ChevronDown, ChevronUp, Loader2, FileText, Check, Eye, Pencil, Save } from "lucide-react";
import "highlight.js/styles/github-dark.css";
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
  const [isEditing, setIsEditing] = useState(true);
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
                <div className="flex gap-2 justify-between">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isEditing ? "default" : "outline"}
                      onClick={() => setIsEditing(true)}
                      className="h-8"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={!isEditing ? "default" : "outline"}
                      onClick={() => setIsEditing(false)}
                      className="h-8"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      Preview
                    </Button>
                  </div>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={saveNow}
                      disabled={isSaving}
                      className="h-8"
                    >
                      {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <Textarea
                    value={content}
                    onChange={(e) => updateContent(e.target.value)}
                    placeholder="Add notes about your world here... This is a great place for backstory, world history, important details, or anything else you want to remember."
                    className="min-h-[200px] resize-y font-mono text-sm"
                  />
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none min-h-[200px] p-3 rounded-md bg-muted/30 border border-border [&_pre]:bg-[#0d1117] [&_pre]:p-3 [&_pre]:rounded-md [&_code]:text-xs prose-headings:text-foreground prose-headings:font-semibold prose-h1:text-xl prose-h1:mt-4 prose-h1:mb-2 prose-h2:text-lg prose-h2:mt-3 prose-h2:mb-2 prose-h3:text-base prose-h3:mt-2 prose-h3:mb-1 prose-h4:text-sm prose-h4:mt-2 prose-h4:mb-1">
                    {content ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeHighlight]}
                      >
                        {content}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-muted-foreground italic">
                        No content yet. Switch to Edit mode to add notes.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-primary/70">Markdown supported</span> — **bold**, *italic*, ~~strike~~, # headings, - lists, tables, ```code```
                  </p>
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
