// scriptscape-client/src/api/users/queries.ts

import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { User, UsersListResponse } from "./types";

// Fetch all users
export function useUsers(params?: { page?: number; limit?: number }) {
  return useQuery<UsersListResponse>({
    queryKey: ["users", params],
    queryFn: async () => {
      const response = await api.get<UsersListResponse>("/users", { params });
      return response.data;
    },
  });
}

// Fetch a single user by ID
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

// Fetch the current user
export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await api.get<User>("/users/me");
      return response.data;
    },
  });
}
