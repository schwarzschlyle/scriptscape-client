import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { User, UsersListResponse } from "./types";
import { useAuth } from "@auth/AuthContext";

export function useUsers(params?: { page?: number; limit?: number }) {
  return useQuery<UsersListResponse>({
    queryKey: ["users", params],
    queryFn: async () => {
      const response = await api.get<UsersListResponse>("/users", { params });
      return response.data;
    },
  });
}

export function useUser(id: string) {
  return useQuery<User>({
    queryKey: ["user", id],
    queryFn: async () => {
      const response = await api.get<User>(`/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCurrentUser() {
  const { user, status } = useAuth();
  return useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await api.get<User>("/users/me");
      return response.data;
    },
    // Prevent extra requests; AuthProvider already keeps `user` fresh.
    initialData: user ?? undefined,
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
