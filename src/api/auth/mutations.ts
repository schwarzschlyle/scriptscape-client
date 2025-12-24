// scriptscape-client/src/api/auth/mutations.ts

import { useMutation } from "@tanstack/react-query";
import api from "../client";
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
} from "./types";

// Register
export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterRequest & { organization_name?: string }) => {
      // Convert all fields to snake_case for backend compatibility
      const payload = {
        email: data.email,
        password: data.password,
        first_name: (data as any).first_name || data.firstName,
        last_name: (data as any).last_name || data.lastName,
        organization_name:
          (data as any).organization_name ||
          (data as any).organizationName ||
          (data as any).organizationId ||
          "",
      };
      const response = await api.post<RegisterResponse>("/auth/register", payload);
      return response.data;
    },
  });
}

// Login
export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await api.post<LoginResponse>("/auth/login", data);
      return response.data;
    },
  });
}

// Refresh token
export function useRefreshToken() {
  return useMutation({
    mutationFn: async (data: RefreshRequest) => {
      const response = await api.post<RefreshResponse>("/auth/refresh", data);
      return response.data;
    },
  });
}

// Logout
export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
  });
}
