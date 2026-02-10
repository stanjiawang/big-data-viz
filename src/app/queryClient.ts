import { QueryCache, QueryClient } from '@tanstack/react-query';
import { reportError } from '@/lib/telemetry';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      reportError('query.error', error, {
        queryKey: JSON.stringify(query.queryKey),
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});
