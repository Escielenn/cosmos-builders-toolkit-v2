/**
 * useSimulationSave, Manages saving and loading simulation state via PostMessage.
 *
 * Listens for STELLARFORGE_SAVE messages from simulator iframes and persists
 * them to the simulation_saves table. Also handles loading saved state back
 * into the simulator via STELLARFORGE_LOAD messages.
 *
 * Spec: StellarForge_Simulator_Addendum, Simulation Save & Replay
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface SimulationSave {
  id: string;
  world_id: string | null;
  user_id: string;
  simulator_type: string;
  name: string;
  data: {
    parameters: Record<string, unknown>;
    results: Record<string, unknown>;
  };
  narrative_notes: Record<string, string> | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SimulatorPayload {
  outputType?: string;
  name?: string;
  parameters: Record<string, unknown>;
  results: Record<string, unknown>;
}

interface UseSimulationSaveOptions {
  simulatorType: string;
  worldId: string | undefined;
  /** Iframe-based simulators pass their iframeRef so save/load can postMessage
      into the iframe. React-component simulators (ExoSky) omit this and
      handle save/load via window-scoped events instead. */
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
}

export function useSimulationSave({
  simulatorType,
  worldId,
  iframeRef,
}: UseSimulationSaveOptions) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [pendingPayload, setPendingPayload] = useState<SimulatorPayload | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // ── Query: list saved simulations for this world + type ──────────
  const savesQuery = useQuery({
    queryKey: ["simulation-saves", worldId, simulatorType],
    queryFn: async () => {
      if (!worldId) return [];
      const { data, error } = await supabase
        .from("simulation_saves")
        .select("*")
        .eq("world_id", worldId)
        .eq("simulator_type", simulatorType)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as SimulationSave[];
    },
    enabled: !!user && !!worldId,
  });

  // ── Mutation: create a new simulation save ───────────────────────
  const createSave = useMutation({
    mutationFn: async (input: {
      name: string;
      data: SimulatorPayload;
      narrativeNotes?: Record<string, string>;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("simulation_saves")
        .insert({
          world_id: worldId ?? null,
          user_id: user.id,
          simulator_type: simulatorType,
          name: input.name,
          data: {
            parameters: input.data.parameters,
            results: input.data.results,
          },
          narrative_notes: input.narrativeNotes ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SimulationSave;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["simulation-saves", worldId, simulatorType],
      });
      toast({
        title: "Simulation saved",
        description: "Your simulation state has been saved.",
      });
      setSaveDialogOpen(false);
      setPendingPayload(null);
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ── Load saved state into the simulator ──────────────────────────
  // For iframe sims (Rogue/Tidelock/etc.), postMessage into the iframe.
  // For React-component sims (ExoSky), broadcast on the window so the
  // component can listen and apply the payload.
  const loadSave = useCallback(
    (save: SimulationSave) => {
      const iframe = iframeRef?.current;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          { type: "STELLARFORGE_LOAD", payload: save.data },
          "*"
        );
      } else {
        window.dispatchEvent(
          new CustomEvent("STELLARFORGE_LOAD", { detail: save.data })
        );
      }

      toast({
        title: "Simulation loaded",
        description: `Loaded "${save.name}"`,
      });
    },
    [iframeRef, toast]
  );

  // ── Listen for SAVE messages from the simulator iframe ───────────
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "STELLARFORGE_SAVE") {
        const payload = event.data.payload as SimulatorPayload;
        setPendingPayload(payload);
        setSaveDialogOpen(true);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // ── Trigger save from React (for wrapper "Save" button) ─────────
  // Iframe sims: postMessage. Component sims (ExoSky): window event.
  const requestSave = useCallback(() => {
    const iframe = iframeRef?.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: "STELLARFORGE_REQUEST_STATE" },
        "*"
      );
    } else {
      window.dispatchEvent(new CustomEvent("STELLARFORGE_REQUEST_STATE"));
    }
  }, [iframeRef]);

  return {
    saves: savesQuery.data ?? [],
    isLoadingSaves: savesQuery.isLoading,
    pendingPayload,
    saveDialogOpen,
    setSaveDialogOpen,
    createSave,
    loadSave,
    requestSave,
  };
}
