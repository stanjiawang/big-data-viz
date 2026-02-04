import {
  useQuery,
  useSuspenseQuery,
  type UseQueryResult,
  type UseSuspenseQueryResult,
} from '@tanstack/react-query';
import { getGraph } from '@/lib/apiClient';
import type { GraphResponse } from '@/lib/types';
import { queryKeys } from '@/features/data/queries/queryKeys';

export function useGraph(): UseQueryResult<GraphResponse, Error> {
  return useQuery<GraphResponse>({
    queryKey: queryKeys.graph(),
    queryFn: () => getGraph(),
  });
}

export function useGraphSuspense(): UseSuspenseQueryResult<GraphResponse, Error> {
  return useSuspenseQuery<GraphResponse>({
    queryKey: queryKeys.graph(),
    queryFn: () => getGraph(),
  });
}
