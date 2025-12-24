export interface SegmentCollection {
  id: string;
  name: string;
  scriptId: string;
  segmentCount: number;
  metadata?: Record<string, any>;
  segments?: Segment[];
  createdAt: string;
  updatedAt: string;
}

export interface Segment {
  id: string;
  segmentCollectionId: string;
  segmentIndex: number;
  text: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSegmentCollectionRequest {
  name: string;
  metadata?: Record<string, any>;
}

export interface UpdateSegmentCollectionRequest {
  name?: string;
  metadata?: Record<string, any>;
}

export interface SegmentCollectionResponse extends SegmentCollection {}

export interface SegmentCollectionsListResponse {
  data: SegmentCollection[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
