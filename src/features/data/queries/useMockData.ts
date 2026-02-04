import {
  useQuery,
  useSuspenseQuery,
  type UseQueryResult,
  type UseSuspenseQueryResult,
} from '@tanstack/react-query';
import { getMockData } from '@/lib/apiClient';
import type { DataChunk, MockFilters } from '@/lib/types';
import { queryKeys } from '@/features/data/queries/queryKeys';

export type UseMockDataParams = {
  total: number;
  offset: number;
  limit: number;
  vectorSize: number;
  filters: MockFilters;
  enabled?: boolean;
};

export function useMockData(params: UseMockDataParams): UseQueryResult<DataChunk, Error> {
  return useQuery<DataChunk>({
    queryKey: queryKeys.mockData({
      offset: params.offset,
      limit: params.limit,
      total: params.total,
      filters: params.filters,
    }),
    queryFn: () =>
      getMockData({
        total: params.total,
        offset: params.offset,
        limit: params.limit,
        vectorSize: params.vectorSize,
        filters: params.filters,
      }),
    enabled: params.enabled ?? true,
  });
}

export function useMockDataSuspense(
  params: Omit<UseMockDataParams, 'enabled'>,
): UseSuspenseQueryResult<DataChunk, Error> {
  return useSuspenseQuery<DataChunk>({
    queryKey: queryKeys.mockData({
      offset: params.offset,
      limit: params.limit,
      total: params.total,
      filters: params.filters,
    }),
    queryFn: () =>
      getMockData({
        total: params.total,
        offset: params.offset,
        limit: params.limit,
        vectorSize: params.vectorSize,
        filters: params.filters,
      }),
  });
}
