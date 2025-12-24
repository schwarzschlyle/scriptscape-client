export interface Organization {
  id: string;
  name: string;
  description?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface OrganizationResponse extends Organization {}

export interface OrganizationsListResponse {
  data: Organization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
