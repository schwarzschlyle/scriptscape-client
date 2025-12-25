import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import type {
  Script,
  CreateScriptRequest,
  UpdateScriptRequest,
} from "./types";

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
      // Invalidate the correct query key to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["scripts", variables.organizationId, variables.projectId] });
    },
  });
}

export function useUpdateScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      organizationId,
      projectId,
      data,
    }: {
      id: string;
      organizationId: string;
      projectId: string;
      data: UpdateScriptRequest;
    }) => {
      const payload = {
        name: data.name,
        text: data.text,
        metadata: (data as any).metadata,
      };
      const response = await api.patch<Script>(
        `/organizations/${organizationId}/projects/${projectId}/scripts/${id}`,
        payload
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["scripts", variables.organizationId, variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["script", variables.organizationId, variables.projectId, variables.id] });
    },
  });
}


export function useDeleteScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      organizationId,
      projectId,
    }: {
      id: string;
      organizationId: string;
      projectId: string;
    }) => {
      await api.delete(`/organizations/${organizationId}/projects/${projectId}/scripts/${id}`);
      return id;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["scripts", variables.organizationId, variables.projectId] });
      queryClient.removeQueries({ queryKey: ["script", variables.organizationId, variables.projectId, variables.id] });
    },
  });
}
