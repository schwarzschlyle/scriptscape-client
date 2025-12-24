// scriptscape-client/src/api/visuals/types.ts

export interface Visual {
  id: string;
  visualSetId: string;
  segmentId: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisualRequest {
  segmentId: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface UpdateVisualRequest {
  content?: string;
  metadata?: Record<string, any>;
}

export interface VisualResponse extends Visual {}

export interface VisualsListResponse {
  data: Visual[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
