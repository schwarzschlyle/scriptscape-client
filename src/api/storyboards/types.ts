export interface Storyboard {
  id: string;
  visualSetId: string;
  name: string;
  description?: string;
  meta?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoryboardRequest {
  name: string;
  description?: string;
  meta?: Record<string, any>;
}

export interface UpdateStoryboardRequest {
  name?: string;
  description?: string;
  meta?: Record<string, any>;
}

export interface StoryboardResponse extends Storyboard {}

export interface StoryboardsListResponse {
  data: Storyboard[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
