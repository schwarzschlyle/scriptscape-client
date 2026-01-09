import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { SegmentCollection, SegmentCollectionsListResponse } from "./types";

// -----------------
// Direct API helpers (for canvas hooks / non-React Query flows)
// -----------------

export async function getSegmentCollections(
  scriptId: string,
  params?: { page?: number; limit?: number }
): Promise<SegmentCollection[]> {
  const response = await api.get<SegmentCollection[]>(`/scripts/${scriptId}/segment-collections`, { params });
  return response.data;
}

export async function getSegmentCollection(id: string): Promise<SegmentCollection> {
  const response = await api.get<SegmentCollection>(`/segment-collections/${id}`);
  return response.data;
}

export function useSegmentCollections(scriptId: string, params?: { page?: number; limit?: number }) {
  return useQuery<SegmentCollectionsListResponse>({
    queryKey: ["segmentCollections", scriptId, params],
    queryFn: async () => {
      const response = await api.get<SegmentCollectionsListResponse>(
        `/scripts/${scriptId}/segment-collections`,
        { params }
      );
      return response.data;
    },
    enabled: !!scriptId,
  });
}

export function useSegmentCollection(id: string) {
  return useQuery<SegmentCollection>({
    queryKey: ["segmentCollection", id],
    queryFn: async () => {
      const response = await api.get<SegmentCollection>(`/segment-collections/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}
