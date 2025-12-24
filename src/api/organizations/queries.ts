import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { Organization, OrganizationsListResponse } from "./types";

export function useOrganizations(params?: { page?: number; limit?: number }) {
  return useQuery<OrganizationsListResponse>({
    queryKey: ["organizations", params],
    queryFn: async () => {
      const response = await api.get<OrganizationsListResponse>("/organizations", { params });
      return response.data;
    },
  });
}

export function useOrganization(id: string) {
  return useQuery<Organization>({
    queryKey: ["organization", id],
    queryFn: async () => {
      const response = await api.get<Organization>(`/organizations/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}
