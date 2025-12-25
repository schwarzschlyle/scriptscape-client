import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const useLayoutQuery = (organizationId: string, projectId: string) => {
  return useQuery({
    queryKey: ["layout", organizationId, projectId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/organizations/${organizationId}/projects/${projectId}/layout`
      );
      return response.data as LayoutItem[];
    },
  });
};

export const useSaveLayoutMutation = (organizationId: string, projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (layout: LayoutItem[]) => {
      await apiClient.put(
        `/organizations/${organizationId}/projects/${projectId}/layout`,
        { layout }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["layout", organizationId, projectId],
      });
    },
  });
};
