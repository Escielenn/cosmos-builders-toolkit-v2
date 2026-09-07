import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  createEntry,
  updateEntry,
  deleteEntry,
  moveEntry,
  type CreateEntryInput,
  type UpdateEntryInput,
  type MoveEntryInput,
} from "@/services/world-entries";
import { invalidateWorldEntries } from "@/services/entity-graph-keys";

export function useCreateEntry(worldId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CreateEntryInput, "worldId">) =>
      createEntry({ ...input, worldId: worldId! }, user!.id),
    onSuccess: () => {
      // world_entries is also the entity table since F3 — one write, one
      // invalidation set (services/entity-graph-keys.ts).
      invalidateWorldEntries(queryClient, worldId);
    },
    onError: (error) => {
      toast({
        title: "ENTRY CREATION FAILED.",
        description: error instanceof Error ? error.message : "Could not create entry.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateEntry(worldId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEntryInput) => updateEntry(input),
    onSuccess: () => {
      // world_entries is also the entity table since F3 — one write, one
      // invalidation set (services/entity-graph-keys.ts).
      invalidateWorldEntries(queryClient, worldId);
    },
    onError: (error) => {
      toast({
        title: "UPDATE FAILED.",
        description: error instanceof Error ? error.message : "Could not update entry.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEntry(worldId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => deleteEntry(entryId),
    onSuccess: () => {
      // world_entries is also the entity table since F3 — one write, one
      // invalidation set (services/entity-graph-keys.ts).
      invalidateWorldEntries(queryClient, worldId);
      toast({ title: "ENTRY DELETED." });
    },
    onError: (error) => {
      toast({
        title: "DELETE FAILED.",
        description: error instanceof Error ? error.message : "Could not delete entry.",
        variant: "destructive",
      });
    },
  });
}

export function useMoveEntry(worldId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MoveEntryInput) => moveEntry(input),
    onSuccess: () => {
      // world_entries is also the entity table since F3 — one write, one
      // invalidation set (services/entity-graph-keys.ts).
      invalidateWorldEntries(queryClient, worldId);
    },
    onError: (error) => {
      toast({
        title: "MOVE FAILED.",
        description: error instanceof Error ? error.message : "Could not move entry.",
        variant: "destructive",
      });
    },
  });
}
