// ---------------------------------------------------------------------------
// useEntityGraph, React Query hooks for the entity graph data layer.
// ---------------------------------------------------------------------------

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  fetchEntities,
  createEntity,
  updateEntity,
  deleteEntity,
  batchUpdatePositions,
  fetchEntityConnections,
  createEntityConnection,
  updateEntityConnection,
  deleteEntityConnection,
} from "@/services/entity-graph-crud";
import type {
  Entity,
  EntityConnection,
  CreateEntityInput,
  UpdateEntityInput,
  CreateConnectionInput,
  UpdateConnectionInput,
} from "@/services/entity-graph-types";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const entityKeys = {
  all: (worldId: string) => ["entities", worldId] as const,
  connections: (worldId: string) => ["entity-connections", worldId] as const,
};

// ---------------------------------------------------------------------------
// Read hooks
// ---------------------------------------------------------------------------

export function useEntities(worldId: string | undefined) {
  return useQuery<Entity[]>({
    queryKey: entityKeys.all(worldId!),
    queryFn: () => fetchEntities(worldId!),
    enabled: !!worldId,
    staleTime: 30_000,
  });
}

export function useEntityConnections(worldId: string | undefined) {
  return useQuery<EntityConnection[]>({
    queryKey: entityKeys.connections(worldId!),
    queryFn: () => fetchEntityConnections(worldId!),
    enabled: !!worldId,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Entity mutations
// ---------------------------------------------------------------------------

export function useCreateEntity(worldId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CreateEntityInput, "world_id">) =>
      createEntity({ ...input, world_id: worldId! }, user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entityKeys.all(worldId!) });
    },
    onError: (error) => {
      toast({
        title: "ENTITY CREATION FAILED.",
        description: error instanceof Error ? error.message : "Could not create entity.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateEntity(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEntityInput) => updateEntity(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entityKeys.all(worldId!) });
    },
    onError: (error) => {
      toast({
        title: "ENTITY UPDATE FAILED.",
        description: error instanceof Error ? error.message : "Could not update entity.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEntity(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (entityId: string) => deleteEntity(entityId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entityKeys.all(worldId!) });
      qc.invalidateQueries({ queryKey: entityKeys.connections(worldId!) });
    },
    onError: (error) => {
      toast({
        title: "ENTITY DELETE FAILED.",
        description: error instanceof Error ? error.message : "Could not delete entity.",
        variant: "destructive",
      });
    },
  });
}

export function useBatchUpdatePositions(worldId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (
      updates: Array<{ id: string; graph_x: number; graph_y: number; pinned: boolean }>
    ) => batchUpdatePositions(updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entityKeys.all(worldId!) });
    },
  });
}

// ---------------------------------------------------------------------------
// Connection mutations
// ---------------------------------------------------------------------------

export function useCreateEntityConnection(worldId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CreateConnectionInput, "world_id">) =>
      createEntityConnection({ ...input, world_id: worldId! }, user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entityKeys.connections(worldId!) });
    },
    onError: (error) => {
      toast({
        title: "CONNECTION FAILED.",
        description: error instanceof Error ? error.message : "Could not create connection.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateEntityConnection(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateConnectionInput) => updateEntityConnection(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entityKeys.connections(worldId!) });
    },
    onError: (error) => {
      toast({
        title: "CONNECTION UPDATE FAILED.",
        description: error instanceof Error ? error.message : "Could not update connection.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEntityConnection(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) => deleteEntityConnection(connectionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entityKeys.connections(worldId!) });
      toast({ title: "CONNECTION REMOVED." });
    },
    onError: (error) => {
      toast({
        title: "CONNECTION DELETE FAILED.",
        description: error instanceof Error ? error.message : "Could not delete connection.",
        variant: "destructive",
      });
    },
  });
}
