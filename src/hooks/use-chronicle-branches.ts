/**
 * React Query hooks for Chronicle branches and jumps.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChronicleBranchData,
  createChronicleBranch,
  updateChronicleBranch,
  deleteChronicleBranch,
  createChronicleJump,
  updateChronicleJump,
  deleteChronicleJump,
  type BranchInput,
  type JumpInput,
} from "@/services/chronicle-branches";

export const chronicleBranchKey = (worldId: string | undefined) =>
  ["chronicle-branches", worldId] as const;

export function useChronicleBranches(worldId: string | undefined) {
  return useQuery({
    queryKey: chronicleBranchKey(worldId),
    queryFn: () => getChronicleBranchData(worldId!),
    enabled: !!worldId,
    staleTime: 30_000,
  });
}

function useInvalidate(worldId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: chronicleBranchKey(worldId) });
    // Deleting a branch moves its events to prime; refresh the events too.
    queryClient.invalidateQueries({ queryKey: ["chronicle-data", worldId] });
  };
}

export function useSaveChronicleBranch(worldId: string) {
  const invalidate = useInvalidate(worldId);
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: BranchInput }) =>
      id ? updateChronicleBranch(id, input).then(() => undefined) : createChronicleBranch(worldId, input).then(() => undefined),
    onSuccess: invalidate,
  });
}

export function useDeleteChronicleBranch(worldId: string) {
  const invalidate = useInvalidate(worldId);
  return useMutation({
    mutationFn: (branchId: string) => deleteChronicleBranch(branchId),
    onSuccess: invalidate,
  });
}

export function useSaveChronicleJump(worldId: string) {
  const invalidate = useInvalidate(worldId);
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: JumpInput }) =>
      id ? updateChronicleJump(id, input).then(() => undefined) : createChronicleJump(worldId, input).then(() => undefined),
    onSuccess: invalidate,
  });
}

export function useDeleteChronicleJump(worldId: string) {
  const invalidate = useInvalidate(worldId);
  return useMutation({
    mutationFn: (jumpId: string) => deleteChronicleJump(jumpId),
    onSuccess: invalidate,
  });
}
