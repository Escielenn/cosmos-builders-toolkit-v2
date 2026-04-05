// ---------------------------------------------------------------------------
// ExampleWorldBanner — Promotional banner for the example world (Tidelock Archives)
// Shown on the Worlds page. Users can view, fork, or hide.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, GitFork, X, Globe } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForkWorld } from "@/hooks/use-fork-world";
import { useNavigate } from "react-router-dom";

/** Fetch the first example world (is_example = true) */
function useExampleWorld() {
  return useQuery({
    queryKey: ["example-world"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worlds")
        .select("id, name, description, icon, fork_count, license")
        .eq("is_example", true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
  });
}

/** Check if the user has hidden the example world */
function useIsExampleHidden(worldId: string | undefined) {
  const { user } = useAuth();

  return useQuery<boolean>({
    queryKey: ["example-hidden", worldId, user?.id],
    queryFn: async () => {
      if (!user || !worldId) return false;

      const { data, error } = await supabase
        .from("hidden_example_worlds")
        .select("id")
        .eq("world_id", worldId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!worldId,
    staleTime: 5 * 60_000,
  });
}

/** Hide the example world for the current user */
function useHideExample(worldId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user || !worldId) throw new Error("Missing user or worldId");

      const { error } = await supabase
        .from("hidden_example_worlds")
        .insert({ world_id: worldId, user_id: user.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["example-hidden", worldId] });
    },
  });
}

export default function ExampleWorldBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: exampleWorld, isLoading } = useExampleWorld();
  const { data: isHidden = false } = useIsExampleHidden(exampleWorld?.id);
  const hideExample = useHideExample(exampleWorld?.id);
  const forkWorld = useForkWorld();
  const [dismissed, setDismissed] = useState(false);

  // Don't render if: loading, no example world, hidden, or dismissed
  if (isLoading || !exampleWorld || isHidden || dismissed) return null;

  const handleFork = async () => {
    const newWorldId = await forkWorld.mutateAsync(exampleWorld.id);
    if (newWorldId) {
      navigate(`/worlds/${newWorldId}`);
    }
  };

  const handleHide = () => {
    if (user) {
      hideExample.mutate();
    } else {
      setDismissed(true);
    }
  };

  return (
    <GlassPanel className="p-5 mb-8 relative overflow-hidden" lightArc>
      {/* Atmosphere tint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 80% 30%, hsl(157 100% 62% / 0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Icon + text */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Globe className="w-8 h-8 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="font-heading text-sm font-light uppercase tracking-[2px] text-tier-1">
              Explore The Tidelock Archives
            </h3>
            <p className="font-sans text-xs text-tier-3 mt-0.5">
              Our example world -- see how a fully-built world looks in StellarForge.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to={`/worlds/${exampleWorld.id}/showcase`}
            className="inline-flex items-center gap-1.5 font-sans text-xs font-medium uppercase tracking-[1px] px-3 py-1.5 bg-primary/[0.06] border border-primary/[0.15] text-primary hover:bg-primary/[0.12] transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </Link>

          {user && exampleWorld.license !== "view_only" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFork}
              disabled={forkWorld.isPending}
              className="gap-1.5 text-tier-3 hover:text-primary"
            >
              {forkWorld.isPending ? (
                <Loader variant="inline" size="sm" />
              ) : (
                <GitFork className="w-3.5 h-3.5" />
              )}
              Fork
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-tier-4 hover:text-tier-2"
            onClick={handleHide}
            aria-label="Hide example world banner"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </GlassPanel>
  );
}
