import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { Segment, SegmentsListResponse } from "./types";

// -----------------
// Direct API helpers (for canvas hooks / non-React Query flows)
// -----------------

export async function getSegments(collectionId: string): Promise<SegmentsListResponse> {
  const response = await api.get<SegmentsListResponse>(`/segment-collections/${collectionId}/segments`);
  return response.data;
}

export async function getSegment(id: string): Promise<Segment> {
  const response = await api.get<Segment>(`/segments/${id}`);
  return response.data;
}

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
