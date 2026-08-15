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
      // Without a world in context, list this user's saves of this type across
      // every world. The simulator can be opened straight from the tools index,
      // and the save dialog lets a world be chosen there; scoping this query to
      // a worldId that does not exist meant the writer saved successfully and
      // then found the Load sheet empty, which reads as "saving does not work".
      // RLS is owner-only, so the unscoped read returns nothing but their own.
      let q = supabase
        .from("simulation_saves")
        .select("*")
        .eq("simulator_type", simulatorType);
      if (worldId) q = q.eq("world_id", worldId);

      const { data, error } = await q.order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as SimulationSave[];
    },
    enabled: !!user,
  });

  // ── Mutation: create a new simulation save ───────────────────────
  const createSave = useMutation({
    mutationFn: async (input: {
      name: string;
      data: SimulatorPayload;
      narrativeNotes?: Record<string, string>;
      /** Chosen in the save dialog when the simulator has no world in context.
          A save with no world is invisible to the writing surface. */
      worldId?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const targetWorld = input.worldId ?? worldId ?? null;
      if (!targetWorld) {
        throw new Error("Choose a world to save this simulation into");
      }

      const { data, error } = await supabase
        .from("simulation_saves")
        .insert({
          world_id: targetWorld,
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
    onSuccess: (saved) => {
      // Invalidate the world actually written to, not just the one in context.
      // A save into a world chosen in the dialog left the list showing the old
      // contents, so a successful save looked like it had done nothing.
      queryClient.invalidateQueries({
        queryKey: ["simulation-saves", saved.world_id, simulatorType],
      });
      if (worldId && worldId !== saved.world_id) {
        queryClient.invalidateQueries({
          queryKey: ["simulation-saves", worldId, simulatorType],
        });
      }
      toast({
        title: "Simulation saved",
        description: "Your simulation state has been saved.",
      });
      setSaveDialogOpen(false);
      // Keep the payload. It is still an accurate picture of the simulator, and
      // clearing it here meant that saving and then publishing sent an empty
      // payload to the world: the save succeeded and the entity arrived hollow.
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

  /**
   * Why the current state was asked for.
   *
   * The simulator answers a state request with the same STELLARFORGE_SAVE
   * message whoever asked, so the reason has to be remembered here. Without it
   * the only way to obtain a payload was to press Save, which is why publishing
   * used to carry nothing: Publish opened its dialog with whatever `pendingPayload`
   * happened to hold, and that was null unless the writer had saved first in the
   * same session. The published entity then got `_simulator_data: {}` and arrived
   * in the world as a bare name.
   */
  const requestReason = useRef<"save" | "state">("save");

  // ── Listen for SAVE messages from the simulator ──────────────────
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "STELLARFORGE_SAVE") {
        const payload = event.data.payload as SimulatorPayload;
        // Always record it. Only the Save button should open the save dialog.
        setPendingPayload(payload);
        if (requestReason.current === "save") setSaveDialogOpen(true);
        requestReason.current = "save";
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  /** Ask the simulator for its current state. Iframe sims: postMessage.
   *  Component sims (ExoSky, native Rogue/Solaris): window event. */
  const askForState = useCallback(() => {
    const iframe = iframeRef?.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: "STELLARFORGE_REQUEST_STATE" }, "*");
    } else {
      window.dispatchEvent(new CustomEvent("STELLARFORGE_REQUEST_STATE"));
    }
  }, [iframeRef]);

  /** Save button: fetch state, then open the save dialog when it lands. */
  const requestSave = useCallback(() => {
    requestReason.current = "save";
    askForState();
  }, [askForState]);

  /**
   * Refresh `pendingPayload` without opening anything.
   *
   * Call before publishing, so what reaches the world is the simulation as it
   * stands now rather than whatever was last saved.
   */
  const refreshPayload = useCallback(() => {
    requestReason.current = "state";
    askForState();
  }, [askForState]);

  return {
    saves: savesQuery.data ?? [],
    isLoadingSaves: savesQuery.isLoading,
    pendingPayload,
    saveDialogOpen,
    setSaveDialogOpen,
    createSave,
    loadSave,
    requestSave,
    refreshPayload,
  };
}
