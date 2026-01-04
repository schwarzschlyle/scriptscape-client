import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import type {
  StoryboardSketch,
  CreateStoryboardSketchRequest,
  UpdateStoryboardSketchRequest,
} from "./types";

export function useCreateStoryboardSketch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      storyboardId,
      ...data
    }: CreateStoryboardSketchRequest & { storyboardId: string }) => {
      const payload = {
        name: data.name,
        image_base64: data.image_base64,
        meta: data.meta,
      };
      const response = await api.post<StoryboardSketch>(
        `/storyboards/${storyboardId}/storyboard-sketches`,
        payload
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["storyboard_sketches", variables.storyboardId] });
    },
  });
}

export function useUpdateStoryboardSketch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      storyboardId: string;
      data: UpdateStoryboardSketchRequest;
    }) => {
      const payload = {
        name: data.name,
        image_base64: data.image_base64,
        meta: data.meta,
      };
      const response = await api.patch<StoryboardSketch>(
        `/storyboard-sketches/${id}`,
        payload
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["storyboard_sketches", variables.storyboardId] });
      queryClient.invalidateQueries({ queryKey: ["storyboard_sketch", variables.id] });
    },
  });
}

export function useDeleteStoryboardSketch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
    }: {
      id: string;
      storyboardId: string;
    }) => {
      await api.delete(`/storyboard-sketches/${id}`);
      return id;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["storyboard_sketches", variables.storyboardId] });
      queryClient.removeQueries({ queryKey: ["storyboard_sketch", variables.id] });
    },
  });
}
