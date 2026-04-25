import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// ---- Types ----

export interface WorksheetLinkShare {
  id: string;
  worksheet_id: string;
  owner_id: string;
  share_token: string;
  enabled: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorldLinkShare {
  id: string;
  world_id: string;
  owner_id: string;
  share_token: string;
  enabled: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface SharedWorksheetData {
  worksheet_id: string;
  tool_type: string;
  title: string | null;
  data: Record<string, unknown>;
  tags: string[];
  created_at: string;
  updated_at: string;
  owner_display_name: string | null;
  owner_avatar_url: string | null;
  world_id: string;
  world_name: string | null;
  view_count: number;
}

export interface SharedWorldData {
  world_id: string;
  name: string;
  description: string | null;
  header_image_url: string | null;
  header_image_focus_y: number;
  icon: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  owner_display_name: string | null;
  owner_avatar_url: string | null;
  worksheets: Array<{
    id: string;
    tool_type: string;
    title: string | null;
    tags: string[];
    created_at: string;
    updated_at: string;
  }>;
  view_count: number;
}

// ---- Query Keys ----

const shareKeys = {
  worksheetShare: (worksheetId: string) => ["worksheetShare", worksheetId] as const,
  worldShare: (worldId: string) => ["worldShare", worldId] as const,
  sharedWorksheet: (token: string) => ["sharedWorksheet", token] as const,
  sharedWorld: (token: string) => ["sharedWorld", token] as const,
};

// ---- Owner Hooks (authenticated) ----

export const useWorksheetShare = (worksheetId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: shareKeys.worksheetShare(worksheetId || ""),
    queryFn: async () => {
      if (!worksheetId) return null;

      const { data, error } = await supabase
        .from("worksheet_link_shares")
        .select("*")
        .eq("worksheet_id", worksheetId)
        .maybeSingle();

      if (error) throw error;
      return data as WorksheetLinkShare | null;
    },
    enabled: !!user && !!worksheetId,
  });
};

export const useWorldShare = (worldId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: shareKeys.worldShare(worldId || ""),
    queryFn: async () => {
      if (!worldId) return null;

      const { data, error } = await supabase
        .from("world_link_shares")
        .select("*")
        .eq("world_id", worldId)
        .maybeSingle();

      if (error) throw error;
      return data as WorldLinkShare | null;
    },
    enabled: !!user && !!worldId,
  });
};

export const useCreateWorksheetShare = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (worksheetId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("worksheet_link_shares")
        .select("*")
        .eq("worksheet_id", worksheetId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("worksheet_link_shares")
          .update({ enabled: true })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as WorksheetLinkShare;
      }

      const { data, error } = await supabase
        .from("worksheet_link_shares")
        .insert({ worksheet_id: worksheetId, owner_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as WorksheetLinkShare;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: shareKeys.worksheetShare(data.worksheet_id),
      });
      toast({ title: "SHARE CHANNEL OPEN.", description: "Anyone with the link may now view this worksheet." });
    },
    onError: (error) => {
      toast({ title: "SHARE CHANNEL FAILED.", description: error.message, variant: "destructive" });
    },
  });
};

export const useCreateWorldShare = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (worldId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("world_link_shares")
        .select("*")
        .eq("world_id", worldId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("world_link_shares")
          .update({ enabled: true })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as WorldLinkShare;
      }

      const { data, error } = await supabase
        .from("world_link_shares")
        .insert({ world_id: worldId, owner_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as WorldLinkShare;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: shareKeys.worldShare(data.world_id),
      });
      toast({ title: "SHARE CHANNEL OPEN.", description: "Anyone with the link may now view this world." });
    },
    onError: (error) => {
      toast({ title: "SHARE CHANNEL FAILED.", description: error.message, variant: "destructive" });
    },
  });
};

export const useToggleShare = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shareId,
      entityType,
      entityId,
      enabled,
    }: {
      shareId: string;
      entityType: "worksheet" | "world";
      entityId: string;
      enabled: boolean;
    }) => {
      const table = entityType === "worksheet" ? "worksheet_link_shares" : "world_link_shares";

      const { data, error } = await supabase
        .from(table)
        .update({ enabled })
        .eq("id", shareId)
        .select()
        .single();

      if (error) throw error;
      return { data, entityType, entityId };
    },
    onSuccess: ({ entityType, entityId, data }) => {
      const key = entityType === "worksheet"
        ? shareKeys.worksheetShare(entityId)
        : shareKeys.worldShare(entityId);
      queryClient.invalidateQueries({ queryKey: key });
      toast({
        title: data.enabled ? "Link sharing enabled" : "Link sharing disabled",
        description: data.enabled ? "Anyone with the link can view this." : "The shared link no longer works.",
      });
    },
    onError: (error) => {
      toast({ title: "Failed to update sharing", description: error.message, variant: "destructive" });
    },
  });
};

export const useRegenerateShareToken = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shareId,
      entityType,
      entityId,
    }: {
      shareId: string;
      entityType: "worksheet" | "world";
      entityId: string;
    }) => {
      const newToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const table = entityType === "worksheet" ? "worksheet_link_shares" : "world_link_shares";

      const { data, error } = await supabase
        .from(table)
        .update({ share_token: newToken })
        .eq("id", shareId)
        .select()
        .single();

      if (error) throw error;
      return { data, entityType, entityId };
    },
    onSuccess: ({ entityType, entityId }) => {
      const key = entityType === "worksheet"
        ? shareKeys.worksheetShare(entityId)
        : shareKeys.worldShare(entityId);
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: "LINK REGENERATED.", description: "PREVIOUS SHARED LINKS DEPRECATED." });
    },
    onError: (error) => {
      toast({ title: "Failed to regenerate link", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteShare = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shareId,
      entityType,
      entityId,
    }: {
      shareId: string;
      entityType: "worksheet" | "world";
      entityId: string;
    }) => {
      const table = entityType === "worksheet" ? "worksheet_link_shares" : "world_link_shares";
      const { error } = await supabase.from(table).delete().eq("id", shareId);
      if (error) throw error;
      return { entityType, entityId };
    },
    onSuccess: ({ entityType, entityId }) => {
      const key = entityType === "worksheet"
        ? shareKeys.worksheetShare(entityId)
        : shareKeys.worldShare(entityId);
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: "Share removed" });
    },
    onError: (error) => {
      toast({ title: "Failed to remove share", description: error.message, variant: "destructive" });
    },
  });
};

// ---- Public Viewer Hooks (no auth required) ----

export const useSharedWorksheet = (token: string | undefined) => {
  return useQuery({
    queryKey: shareKeys.sharedWorksheet(token || ""),
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase.rpc("get_shared_worksheet", {
        p_token: token,
      });

      if (error) throw error;
      if (!data) throw new Error("Shared worksheet not found or link disabled");

      return data as unknown as SharedWorksheetData;
    },
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
};

export const useSharedWorld = (token: string | undefined) => {
  return useQuery({
    queryKey: shareKeys.sharedWorld(token || ""),
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase.rpc("get_shared_world", {
        p_token: token,
      });

      if (error) throw error;
      if (!data) throw new Error("Shared world not found or link disabled");

      return data as unknown as SharedWorldData;
    },
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
};

// ---- Helper ----

export const getShareUrl = (entityType: "worksheet" | "world", token: string): string => {
  return `${window.location.origin}/share/${entityType}/${token}`;
};
