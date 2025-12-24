// scriptscape-client/src/api/scripts/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import type {
  Script,
  CreateScriptRequest,
  UpdateScriptRequest,
} from "./types";

// Create script
export function useCreateScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      organizationId,
      projectId,
      ...data
    }: CreateScriptRequest & { organizationId: string; projectId: string }) => {
      const payload = {
        name: data.name,
        text: data.text,
        meta: (data as any).metadata,
      };
      const response = await api.post<Script>(
        `/organizations/${organizationId}/projects/${projectId}/scripts`,
        payload
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["scripts", variables?.projectId] });
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
      // Convert to snake_case
      const payload = {
        name: data.name,
        text: data.text,
        metadata: (data as any).metadata,
      };
      const response = await api.patch<Script>(`/scripts/${id}`, payload);
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
