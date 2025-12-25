// scriptscape-client/src/api/scripts/queries.ts

import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { Script } from "./types";

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
