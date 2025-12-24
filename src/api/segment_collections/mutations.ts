// scriptscape-client/src/api/segment_collections/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import type {
  SegmentCollection,
  CreateSegmentCollectionRequest,
  UpdateSegmentCollectionRequest,
} from "./types";

// Create segment collection
export function useCreateSegmentCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      scriptId,
      ...data
    }: CreateSegmentCollectionRequest & { scriptId: string }) => {
      const payload = {
        name: data.name,
        metadata: (data as any).metadata,
      };
      const response = await api.post<SegmentCollection>(
        `/scripts/${scriptId}/segment-collections`,
        payload
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["segmentCollections", variables?.scriptId] });
    },
  });
}

// Update segment collection
export function useUpdateSegmentCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSegmentCollectionRequest;
    }) => {
      // Convert to snake_case
      const payload = {
        name: data.name,
        metadata: (data as any).metadata,
      };
      const response = await api.patch<SegmentCollection>(`/segment-collections/${id}`, payload);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["segmentCollections"] });
      queryClient.invalidateQueries({ queryKey: ["segmentCollection", variables.id] });
    },
  });
}

// Delete segment collection
export function useDeleteSegmentCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/segment-collections/${id}`);
      return id;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["segmentCollections"] });
      queryClient.removeQueries({ queryKey: ["segmentCollection", id] });
    },
  });
}
