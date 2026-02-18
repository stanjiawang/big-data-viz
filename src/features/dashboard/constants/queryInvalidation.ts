import type { QueryClient } from '@tanstack/react-query';

export const DASHBOARD_QUERY_KEY_PREFIXES = [['mock-data'], ['timeseries'], ['graph']] as const;

export async function invalidateDashboardQueries(queryClient: QueryClient) {
  await Promise.all(
    DASHBOARD_QUERY_KEY_PREFIXES.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}
