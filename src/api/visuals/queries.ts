// scriptscape-client/src/api/visuals/queries.ts

import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { Visual, VisualsListResponse } from "./types";

// Fetch all visuals for a visual set
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

// Fetch a single visual by ID
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
