import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

// Unique key for persisted cache
const REACT_QUERY_CACHE_KEY = "reactQueryCache";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
    mutations: {
      retry: 0,
    },
  },
});

// Set up localStorage persister
export const queryCachePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: REACT_QUERY_CACHE_KEY,
});

// Enable persistence
persistQueryClient({
  queryClient,
  persister: queryCachePersister,
  maxAge: 1000 * 60 * 5, // 5 minutes
  buster: "v1", // Change this if cache schema changes
});

export default queryClient;
