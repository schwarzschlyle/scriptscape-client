import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../client";
import type {
  Organization,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
} from "./types";

import { v4 as uuidv4 } from "uuid";

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOrganizationRequest) => {
      const payload = { id: uuidv4(), ...data };
      const response = await api.post<Organization>("/organizations", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateOrganizationRequest;
    }) => {
      const response = await api.patch<Organization>(`/organizations/${id}`, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization", variables.id] });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/organizations/${id}`);
      return id;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.removeQueries({ queryKey: ["organization", id] });
    },
  });
}
