// scriptscape-client/src/api/search/queries.ts

import { useQuery } from "@tanstack/react-query";
import api from "../client";
import type { SearchResponse, SearchResultType } from "./types";

export function useSearch(params: { q: string; types?: SearchResultType[]; page?: number; limit?: number }) {
  return useQuery<SearchResponse>({
    queryKey: ["search", params],
    queryFn: async () => {
      const response = await api.get<SearchResponse>("/search", { params });
      return response.data;
    },
    enabled: !!params.q && params.q.length > 1,
  });
}
