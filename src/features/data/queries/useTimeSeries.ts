import {
  useQuery,
  useSuspenseQuery,
  type UseQueryResult,
  type UseSuspenseQueryResult,
} from '@tanstack/react-query';
import { getTimeSeries } from '@/lib/apiClient';
import type { TimeSeriesResponse } from '@/lib/types';
import { queryKeys } from '@/features/data/queries/queryKeys';

export function useTimeSeries(metric: string): UseQueryResult<TimeSeriesResponse, Error> {
  return useQuery<TimeSeriesResponse>({
    queryKey: queryKeys.timeSeries(metric),
    queryFn: () => getTimeSeries({ metric }),
  });
}

export function useTimeSeriesSuspense(
  metric: string,
): UseSuspenseQueryResult<TimeSeriesResponse, Error> {
  return useSuspenseQuery<TimeSeriesResponse>({
    queryKey: queryKeys.timeSeries(metric),
    queryFn: () => getTimeSeries({ metric }),
  });
}
