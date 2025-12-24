import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { VisualSet, VisualSetsListResponse } from "./types";

export function useVisualSets(collectionId: string, params?: { page?: number; limit?: number }) {
  return useQuery<VisualSetsListResponse>({
    queryKey: ["visualSets", collectionId, params],
    queryFn: async () => {
      const response = await api.get<VisualSetsListResponse>(
        `/segment-collections/${collectionId}/visual-sets`,
        { params }
      );
      return response.data;
    },
    enabled: !!collectionId,
  });
}

export function useVisualSet(id: string) {
  return useQuery<VisualSet>({
    queryKey: ["visualSet", id],
    queryFn: async () => {
      const response = await api.get<VisualSet>(`/visual-sets/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}
