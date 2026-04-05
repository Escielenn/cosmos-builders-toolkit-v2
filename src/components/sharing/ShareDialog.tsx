import { useState } from "react";
import { Link2, Copy, Check, RefreshCw, Eye, Share2, Globe } from "lucide-react";
import { Loader } from "@/components/ui/loader";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import CollaboratorSection from "@/components/sharing/CollaboratorSection";
import FirstTimeHint from "@/components/onboarding/FirstTimeHint";
import {
  useWorksheetShare,
  useWorldShare,
  useCreateWorksheetShare,
  useCreateWorldShare,
  useToggleShare,
  useRegenerateShareToken,
  getShareUrl,
} from "@/hooks/use-sharing";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "worksheet" | "world";
  entityId: string;
  entityTitle: string;
}

type WorldVisibility = "private" | "community" | "public";
type WorldLicense = "cc_by" | "cc_by_sa" | "cc_by_nc" | "view_only";

const VISIBILITY_OPTIONS: { value: WorldVisibility; label: string; desc: string }[] = [
  { value: "private", label: "Private", desc: "Only you can see this world." },
  { value: "community", label: "Community", desc: "Visible to signed-in StellarForge users." },
  { value: "public", label: "Public", desc: "Visible to anyone with the link." },
];

const LICENSE_OPTIONS: { value: WorldLicense; label: string }[] = [
  { value: "cc_by", label: "CC BY -- Fork & remix with credit" },
  { value: "cc_by_sa", label: "CC BY-SA -- ShareAlike" },
  { value: "cc_by_nc", label: "CC BY-NC -- NonCommercial" },
  { value: "view_only", label: "View Only -- No forking" },
];

const ShareDialog = ({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityTitle,
}: ShareDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // --- World visibility & license ---
  const worldMeta = useQuery({
    queryKey: ["world-visibility", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worlds")
        .select("visibility, license")
        .eq("id", entityId)
        .maybeSingle();
      if (error) throw error;
      return {
        visibility: (data?.visibility ?? "private") as WorldVisibility,
        license: (data?.license ?? "cc_by") as WorldLicense,
      };
    },
    enabled: entityType === "world" && !!entityId,
    staleTime: 30_000,
  });

  const updateWorldMeta = useMutation({
    mutationFn: async (updates: { visibility?: WorldVisibility; license?: WorldLicense }) => {
      const { error } = await supabase
        .from("worlds")
        .update(updates)
        .eq("id", entityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-visibility", entityId] });
      queryClient.invalidateQueries({ queryKey: ["worlds"] });
      queryClient.invalidateQueries({ queryKey: ["community-worlds"] });
      queryClient.invalidateQueries({ queryKey: ["showcase-world", entityId] });
      toast({ title: "Sharing settings updated." });
    },
    onError: (err) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

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
          <DialogTitle className="font-heading">Share</DialogTitle>
          <DialogDescription className="truncate">
            {entityTitle || (entityType === "worksheet" ? "Untitled Worksheet" : "Untitled World")}
          </DialogDescription>
        </DialogHeader>

        <FirstTimeHint hintId="collaboration" icon={Share2} className="mb-2" />

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
                <Loader variant="inline" size="sm" />
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
                          <Loader variant="inline" size="sm" className="mr-1.5" />
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

          {/* Visibility & License — only for worlds */}
          {entityType === "world" && worldMeta.data && (
            <div className="space-y-4">
              {/* Visibility */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <Label className="font-medium">Visibility</Label>
                </div>
                <RadioGroup
                  value={worldMeta.data.visibility}
                  onValueChange={(v) =>
                    updateWorldMeta.mutate({ visibility: v as WorldVisibility })
                  }
                  disabled={updateWorldMeta.isPending}
                  className="grid gap-2"
                >
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-3 cursor-pointer p-2 rounded-xs hover:bg-white/[0.02] transition-colors"
                    >
                      <RadioGroupItem value={opt.value} />
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          {opt.label}
                        </span>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* License — only when community or public */}
              {worldMeta.data.visibility !== "private" && (
                <div className="space-y-2">
                  <Label className="text-xs">License</Label>
                  <Select
                    value={worldMeta.data.license}
                    onValueChange={(v) =>
                      updateWorldMeta.mutate({ license: v as WorldLicense })
                    }
                    disabled={updateWorldMeta.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose license" />
                    </SelectTrigger>
                    <SelectContent>
                      {LICENSE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Collaborator Section - only for worlds */}
          {entityType === "world" && (
            <CollaboratorSection worldId={entityId} worldName={entityTitle} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
