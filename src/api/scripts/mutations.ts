// scriptscape-client/src/api/scripts/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import type {
  Script,
  CreateScriptRequest,
  UpdateScriptRequest,
} from "./types";

// Create script
export function useCreateScript(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateScriptRequest) => {
      const response = await api.post<Script>(
        `/projects/${projectId}/scripts`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts", projectId] });
    },
  });
}

// Update script
export function useUpdateScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateScriptRequest;
    }) => {
      const response = await api.patch<Script>(`/scripts/${id}`, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
      queryClient.invalidateQueries({ queryKey: ["script", variables.id] });
    },
  });
}

// Delete script
export function useDeleteScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/scripts/${id}`);
      return id;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
      queryClient.removeQueries({ queryKey: ["script", id] });
    },
  });
}
