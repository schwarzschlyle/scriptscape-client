// scriptscape-client/src/api/segments/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import type {
  Segment,
  CreateSegmentRequest,
  UpdateSegmentRequest,
} from "./types";

// Create segment
export function useCreateSegment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      collectionId,
      ...data
    }: CreateSegmentRequest & { collectionId: string }) => {
      const payload = {
        segment_index: data.segmentIndex,
        text: data.text,
        metadata: (data as any).metadata,
      };
      const response = await api.post<Segment>(
        `/segment-collections/${collectionId}/segments`,
        payload
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["segments", variables?.collectionId] });
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
      // Convert to snake_case
      const payload = {
        segment_index: data.segmentIndex,
        text: data.text,
        metadata: (data as any).metadata,
      };
      const response = await api.patch<Segment>(`/segments/${id}`, payload);
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
