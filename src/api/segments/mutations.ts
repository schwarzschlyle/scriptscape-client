// scriptscape-client/src/api/segments/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import type {
  Segment,
  CreateSegmentRequest,
  UpdateSegmentRequest,
} from "./types";

// Create segment
export function useCreateSegment(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSegmentRequest) => {
      const response = await api.post<Segment>(
        `/segment-collections/${collectionId}/segments`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segments", collectionId] });
    },
  });
}

// Update segment
export function useUpdateSegment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSegmentRequest;
    }) => {
      const response = await api.patch<Segment>(`/segments/${id}`, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
      queryClient.invalidateQueries({ queryKey: ["segment", variables.id] });
    },
  });
}

// Delete segment
export function useDeleteSegment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/segments/${id}`);
      return id;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
      queryClient.removeQueries({ queryKey: ["segment", id] });
    },
  });
}
