import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import type { User } from "./types";

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<User>;
    }) => {
      const response = await api.patch<User>(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
      return id;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.removeQueries({ queryKey: ["user", id] });
    },
  });
}
