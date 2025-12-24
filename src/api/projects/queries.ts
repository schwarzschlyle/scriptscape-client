// scriptscape-client/src/api/projects/queries.ts

import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { Project, ProjectsListResponse } from "./types";

// Fetch all projects for an organization
export function useProjects(organizationId: string, params?: { page?: number; limit?: number }) {
  return useQuery<ProjectsListResponse>({
    queryKey: ["projects", organizationId, params],
    queryFn: async () => {
      const response = await api.get<ProjectsListResponse>(
        `/organizations/${organizationId}/projects`,
        { params }
      );
      return response.data;
    },
    enabled: !!organizationId,
  });
}

// Fetch a single project by ID (legacy, not used for nested route)
export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: ["project", id],
    queryFn: async () => {
      const response = await api.get<Project>(`/projects/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Fetch a single project by orgId and projectId (correct for backend)
export function useProjectByOrg(orgId: string, projectId: string) {
  return useQuery<Project>({
    queryKey: ["project", orgId, projectId],
    queryFn: async () => {
      const response = await api.get<Project>(`/organizations/${orgId}/projects/${projectId}`);
      return response.data;
    },
    enabled: !!orgId && !!projectId,
  });
}
