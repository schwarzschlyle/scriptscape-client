import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import type { Script } from "../api/scripts/types";

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
