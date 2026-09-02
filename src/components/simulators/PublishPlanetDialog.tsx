/**
 * PublishPlanetDialog — Brief S1's "publish" verb, Solaris's per-planet case.
 *
 * Unlike PublishToWorldDialog (which writes a whole simulator payload as an
 * opaque metadata blob), this shows an actual reviewable diff before
 * writing anything — "PROMOTE N VALUES TO CANON" — and, once published,
 * offers direct links to open the new entity in ExoSky and Tidelock via
 * ?entity=<uuid> (open-on), so the planet survives past this browser tab.
 *
 * docs/stellarforge/11-SIMULATOR-CONSTELLATION.md §1, Brief S1.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, Globe, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import SimulationWorldPicker from "@/components/simulators/SimulationWorldPicker";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createEntry } from "@/services/world-entries";
import type { HandoffPayload } from "@/lib/simulators/handoff";
import {
  solarisPlanetPublishFacts,
  formatPublishedFact,
  publishedFactsSummary,
  buildPublishedMetadata,
} from "@/lib/simulators/published-facts";

interface PublishPlanetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: HandoffPayload | null;
  worldId: string | undefined;
}

export default function PublishPlanetDialog({
  open,
  onOpenChange,
  payload,
  worldId,
}: PublishPlanetDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [chosenWorld, setChosenWorld] = useState<string | undefined>(worldId);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  useEffect(() => {
    if (worldId) setChosenWorld(worldId);
  }, [worldId]);

  // Fresh state each time a new planet arrives, so a second publish this
  // session doesn't show the previous one's "already published" screen.
  useEffect(() => {
    if (open) setPublishedId(null);
  }, [open, payload]);

  const targetWorld = worldId ?? chosenWorld;
  const facts = payload ? solarisPlanetPublishFacts(payload) : [];

  const handlePublish = async () => {
    if (!payload || !targetWorld || !user) return;
    setIsPublishing(true);
    try {
      const entry = await createEntry(
        {
          worldId: targetWorld,
          title: payload.planetName,
          entryType: "planet",
          content: publishedFactsSummary(facts),
          metadata: buildPublishedMetadata(facts, "solaris"),
        },
        user.id,
      );
      setPublishedId(entry.id);
      toast({
        title: "PROMOTED TO CANON.",
        description: `"${payload.planetName}" is now on file in your Codex.`,
      });
    } catch (error) {
      toast({
        title: "PUBLISH FAILED.",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-sf-surface border-sf-line-interactive">
        {publishedId ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-heading text-sm font-light uppercase tracking-[3px] text-sf-primary-text">
                <Globe className="h-4 w-4" />
                Published
              </DialogTitle>
              <DialogDescription className="mt-2 text-t2">
                "{payload?.planetName}" is on file. Open it in another simulator, already pointed at it.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-3 flex flex-col gap-2">
              <Button
                variant="outline"
                className="justify-between"
                onClick={() => {
                  navigate(`/tools/exosky?entity=${publishedId}`);
                  onOpenChange(false);
                }}
              >
                Open in ExoSky
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="justify-between"
                onClick={() => {
                  navigate(`/tools/tidelock?entity=${publishedId}`);
                  onOpenChange(false);
                }}
              >
                Open in Tidelock
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-heading text-sm font-light uppercase tracking-[3px] text-sf-primary-text">
                <Rocket className="h-4 w-4" />
                Promote {facts.length} Values to Canon
              </DialogTitle>
              <DialogDescription className="mt-2 text-t2">
                {payload?.planetName ?? "This planet"} becomes a permanent entity in your world's Codex.
                Every value below is written exactly as shown.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 space-y-1 border border-sf-line-interactive p-3">
              {facts.map((f) => (
                <div key={f.predicate} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="text-t3">{f.label}</span>
                  <span className="font-mono text-t1">{formatPublishedFact(f)}</span>
                </div>
              ))}
            </div>

            {!worldId && (
              <div className="mt-3">
                <SimulationWorldPicker value={chosenWorld} onChange={setChosenWorld} label="Publish into which world" />
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPublishing}>
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !payload || !targetWorld}
                title={!targetWorld ? "Choose a world first" : undefined}
                className="gap-2"
              >
                {isPublishing ? <Loader variant="inline" size="sm" /> : <Rocket className="w-4 h-4" />}
                {isPublishing ? "Publishing..." : "Publish"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
