import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
} from "./types";

export function useCreateProject(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProjectRequest) => {

      const payload = {
        name: data.name,
        description: (data as any).description,
        metadata: (data as any).metadata,
      };
      const response = await api.post<Project>(
        `/organizations/${organizationId}/projects`,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", organizationId] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProjectRequest;
    }) => {

      const payload = {
        name: data.name,
        description: (data as any).description,
        metadata: (data as any).metadata,
      };
      const response = await api.patch<Project>(`/projects/${id}`, payload);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`);
      return id;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.removeQueries({ queryKey: ["project", id] });
    },
  });
}
