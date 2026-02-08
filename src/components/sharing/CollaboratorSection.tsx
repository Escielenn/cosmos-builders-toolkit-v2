import { useState } from "react";
import { Crown, Mail, X, Send, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useSubscription } from "@/hooks/use-subscription";
import {
  useWorldCollaborators,
  useWorldInvites,
  useInviteCollaborator,
  useUpdateCollaboratorRole,
  useRemoveCollaborator,
  useCancelInvite,
  useResendInvite,
  type WorldInvite,
} from "@/hooks/use-collaborators";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface CollaboratorSectionProps {
  worldId: string;
  worldName: string;
}

const CollaboratorSection = ({ worldId, worldName }: CollaboratorSectionProps) => {
  const { isSubscribed } = useSubscription();
  const { data: collaborators = [], isLoading: loadingCollabs } = useWorldCollaborators(worldId);
  const { data: invites = [], isLoading: loadingInvites } = useWorldInvites(worldId);
  const inviteCollaborator = useInviteCollaborator();
  const updateRole = useUpdateCollaboratorRole();
  const removeCollaborator = useRemoveCollaborator();
  const cancelInvite = useCancelInvite();
  const resendInvite = useResendInvite();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");

  // Pro gate
  if (!isSubscribed) {
    return (
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <Label className="font-medium">Invite Collaborators</Label>
          <Badge className="bg-primary/10 text-primary text-xs">Pro</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Invite others to view or edit your worlds with collaborator invites.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/pricing">
            <Crown className="w-3.5 h-3.5 mr-1.5" />
            Upgrade to Pro
          </Link>
        </Button>
      </div>
    );
  }

  const handleInvite = () => {
    if (!email.trim()) return;
    inviteCollaborator.mutate(
      { worldId, worldName, email: email.trim(), role },
      { onSuccess: () => setEmail("") }
    );
  };

  const isLoading = loadingCollabs || loadingInvites;

  return (
    <div className="border-t border-border pt-4 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <Label className="font-medium">Collaborators</Label>
      </div>

      {/* Invite form */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            className="text-sm"
          />
          <Select value={role} onValueChange={(v) => setRole(v as "viewer" | "editor")}>
            <SelectTrigger className="w-[110px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          onClick={handleInvite}
          disabled={!email.trim() || inviteCollaborator.isPending}
          className="w-full"
        >
          {inviteCollaborator.isPending ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Mail className="w-3.5 h-3.5 mr-1.5" />
          )}
          Send Invite
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-3">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Current collaborators */}
      {collaborators.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Members
          </p>
          {collaborators.map((collab) => (
            <div key={collab.id} className="flex items-center gap-2 text-sm">
              {collab.avatar_url ? (
                <img
                  src={collab.avatar_url}
                  alt=""
                  className="w-6 h-6 rounded-full shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-medium text-primary">
                    {(collab.display_name || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="flex-1 truncate">
                {collab.display_name || "Unknown user"}
              </span>
              <Select
                value={collab.role}
                onValueChange={(newRole) =>
                  updateRole.mutate({
                    collaboratorId: collab.id,
                    worldId,
                    role: newRole as "viewer" | "editor",
                  })
                }
              >
                <SelectTrigger className="h-7 w-[90px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove collaborator?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {collab.display_name || "This user"} will lose access to this world.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        removeCollaborator.mutate({
                          collaboratorId: collab.id,
                          worldId,
                        })
                      }
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Pending Invites
          </p>
          {invites.map((invite: WorldInvite) => (
            <div key={invite.id} className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate text-muted-foreground">
                {invite.invited_email}
              </span>
              <Badge variant="outline" className="text-xs shrink-0">
                {invite.role}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() =>
                  resendInvite.mutate({ invite, worldName })
                }
                disabled={resendInvite.isPending}
              >
                <Send className="w-3 h-3 mr-1" />
                Resend
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() =>
                  cancelInvite.mutate({ inviteId: invite.id, worldId })
                }
                disabled={cancelInvite.isPending}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {!isLoading && collaborators.length === 0 && invites.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No collaborators yet. Invite someone by email above.
        </p>
      )}
    </div>
  );
};

export default CollaboratorSection;
