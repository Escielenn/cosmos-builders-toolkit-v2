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

export function useCreateEntry(worldId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CreateEntryInput, "worldId">) =>
      createEntry({ ...input, worldId: worldId! }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-outline", worldId] });
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
      queryClient.invalidateQueries({ queryKey: ["world-outline", worldId] });
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
      queryClient.invalidateQueries({ queryKey: ["world-outline", worldId] });
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
      queryClient.invalidateQueries({ queryKey: ["world-outline", worldId] });
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
