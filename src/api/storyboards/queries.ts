import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { Storyboard } from "./types";

// Direct API functions

export async function getStoryboards(visualSetId: string): Promise<Storyboard[]> {
  const response = await api.get<Storyboard[]>(
    `/visual-sets/${visualSetId}/storyboards`
  );
  return response.data;
}

export async function createStoryboard(
  visualSetId: string,
  data: { name: string; description?: string; meta?: Record<string, any> }
): Promise<Storyboard> {
  const response = await api.post<Storyboard>(
    `/visual-sets/${visualSetId}/storyboards`,
    data
  );
  return response.data;
}

export async function updateStoryboard(
  storyboardId: string,
  data: { name?: string; description?: string; meta?: Record<string, any> }
): Promise<Storyboard> {
  const response = await api.patch<Storyboard>(
    `/storyboards/${storyboardId}`,
    data
  );
  return response.data;
}

export async function deleteStoryboard(
  storyboardId: string
): Promise<void> {
  await api.delete(`/storyboards/${storyboardId}`);
}

// React Query hooks

export function useStoryboards(visualSetId: string) {
  return useQuery<Storyboard[]>({
    queryKey: ["storyboards", visualSetId],
    queryFn: async () => {
      const response = await api.get<Storyboard[]>(
        `/visual-sets/${visualSetId}/storyboards`
      );
      return response.data;
    },
    enabled: !!visualSetId,
  });
}

export function useStoryboard(storyboardId: string) {
  return useQuery<Storyboard>({
    queryKey: ["storyboard", storyboardId],
    queryFn: async () => {
      const response = await api.get<Storyboard>(
        `/storyboards/${storyboardId}`
      );
      return response.data;
    },
    enabled: !!storyboardId,
  });
}
