import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import type { Script, UpdateScriptRequest } from "../api/scripts/types";

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
