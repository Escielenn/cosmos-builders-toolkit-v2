import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { History, Download, RotateCcw, ChevronDown, ChevronUp, GitBranch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  fetchWorldVersions,
  fetchVersionSnapshot,
  restoreWorldVersion,
  restoreSnapshotAsNewWorld,
  downloadSnapshotAsJson,
  type WorldVersionSummary,
} from "@/lib/export/world-snapshot";
import { formatDistanceToNow, format } from "date-fns";

interface VersionHistoryProps {
  worldId: string;
  worldName: string;
}

const VersionHistory = ({ worldId, worldName }: VersionHistoryProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<WorldVersionSummary | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [branchingId, setBranchingId] = useState<string | null>(null);

  const handleBranch = async (v: WorldVersionSummary) => {
    setBranchingId(v.id);
    try {
      const newWorldId = await restoreSnapshotAsNewWorld(v.id);
      toast({
        title: "Branched to a new world",
        description: `Version ${v.version_number} was restored as a separate world. Your current world is untouched.`,
      });
      navigate(`/worlds/${newWorldId}`);
    } catch (error) {
      toast({
        title: "Branch failed",
        description: error instanceof Error ? error.message : "Could not branch this version.",
        variant: "destructive",
      });
    } finally {
      setBranchingId(null);
    }
  };

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["world-versions", worldId],
    queryFn: () => fetchWorldVersions(worldId),
    enabled: expanded,
    staleTime: 30_000,
  });

  const handleDownload = async (version: WorldVersionSummary) => {
    setDownloadingId(version.id);
    try {
      const snapshot = await fetchVersionSnapshot(version.id);
      downloadSnapshotAsJson(snapshot, `${worldName}-v${version.version_number}`);
    } catch (error) {
      toast({
        title: "DOWNLOAD FAILED.",
        description: error instanceof Error ? error.message : "Could not download version.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setIsRestoring(true);
    try {
      await restoreWorldVersion(worldId, restoreTarget.id);

      queryClient.invalidateQueries({ queryKey: ["world", worldId] });
      queryClient.invalidateQueries({ queryKey: ["worksheets", worldId] });
      queryClient.invalidateQueries({ queryKey: ["world-versions", worldId] });

      toast({
        title: "VERSION RESTORED.",
        description: `Restored to version ${restoreTarget.version_number}. Current state was saved as a backup first.`,
      });
    } catch (error) {
      toast({
        title: "RESTORE FAILED.",
        description: error instanceof Error ? error.message : "Could not restore version.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
      setRestoreTarget(null);
    }
  };

  const getVersionLabel = (v: WorldVersionSummary) => {
    if (v.label === "auto") return "Auto-backup";
    if (v.label === "Pre-restore backup") return "Pre-restore backup";
    return v.label || "Manual snapshot";
  };

  return (
    <>
      <GlassPanel className="p-0 overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-accent/5 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-t3" />
            <span className="text-xs uppercase tracking-wider text-t3 font-heading">
              Archive Log
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-t3" />
          ) : (
            <ChevronDown className="w-4 h-4 text-t3" />
          )}
        </button>

        {expanded && (
          <div className="border-t border-sf-line-interactive">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader />
              </div>
            ) : versions.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-t3">
                  No snapshots yet. Versions are created automatically as you work, or manually via the Snapshot button.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-3 hover:bg-accent/5 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-t2">
                          v{v.version_number}
                        </span>
                        <span className="text-xs text-t3 truncate">
                          {getVersionLabel(v)}
                        </span>
                      </div>
                      <p className="text-xs text-t3 mt-0.5" title={format(new Date(v.created_at), "PPpp")}>
                        {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDownload(v)}
                        disabled={downloadingId === v.id}
                        title="Download this version"
                        aria-label="Download this version"
                      >
                        {downloadingId === v.id ? (
                          <Loader variant="inline" size="sm" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleBranch(v)}
                        disabled={branchingId === v.id}
                        title="Restore as a new world (non-destructive)"
                        aria-label="Restore as a new world"
                      >
                        {branchingId === v.id ? (
                          <Loader variant="inline" size="sm" />
                        ) : (
                          <GitBranch className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setRestoreTarget(v)}
                        title="Restore this version (overwrites current)"
                        aria-label="Restore this version"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </GlassPanel>

      {/* Restore Confirmation */}
      <AlertDialog open={!!restoreTarget} onOpenChange={() => setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version {restoreTarget?.version_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current world state will be saved as a backup before restoring.
              All worksheets, notes, connections, and entries will be replaced with the data from version {restoreTarget?.version_number}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
              {isRestoring ? (
                <>
                  <Loader variant="inline" size="sm" className="mr-2" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default VersionHistory;
