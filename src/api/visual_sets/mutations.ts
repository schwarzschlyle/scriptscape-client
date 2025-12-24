// scriptscape-client/src/api/visual_sets/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import type {
  VisualSet,
  CreateVisualSetRequest,
  UpdateVisualSetRequest,
} from "./types";

// Create visual set
export function useCreateVisualSet(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateVisualSetRequest) => {
      const response = await api.post<VisualSet>(
        `/segment-collections/${collectionId}/visuals`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visualSets", collectionId] });
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
      const response = await api.patch<VisualSet>(`/visual-sets/${id}`, data);
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
