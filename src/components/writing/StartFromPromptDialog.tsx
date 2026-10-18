// ---------------------------------------------------------------------------
// StartFromPromptDialog, choose the world a prompt's new document belongs to,
// then open it in the Studio.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PenTool } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorlds } from "@/hooks/use-worlds";
import { useStartFromPrompt } from "@/hooks/use-start-from-prompt";
import { manuscriptPath } from "@/lib/manuscript-path";
import type { WritingPrompt } from "@/lib/writing/prompts";

interface Props {
  prompt: WritingPrompt | null;
  onOpenChange: (open: boolean) => void;
  /** Called once the document exists, before navigating to it. */
  onStarted?: (prompt: WritingPrompt) => void;
}

export function StartFromPromptDialog({ prompt, onOpenChange, onStarted }: Props): JSX.Element {
  const navigate = useNavigate();
  const { worlds, isLoading } = useWorlds();
  const start = useStartFromPrompt();
  const [worldId, setWorldId] = useState<string>("");

  // Default to the most recently updated world (useWorlds orders by updated_at).
  useEffect(() => {
    if (!worldId && worlds.length > 0) setWorldId(worlds[0].id);
  }, [worlds, worldId]);

  const handleStart = () => {
    if (!prompt || !worldId) return;
    start.mutate(
      { prompt, worldId },
      {
        onSuccess: (doc) => {
          onStarted?.(prompt);
          onOpenChange(false);
          navigate(manuscriptPath(worldId, doc.id));
        },
      },
    );
  };

  return (
    <Dialog open={!!prompt} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Write from this prompt</DialogTitle>
          <DialogDescription>
            A new document opens in the Studio, in the world's Workshop folder. The prompt sits in its
            synopsis and notes, never in your prose.
          </DialogDescription>
        </DialogHeader>

        {prompt && (
          <p className="sf-measure border-l-2 border-sf-primary pl-3 font-serif text-[15px] italic leading-relaxed text-t2">
            {prompt.prompt}
          </p>
        )}

        {isLoading ? null : worlds.length === 0 ? (
          <p className="font-sans text-[14px] text-t2">
            A document lives in a world.{" "}
            <Link to="/worlds" className="text-sf-primary-text underline underline-offset-2">
              Create a world
            </Link>{" "}
            first, then return to this prompt.
          </p>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="prompt-world">World</Label>
            <Select value={worldId} onValueChange={setWorldId}>
              <SelectTrigger id="prompt-world" className="min-h-hit">
                <SelectValue placeholder="Choose a world" />
              </SelectTrigger>
              <SelectContent>
                {worlds.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button variant="sf-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="sf-primary"
            className="gap-2"
            onClick={handleStart}
            disabled={!worldId || worlds.length === 0 || start.isPending}
          >
            <PenTool className="h-4 w-4" aria-hidden="true" />
            {start.isPending ? "Opening" : "Open in Studio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
