// =====================  QUERY CLIENT CONFIGURATION  ==========
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Do not retry 401 or 403 errors
        if (error?.statusCode === 401 || error?.statusCode === 403) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

export default queryClient;
