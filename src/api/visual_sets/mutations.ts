// scriptscape-client/src/api/visual_sets/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import type {
  VisualSet,
  CreateVisualSetRequest,
  UpdateVisualSetRequest,
} from "./types";

// Create visual set
export function useCreateVisualSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      collectionId,
      ...data
    }: CreateVisualSetRequest & { collectionId: string }) => {
      const payload = {
        name: data.name,
        description: (data as any).description,
        metadata: (data as any).metadata,
      };
      const response = await api.post<VisualSet>(
        `/segment-collections/${collectionId}/visual-sets`,
        payload
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visualSets", variables?.collectionId] });
    },
  });
}

// Update visual set
export function useUpdateVisualSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateVisualSetRequest;
    }) => {
      // Convert to snake_case
      const payload = {
        name: data.name,
        description: (data as any).description,
        metadata: (data as any).metadata,
      };
      const response = await api.patch<VisualSet>(`/visual-sets/${id}`, payload);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visualSets"] });
      queryClient.invalidateQueries({ queryKey: ["visualSet", variables.id] });
    },
  });
}

// Delete visual set
export function useDeleteVisualSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/visual-sets/${id}`);
      return id;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["visualSets"] });
      queryClient.removeQueries({ queryKey: ["visualSet", id] });
    },
  });
}
