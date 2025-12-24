// scriptscape-client/src/api/scripts/queries.ts

import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { Script, ScriptsListResponse } from "./types";

// Fetch all scripts for a project
export function useScripts(projectId: string, params?: { page?: number; limit?: number }) {
  return useQuery<ScriptsListResponse>({
    queryKey: ["scripts", projectId, params],
    queryFn: async () => {
      const response = await api.get<ScriptsListResponse>(
        `/projects/${projectId}/scripts`,
        { params }
      );
      return response.data;
    },
    enabled: !!projectId,
  });
}

// Fetch a single script by ID
export function useScript(id: string) {
  return useQuery<Script>({
    queryKey: ["script", id],
    queryFn: async () => {
      const response = await api.get<Script>(`/scripts/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}
