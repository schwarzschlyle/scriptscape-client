export interface Segment {
  id: string;
  segmentCollectionId: string;
  segmentIndex: number;
  text: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSegmentRequest {
  segmentIndex: number;
  text: string;
  metadata?: any;
  segmentCollectionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateSegmentRequest {
  segmentIndex?: number;
  text?: string;
  metadata?: Record<string, any>;
}

export interface SegmentResponse extends Segment {}

export interface SegmentsListResponse {
  data: Segment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
