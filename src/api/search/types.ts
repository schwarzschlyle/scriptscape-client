// scriptscape-client/src/api/search/types.ts

export type SearchResultType = "project" | "script" | "segment" | "visual";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  excerpt: string;
  score: number;
}

export interface SearchResponse {
  data: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
