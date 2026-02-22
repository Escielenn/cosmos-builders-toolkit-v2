/**
 * React Query hooks for Chronicle data and mutations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChronicleData,
  createChronicleEvent,
  updateChronicleEvent,
  deleteChronicleEvent,
  updateCalendarConfig,
} from "@/services/chronicle-data";
import type {
  CreateEventInput,
  UpdateEventInput,
  CalendarConfig,
} from "@/services/chronicle-data";

export function useChronicleData(worldId: string | undefined) {
  return useQuery({
    queryKey: ["chronicle-data", worldId],
    queryFn: () => getChronicleData(worldId!),
    enabled: !!worldId,
    staleTime: 30_000,
  });
}

export function useCreateChronicleEvent(worldId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventInput) =>
      createChronicleEvent(worldId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chronicle-data", worldId],
      });
    },
  });
}

export function useUpdateChronicleEvent(worldId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      updates,
    }: {
      eventId: string;
      updates: UpdateEventInput;
    }) => updateChronicleEvent(eventId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chronicle-data", worldId],
      });
    },
  });
}

export function useDeleteChronicleEvent(worldId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => deleteChronicleEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chronicle-data", worldId],
      });
    },
  });
}

export function useUpdateCalendarConfig(worldId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: CalendarConfig) =>
      updateCalendarConfig(worldId, config),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chronicle-data", worldId],
      });
    },
  });
}
