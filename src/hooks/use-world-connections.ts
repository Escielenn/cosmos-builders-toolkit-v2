import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  createConnection,
  deleteConnection,
  updateConnection,
  type CreateConnectionInput,
  type UpdateConnectionInput,
} from "@/services/world-connections-crud";
import { mapError } from "@/lib/ship-voice";

export function useCreateConnection(worldId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CreateConnectionInput, "worldId">) =>
      createConnection({ ...input, worldId: worldId! }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-outline", worldId] });
    },
    onError: (error) => {
      toast({
        title: "CONNECTION FAILED.",
        description: mapError(error),
        variant: "destructive",
      });
    },
  });
}

export function useDeleteConnection(worldId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) => deleteConnection(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-outline", worldId] });
      toast({ title: "CONNECTION REMOVED." });
    },
    onError: (error) => {
      toast({
        title: "DELETE FAILED.",
        description: mapError(error),
        variant: "destructive",
      });
    },
  });
}

export function useUpdateConnection(worldId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateConnectionInput) => updateConnection(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-outline", worldId] });
    },
    onError: (error) => {
      toast({
        title: "UPDATE FAILED.",
        description: mapError(error),
        variant: "destructive",
      });
    },
  });
}
