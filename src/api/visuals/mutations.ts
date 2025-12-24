import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import type {
  Visual,
  CreateVisualRequest,
  UpdateVisualRequest,
} from "./types";

export function useCreateVisual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      visualSetId,
      ...data
    }: CreateVisualRequest & { visualSetId: string }) => {
      const payload = {
        segment_id: data.segmentId,
        content: data.content,
        meta: (data as any).metadata,
      };
      const response = await api.post<Visual>(
        `/visual-sets/${visualSetId}/visuals`,
        payload
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visuals", variables?.visualSetId] });
    },
  });
}

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
   
      const payload = {
        content: data.content,
        metadata: (data as any).metadata,
      };
      const response = await api.patch<Visual>(`/visuals/${id}`, payload);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visuals"] });
      queryClient.invalidateQueries({ queryKey: ["visual", variables.id] });
    },
  });
}

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
