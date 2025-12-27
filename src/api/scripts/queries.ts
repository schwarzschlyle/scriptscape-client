// scriptscape-client/src/api/scripts/queries.ts

import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { Script } from "./types";

// Direct API functions for optimistic updates

export async function getScripts(orgId: string, projectId: string): Promise<Script[]> {
  const response = await api.get<Script[]>(
    `/organizations/${orgId}/projects/${projectId}/scripts`
  );
  return response.data;
}

export async function createScript(
  orgId: string,
  projectId: string,
  data: { name: string; text: string }
): Promise<Script> {
  const response = await api.post<Script>(
    `/organizations/${orgId}/projects/${projectId}/scripts`,
    data
  );
  return response.data;
}

export async function updateScript(
  orgId: string,
  projectId: string,
  scriptId: string,
  data: { name: string; text: string }
): Promise<Script> {
  const response = await api.patch<Script>(
    `/organizations/${orgId}/projects/${projectId}/scripts/${scriptId}`,
    data
  );
  return response.data;
}

export async function deleteScript(
  orgId: string,
  projectId: string,
  scriptId: string
): Promise<void> {
  await api.delete(
    `/organizations/${orgId}/projects/${projectId}/scripts/${scriptId}`
  );
}

/**
 * Fetch all scripts for a project (requires orgId and projectId)
 * Returns: Script[]
 */
export function useScripts(orgId: string, projectId: string, params?: { page?: number; limit?: number }) {
  return useQuery<Script[]>({
    queryKey: ["scripts", orgId, projectId, params],
    queryFn: async () => {
      const response = await api.get<Script[]>(
        `/organizations/${orgId}/projects/${projectId}/scripts`,
        { params }
      );
      return response.data;
    },
    enabled: !!orgId && !!projectId,
  });
}

// Fetch a single script by org, project, and script ID
export function useScript(orgId: string, projectId: string, scriptId: string) {
  return useQuery<Script>({
    queryKey: ["script", orgId, projectId, scriptId],
    queryFn: async () => {
      const response = await api.get<Script>(
        `/organizations/${orgId}/projects/${projectId}/scripts/${scriptId}`
      );
      return response.data;
    },
    enabled: !!orgId && !!projectId && !!scriptId,
  });
}
