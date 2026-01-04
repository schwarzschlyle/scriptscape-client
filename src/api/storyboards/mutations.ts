import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import type {
  Storyboard,
  CreateStoryboardRequest,
  UpdateStoryboardRequest,
} from "./types";

export function useCreateStoryboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      visualSetId,
      ...data
    }: CreateStoryboardRequest & { visualSetId: string }) => {
      const payload = {
        name: data.name,
        description: data.description,
        meta: data.meta,
      };
      const response = await api.post<Storyboard>(
        `/visual-sets/${visualSetId}/storyboards`,
        payload
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["storyboards", variables.visualSetId] });
    },
  });
}

export function useUpdateStoryboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      visualSetId: string;
      data: UpdateStoryboardRequest;
    }) => {
      const payload = {
        name: data.name,
        description: data.description,
        meta: data.meta,
      };
      const response = await api.patch<Storyboard>(
        `/storyboards/${id}`,
        payload
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["storyboards", variables.visualSetId] });
      queryClient.invalidateQueries({ queryKey: ["storyboard", variables.id] });
    },
  });
}

export function useDeleteStoryboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
    }: {
      id: string;
      visualSetId: string;
    }) => {
      await api.delete(`/storyboards/${id}`);
      return id;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["storyboards", variables.visualSetId] });
      queryClient.removeQueries({ queryKey: ["storyboard", variables.id] });
    },
  });
}
