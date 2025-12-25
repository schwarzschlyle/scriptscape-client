import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import type { Script, CreateScriptRequest } from "../api/scripts/types";

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
      queryClient.invalidateQueries({ queryKey: ["scripts", variables.organizationId, variables.projectId] });
    },
  });
}
