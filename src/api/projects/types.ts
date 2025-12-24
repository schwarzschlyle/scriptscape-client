export interface Project {
  id: string;
  name: string;
  description?: string | null;
  organizationId: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ProjectResponse extends Project {}

export interface ProjectsListResponse {
  data: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
