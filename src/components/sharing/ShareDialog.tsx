import { useState } from "react";
import { Link2, Copy, Check, RefreshCw, Eye, Loader2, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  useWorksheetShare,
  useWorldShare,
  useCreateWorksheetShare,
  useCreateWorldShare,
  useToggleShare,
  useRegenerateShareToken,
  getShareUrl,
} from "@/hooks/use-sharing";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "worksheet" | "world";
  entityId: string;
  entityTitle: string;
}

const ShareDialog = ({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityTitle,
}: ShareDialogProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const worksheetShare = useWorksheetShare(entityType === "worksheet" ? entityId : undefined);
  const worldShare = useWorldShare(entityType === "world" ? entityId : undefined);

  const shareData = entityType === "worksheet" ? worksheetShare.data : worldShare.data;
  const isLoading = entityType === "worksheet" ? worksheetShare.isLoading : worldShare.isLoading;

  const createWorksheetShare = useCreateWorksheetShare();
  const createWorldShare = useCreateWorldShare();
  const toggleShare = useToggleShare();
  const regenerateToken = useRegenerateShareToken();

  const isEnabled = shareData?.enabled ?? false;
  const shareUrl = shareData?.share_token ? getShareUrl(entityType, shareData.share_token) : "";

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      if (shareData) {
        // Re-enable existing share
        toggleShare.mutate({
          shareId: shareData.id,
          entityType,
          entityId,
          enabled: true,
        });
      } else {
        // Create new share
        if (entityType === "worksheet") {
          createWorksheetShare.mutate(entityId);
        } else {
          createWorldShare.mutate(entityId);
        }
      }
    } else if (shareData) {
      toggleShare.mutate({
        shareId: shareData.id,
        entityType,
        entityId,
        enabled: false,
      });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied to clipboard" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleRegenerate = () => {
    if (!shareData) return;
    regenerateToken.mutate({
      shareId: shareData.id,
      entityType,
      entityId,
    });
  };

  const isMutating =
    createWorksheetShare.isPending ||
    createWorldShare.isPending ||
    toggleShare.isPending ||
    regenerateToken.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Share</DialogTitle>
          <DialogDescription className="truncate">
            {entityTitle || (entityType === "worksheet" ? "Untitled Worksheet" : "Untitled World")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Link Sharing Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                <Label htmlFor="link-sharing" className="font-medium">
                  Link Sharing
                </Label>
              </div>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <Switch
                  id="link-sharing"
                  checked={isEnabled}
                  onCheckedChange={handleToggle}
                  disabled={isMutating}
                />
              )}
            </div>

            {isEnabled && shareUrl && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={shareUrl}
                    className="text-sm font-mono"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{shareData?.view_count || 0} views</span>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={regenerateToken.isPending}
                        className="text-muted-foreground"
                      >
                        {regenerateToken.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Regenerate link
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Regenerate share link?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will create a new link. Anyone using the old link will no longer have
                          access. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRegenerate}>
                          Regenerate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <p className="text-xs text-muted-foreground">
                  Anyone with this link can view a read-only copy.
                </p>
              </div>
            )}
          </div>

          {/* Collaborator Teaser */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">Invite collaborators</span>
              <Badge variant="outline" className="text-xs">
                Coming soon
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
