import type { MockFilters } from '@/lib/types';

type MockDataKeyParams = {
  offset: number;
  limit: number;
  total: number;
  vectorSize: number;
  filters: MockFilters;
};

export const queryKeys = {
  mockData: ({ offset, limit, total, vectorSize, filters }: MockDataKeyParams) =>
    ['mock-data', 'chunk', { offset, limit, total, vectorSize, filters }] as const,
  timeSeries: (metric: string) => ['timeseries', metric] as const,
  graph: () => ['graph'] as const,
};
