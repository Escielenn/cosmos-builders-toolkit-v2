import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// ---- Types ----

export interface WorldCollaborator {
  id: string;
  user_id: string;
  role: "viewer" | "editor";
  created_at: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface WorldInvite {
  id: string;
  world_id: string;
  invited_email: string;
  role: "viewer" | "editor";
  invite_token: string;
  status: "pending" | "accepted" | "declined" | "expired";
  created_at: string;
  expires_at: string;
}

interface InviteAcceptResult {
  success: boolean;
  world_id?: string;
  role?: string;
  already_member?: boolean;
  is_owner?: boolean;
  error?: string;
}

// ---- Query Keys ----

const collabKeys = {
  collaborators: (worldId: string) => ["worldCollaborators", worldId] as const,
  invites: (worldId: string) => ["worldInvites", worldId] as const,
  myRole: (worldId: string) => ["myWorldRole", worldId] as const,
};

// ---- Hooks ----

export const useWorldCollaborators = (worldId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: collabKeys.collaborators(worldId || ""),
    queryFn: async () => {
      if (!worldId) return [];

      const { data, error } = await supabase.rpc("get_collaborators_for_world", {
        p_world_id: worldId,
      });

      if (error) throw error;
      return (data as unknown as WorldCollaborator[]) || [];
    },
    enabled: !!user && !!worldId,
  });
};

export const useWorldInvites = (worldId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: collabKeys.invites(worldId || ""),
    queryFn: async () => {
      if (!worldId) return [];

      const { data, error } = await supabase
        .from("world_invites")
        .select("*")
        .eq("world_id", worldId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as WorldInvite[]) || [];
    },
    enabled: !!user && !!worldId,
  });
};

export const useInviteCollaborator = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      worldId,
      worldName,
      email,
      role,
    }: {
      worldId: string;
      worldName: string;
      email: string;
      role: "viewer" | "editor";
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Check if user is inviting themselves
      if (email.toLowerCase() === user.email?.toLowerCase()) {
        throw new Error("You cannot invite yourself");
      }

      // Check if already a collaborator
      const { data: lookup } = await supabase.rpc("lookup_user_by_email", {
        p_email: email,
      });
      const lookupResult = lookup as unknown as { found: boolean; user_id?: string };

      if (lookupResult?.found && lookupResult.user_id) {
        const { data: existing } = await supabase
          .from("world_collaborators")
          .select("id")
          .eq("world_id", worldId)
          .eq("user_id", lookupResult.user_id)
          .maybeSingle();

        if (existing) {
          throw new Error("This user is already a collaborator on this world");
        }
      }

      // Check if there's already a pending invite for this email
      const { data: existingInvite } = await supabase
        .from("world_invites")
        .select("id")
        .eq("world_id", worldId)
        .eq("invited_email", email.toLowerCase())
        .eq("status", "pending")
        .maybeSingle();

      if (existingInvite) {
        throw new Error("An invite has already been sent to this email");
      }

      // Create the invite
      const { data: invite, error } = await supabase
        .from("world_invites")
        .insert({
          world_id: worldId,
          invited_email: email.toLowerCase(),
          role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Send email notification via edge function
      try {
        await supabase.functions.invoke("send-invite-email", {
          body: {
            invitedEmail: email.toLowerCase(),
            worldId,
            worldName,
            inviteToken: invite.invite_token,
            role,
            inviterName: profile?.display_name || user.email,
          },
        });
      } catch (emailError) {
        console.error("Failed to send invite email:", emailError);
        // Don't throw - invite is still created even if email fails
      }

      return { invite, worldId };
    },
    onSuccess: ({ worldId }) => {
      queryClient.invalidateQueries({ queryKey: collabKeys.invites(worldId) });
      toast({ title: "Invite sent", description: "An email invitation has been sent." });
    },
    onError: (error) => {
      toast({ title: "Failed to send invite", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateCollaboratorRole = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collaboratorId,
      worldId,
      role,
    }: {
      collaboratorId: string;
      worldId: string;
      role: "viewer" | "editor";
    }) => {
      const { error } = await supabase
        .from("world_collaborators")
        .update({ role })
        .eq("id", collaboratorId);

      if (error) throw error;
      return { worldId };
    },
    onSuccess: ({ worldId }) => {
      queryClient.invalidateQueries({ queryKey: collabKeys.collaborators(worldId) });
      toast({ title: "Role updated" });
    },
    onError: (error) => {
      toast({ title: "Failed to update role", description: error.message, variant: "destructive" });
    },
  });
};

export const useRemoveCollaborator = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collaboratorId,
      worldId,
    }: {
      collaboratorId: string;
      worldId: string;
    }) => {
      const { error } = await supabase
        .from("world_collaborators")
        .delete()
        .eq("id", collaboratorId);

      if (error) throw error;
      return { worldId };
    },
    onSuccess: ({ worldId }) => {
      queryClient.invalidateQueries({ queryKey: collabKeys.collaborators(worldId) });
      queryClient.invalidateQueries({ queryKey: ["sharedWorlds"] });
      toast({ title: "Collaborator removed" });
    },
    onError: (error) => {
      toast({ title: "Failed to remove collaborator", description: error.message, variant: "destructive" });
    },
  });
};

export const useCancelInvite = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inviteId,
      worldId,
    }: {
      inviteId: string;
      worldId: string;
    }) => {
      const { error } = await supabase
        .from("world_invites")
        .update({ status: "expired" as const })
        .eq("id", inviteId);

      if (error) throw error;
      return { worldId };
    },
    onSuccess: ({ worldId }) => {
      queryClient.invalidateQueries({ queryKey: collabKeys.invites(worldId) });
      toast({ title: "Invite cancelled" });
    },
    onError: (error) => {
      toast({ title: "Failed to cancel invite", description: error.message, variant: "destructive" });
    },
  });
};

export const useResendInvite = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      invite,
      worldName,
    }: {
      invite: WorldInvite;
      worldName: string;
    }) => {
      await supabase.functions.invoke("send-invite-email", {
        body: {
          invitedEmail: invite.invited_email,
          worldId: invite.world_id,
          worldName,
          inviteToken: invite.invite_token,
          role: invite.role,
          inviterName: profile?.display_name || user?.email,
        },
      });
    },
    onSuccess: () => {
      toast({ title: "Invite resent", description: "The invitation email has been sent again." });
    },
    onError: (error) => {
      toast({ title: "Failed to resend invite", description: error.message, variant: "destructive" });
    },
  });
};

export const useAcceptInvite = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc("accept_world_invite", {
        p_token: token,
      });

      if (error) throw error;
      const result = data as unknown as InviteAcceptResult;
      if (!result.success) {
        throw new Error(result.error || "Failed to accept invite");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sharedWorlds"] });
      toast({ title: "Invite accepted", description: "You now have access to this world." });
    },
    onError: (error) => {
      toast({ title: "Failed to accept invite", description: error.message, variant: "destructive" });
    },
  });
};

export const useMyWorldRole = (worldId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: collabKeys.myRole(worldId || ""),
    queryFn: async (): Promise<"owner" | "editor" | "viewer" | null> => {
      if (!worldId || !user) return null;

      // Check if owner
      const { data: world } = await supabase
        .from("worlds")
        .select("user_id")
        .eq("id", worldId)
        .maybeSingle();

      if (world?.user_id === user.id) return "owner";

      // Check if collaborator
      const { data: collab } = await supabase
        .from("world_collaborators")
        .select("role")
        .eq("world_id", worldId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (collab) return collab.role as "editor" | "viewer";

      return null;
    },
    enabled: !!user && !!worldId,
  });
};

export const useLeaveWorld = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (worldId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("world_collaborators")
        .delete()
        .eq("world_id", worldId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sharedWorlds"] });
      toast({ title: "Left world", description: "You no longer have access to this world." });
    },
    onError: (error) => {
      toast({ title: "Failed to leave world", description: error.message, variant: "destructive" });
    },
  });
};
