import { QueryCache, QueryClient } from '@tanstack/react-query';
import {
  QUERY_DEFAULT_STALE_TIME_MS,
  QUERY_MAX_RETRY_ATTEMPTS,
  getQueryRetryDelayMs,
  shouldAutoRetryQueryError,
} from '@/app/queryErrorPolicy';
import { ApiError } from '@/lib/errors';
import { reportError } from '@/lib/telemetry';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      reportError('query.error', error, {
        queryKey: JSON.stringify(query.queryKey),
        retryable: shouldAutoRetryQueryError(error),
        status: error instanceof ApiError ? error.status : undefined,
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: QUERY_DEFAULT_STALE_TIME_MS,
      retry: (failureCount, error) =>
        failureCount < QUERY_MAX_RETRY_ATTEMPTS && shouldAutoRetryQueryError(error),
      retryDelay: getQueryRetryDelayMs,
      throwOnError: true,
    },
  },
});
