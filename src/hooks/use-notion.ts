import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "./use-toast";

interface NotionConnection {
  id: string;
  workspace_id: string;
  workspace_name: string | null;
  workspace_icon: string | null;
}

interface NotionExportParams {
  toolName: string;
  worldName?: string;
  worksheetTitle?: string;
  data: Record<string, unknown>;
}

interface NotionExportResult {
  success: boolean;
  pageId?: string;
  pageUrl?: string;
  error?: string;
}

export function useNotion() {
  const { session, user } = useAuth();
  const { toast } = useToast();
  const [connection, setConnection] = useState<NotionConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Check for existing connection
  useEffect(() => {
    if (!user) {
      setConnection(null);
      setIsLoading(false);
      return;
    }

    const fetchConnection = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("notion_connections")
          .select("id, workspace_id, workspace_name, workspace_icon")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching Notion connection:", error);
        } else {
          setConnection(data);
        }
      } catch (err) {
        console.error("Failed to fetch Notion connection:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnection();
  }, [user]);

  // Start OAuth flow
  const connect = useCallback(async () => {
    if (!session?.access_token) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to connect Notion.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      // Get current session to verify auth state
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log("Current session:", {
        hasSession: !!currentSession,
        hasAccessToken: !!currentSession?.access_token,
        tokenPreview: currentSession?.access_token?.substring(0, 30) + "...",
        expiresAt: currentSession?.expires_at,
      });

      if (!currentSession?.access_token) {
        throw new Error("No valid session - please sign in again");
      }

      // Use fetch directly to bypass Supabase client auth issues
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const fetchResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/notion-auth-start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${currentSession.access_token}`,
          },
          body: JSON.stringify({ token: currentSession.access_token }),
        }
      );

      console.log("Fetch response status:", fetchResponse.status);

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        console.error("Fetch error:", errorText);
        throw new Error(`Server error: ${fetchResponse.status}`);
      }

      const data = await fetchResponse.json() as { success: boolean; error?: string; authUrl?: string; state?: string };
      console.log("notion-auth-start response:", data);

      if (!data.success) {
        console.error("Notion auth start error:", data.error);
        throw new Error(data.error || "Failed to start Notion connection");
      }

      const { authUrl, state } = data;

      // Store state in sessionStorage for callback verification
      sessionStorage.setItem("notion_oauth_state", state);

      // Open Notion OAuth in a popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        "notion-oauth",
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      );

      // Poll for popup close and handle callback
      const pollInterval = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(pollInterval);
          setIsConnecting(false);

          // Check if connection was successful by refetching
          if (user) {
            const { data } = await supabase
              .from("notion_connections")
              .select("id, workspace_id, workspace_name, workspace_icon")
              .eq("user_id", user.id)
              .maybeSingle();

            if (data) {
              setConnection(data);
              toast({
                title: "Notion connected",
                description: `Connected to ${data.workspace_name || "workspace"}`,
              });
            }
          }
        }
      }, 500);
    } catch (error) {
      console.error("Notion connect error:", error);
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to Notion",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  }, [session, toast, user]);

  // Handle OAuth callback (call this from the callback page)
  const handleCallback = useCallback(
    async (code: string, state: string) => {
      if (!session?.access_token) {
        return { success: false, error: "Not authenticated" };
      }

      // Verify state matches
      const savedState = sessionStorage.getItem("notion_oauth_state");
      if (state !== savedState) {
        return { success: false, error: "Invalid state parameter" };
      }

      try {
        const response = await supabase.functions.invoke("notion-auth-callback", {
          body: { code, state },
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        sessionStorage.removeItem("notion_oauth_state");
        return { success: true, ...response.data };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Callback failed",
        };
      }
    },
    [session]
  );

  // Export to Notion
  const exportToNotion = useCallback(
    async (params: NotionExportParams): Promise<NotionExportResult> => {
      if (!session?.access_token) {
        return { success: false, error: "Not authenticated" };
      }

      if (!connection) {
        return { success: false, error: "Notion not connected" };
      }

      setIsExporting(true);
      try {
        const response = await supabase.functions.invoke("notion-export", {
          body: params,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        if (response.data.error) {
          throw new Error(response.data.error);
        }

        return {
          success: true,
          pageId: response.data.pageId,
          pageUrl: response.data.pageUrl,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Export failed",
        };
      } finally {
        setIsExporting(false);
      }
    },
    [session, connection]
  );

  // Disconnect Notion
  const disconnect = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notion_connections")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setConnection(null);
      toast({
        title: "Notion disconnected",
        description: "Your Notion workspace has been disconnected.",
      });
    } catch (error) {
      console.error("Disconnect error:", error);
      toast({
        title: "Disconnect failed",
        description: "Failed to disconnect Notion.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  return {
    connection,
    isLoading,
    isConnected: !!connection,
    isConnecting,
    isExporting,
    connect,
    disconnect,
    handleCallback,
    exportToNotion,
  };
}
