// scriptscape-client/src/api/segments/queries.ts

import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { Segment, SegmentsListResponse } from "./types";

// Fetch all segments for a segment collection
export function useSegments(collectionId: string) {
  return useQuery<SegmentsListResponse>({
    queryKey: ["segments", collectionId],
    queryFn: async () => {
      const response = await api.get<SegmentsListResponse>(
        `/segment-collections/${collectionId}/segments`
      );
      return response.data;
    },
    enabled: !!collectionId,
  });
}

// Fetch a single segment by ID
export function useSegment(id: string) {
  return useQuery<Segment>({
    queryKey: ["segment", id],
    queryFn: async () => {
      const response = await api.get<Segment>(`/segments/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}
