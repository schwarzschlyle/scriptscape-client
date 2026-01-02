export interface StoryboardSketch {
  id: string;
  storyboardId: string;
  name: string;
  image_base64: string;
  meta?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoryboardSketchRequest {
  name: string;
  image_base64: string;
  meta?: Record<string, any>;
}

export interface UpdateStoryboardSketchRequest {
  name?: string;
  image_base64?: string;
  meta?: Record<string, any>;
}

export interface StoryboardSketchResponse extends StoryboardSketch {}

export interface StoryboardSketchesListResponse {
  data: StoryboardSketch[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
