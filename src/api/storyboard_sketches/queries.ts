import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { StoryboardSketch } from "./types";

// Direct API functions

export async function getStoryboardSketches(storyboardId: string): Promise<StoryboardSketch[]> {
  const response = await api.get<StoryboardSketch[]>(
    `/storyboards/${storyboardId}/storyboard-sketches`
  );
  return response.data;
}

export async function createStoryboardSketch(
  storyboardId: string,
  data: { name: string; image_base64: string; meta?: Record<string, any> }
): Promise<StoryboardSketch> {
  const response = await api.post<StoryboardSketch>(
    `/storyboards/${storyboardId}/storyboard-sketches`,
    data
  );
  return response.data;
}

export async function updateStoryboardSketch(
  sketchId: string,
  data: { name?: string; image_base64?: string; meta?: Record<string, any> }
): Promise<StoryboardSketch> {
  const response = await api.patch<StoryboardSketch>(
    `/storyboard-sketches/${sketchId}`,
    data
  );
  return response.data;
}

export async function deleteStoryboardSketch(
  sketchId: string
): Promise<void> {
  await api.delete(`/storyboard-sketches/${sketchId}`);
}

// React Query hooks

export function useStoryboardSketches(storyboardId: string) {
  return useQuery<StoryboardSketch[]>({
    queryKey: ["storyboard_sketches", storyboardId],
    queryFn: async () => {
      const response = await api.get<StoryboardSketch[]>(
        `/storyboards/${storyboardId}/storyboard-sketches`
      );
      return response.data;
    },
    enabled: !!storyboardId,
  });
}

export function useStoryboardSketch(sketchId: string) {
  return useQuery<StoryboardSketch>({
    queryKey: ["storyboard_sketch", sketchId],
    queryFn: async () => {
      const response = await api.get<StoryboardSketch>(
        `/storyboard-sketches/${sketchId}`
      );
      return response.data;
    },
    enabled: !!sketchId,
  });
}
