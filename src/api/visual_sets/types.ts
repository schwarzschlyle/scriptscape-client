// scriptscape-client/src/api/visual_sets/types.ts

export interface VisualSet {
  id: string;
  name: string;
  description?: string | null;
  segmentCollectionId: string;
  metadata?: Record<string, any>;
  visuals?: Visual[];
  createdAt: string;
  updatedAt: string;
}

export interface Visual {
  id: string;
  visualSetId: string;
  segmentId: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisualSetRequest {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdateVisualSetRequest {
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface VisualSetResponse extends VisualSet {}

export interface VisualSetsListResponse {
  data: VisualSet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
