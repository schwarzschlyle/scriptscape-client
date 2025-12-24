// scriptscape-client/src/api/visuals/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import type {
  Visual,
  CreateVisualRequest,
  UpdateVisualRequest,
} from "./types";

// Create visual
export function useCreateVisual(visualSetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateVisualRequest) => {
      const response = await api.post<Visual>(
        `/visual-sets/${visualSetId}/visuals`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visuals", visualSetId] });
    },
  });
}

// Update visual
export function useUpdateVisual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateVisualRequest;
    }) => {
      const response = await api.patch<Visual>(`/visuals/${id}`, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visuals"] });
      queryClient.invalidateQueries({ queryKey: ["visual", variables.id] });
    },
  });
}

// Delete visual
export function useDeleteVisual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/visuals/${id}`);
      return id;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["visuals"] });
      queryClient.removeQueries({ queryKey: ["visual", id] });
    },
  });
}
