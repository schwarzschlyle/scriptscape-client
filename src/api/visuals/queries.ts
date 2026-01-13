import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { Visual, VisualsListResponse } from "./types";

// -----------------
// Direct API helpers (for canvas hooks / non-React Query flows)
// -----------------

export async function getVisuals(visualSetId: string): Promise<Visual[]> {
  const response = await api.get<Visual[]>(`/visual-sets/${visualSetId}/visuals`);
  return response.data;
}

export function useVisuals(visualSetId: string) {
  return useQuery<VisualsListResponse>({
    queryKey: ["visuals", visualSetId],
    queryFn: async () => {
      const response = await api.get<VisualsListResponse>(
        `/visual-sets/${visualSetId}/visuals`
      );
      return response.data;
    },
    enabled: !!visualSetId,
  });
}

export function useVisual(id: string) {
  return useQuery<Visual>({
    queryKey: ["visual", id],
    queryFn: async () => {
      const response = await api.get<Visual>(`/visuals/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}
