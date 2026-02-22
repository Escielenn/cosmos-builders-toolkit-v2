import { useState } from "react";
import { Download } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBackupStats } from "@/hooks/use-backup-stats";
import { formatDistanceToNow } from "date-fns";
import { compileWorldSnapshot } from "@/lib/export/world-snapshot";

interface BackupStatusWidgetProps {
  worlds: { id: string; name: string; snapshot_at: string | null }[];
}

function getBackupFreshness(snapshotAt: string | null): {
  dot: string;
  color: string;
} {
  if (!snapshotAt) return { dot: "\u25CB", color: "rgba(255,255,255,0.3)" }; // ○ no backup

  const age = Date.now() - new Date(snapshotAt).getTime();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;

  if (age < oneHour) return { dot: "\u25CF", color: "#3DFFCD" }; // ● teal
  if (age < oneDay) return { dot: "\u25CF", color: "#FFB347" }; // ● amber
  return { dot: "\u25D0", color: "rgba(255,255,255,0.35)" }; // ◐ stale
}

const BackupStatusWidget = ({ worlds }: BackupStatusWidgetProps) => {
  const { toast } = useToast();
  const { worldBackups, totalVersions, lastBackup, isLoading } = useBackupStats(worlds);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadAll = async () => {
    if (worlds.length === 0) return;
    setIsDownloading(true);

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      for (const world of worlds) {
        const snapshot = await compileWorldSnapshot(world.id);
        const safeName = world.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const worldFolder = zip.folder(safeName);
        worldFolder?.file("world.json", JSON.stringify(snapshot, null, 2));
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const dateStr = new Date().toISOString().split("T")[0];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stellarforge-all-worlds-${dateStr}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "ARCHIVE COMPLETE.",
        description: `${worlds.length} world${worlds.length === 1 ? "" : "s"} downloaded.`,
      });
    } catch (error) {
      console.error("Download all worlds error:", error);
      toast({
        title: "ARCHIVE FAILED.",
        description: "Could not compile world archive. Retry.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (worlds.length === 0) return null;

  return (
    <div className="sf-backup-widget">
      <div className="sf-backup-widget-header">// ARCHIVE STATUS</div>

      <hr className="sf-sovereignty-divider mt-2 mb-3" />

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader size="sm" />
        </div>
      ) : (
        <>
          <div className="space-y-0.5 mb-3">
            <div className="sf-backup-widget-stat">
              <span className="sf-backup-widget-stat-label">Worlds on file:</span>
              <span className="sf-backup-widget-stat-value">{worlds.length}</span>
            </div>
            <div className="sf-backup-widget-stat">
              <span className="sf-backup-widget-stat-label">Total versions:</span>
              <span className="sf-backup-widget-stat-value">{totalVersions}</span>
            </div>
            <div className="sf-backup-widget-stat">
              <span className="sf-backup-widget-stat-label">Last backup:</span>
              <span className="sf-backup-widget-stat-value">
                {lastBackup
                  ? formatDistanceToNow(new Date(lastBackup), { addSuffix: true })
                  : "None"}
              </span>
            </div>
          </div>

          <hr className="sf-sovereignty-divider my-2" />

          <div className="space-y-0.5 mb-3">
            {worldBackups.slice(0, 5).map((wb) => {
              const { dot, color } = getBackupFreshness(wb.snapshotAt);
              return (
                <div key={wb.id} className="sf-backup-widget-world">
                  <span className="sf-backup-widget-dot" style={{ color }}>{dot}</span>
                  <span className="flex-1 text-foreground/70 truncate">{wb.name}</span>
                  <span className="text-muted-foreground text-[11px] font-mono shrink-0">
                    {wb.snapshotAt
                      ? formatDistanceToNow(new Date(wb.snapshotAt), { addSuffix: false })
                      : "—"}
                  </span>
                  <span className="text-muted-foreground text-[10px] font-mono shrink-0">
                    v{wb.versionCount}
                  </span>
                </div>
              );
            })}
            {worldBackups.length > 5 && (
              <p className="text-[10px] text-muted-foreground/50 text-center pt-1">
                +{worldBackups.length - 5} more
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs uppercase tracking-wider"
            onClick={handleDownloadAll}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader variant="inline" size="sm" className="mr-2" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-2" />
            )}
            {isDownloading ? "Compiling..." : "Download All Worlds"}
          </Button>
        </>
      )}

      <p className="sf-backup-widget-footer">
        Your worlds are yours alone.
        Encrypted at rest. Never accessed.
      </p>
    </div>
  );
};

export default BackupStatusWidget;
