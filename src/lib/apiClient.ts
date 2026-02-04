import type { DataChunk, GraphResponse, MockFilters, TimeSeriesResponse } from '@/lib/types';

type ChunkParams = {
  total?: number;
  offset?: number;
  limit?: number;
  vectorSize?: number;
  filters?: MockFilters;
};

type TimeSeriesParams = {
  metric?: string;
};

async function fetchJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export function getMockData(params: ChunkParams = {}) {
  const search = new URLSearchParams({
    total: String(params.total ?? 1_000_000),
    offset: String(params.offset ?? 0),
    limit: String(params.limit ?? 1000),
    vectorSize: String(params.vectorSize ?? 64),
  });

  if (params.filters?.label) {
    search.set('label', params.filters.label);
  }

  if (params.filters?.labels && params.filters.labels.length > 0) {
    search.set('labels', params.filters.labels.join(','));
  }

  if (params.filters?.source) {
    search.set('source', params.filters.source);
  }

  if (params.filters?.search) {
    search.set('search', params.filters.search);
  }

  if (params.filters?.weightMin !== undefined) {
    search.set('weightMin', String(params.filters.weightMin));
  }

  if (params.filters?.weightMax !== undefined) {
    search.set('weightMax', String(params.filters.weightMax));
  }

  return fetchJson<DataChunk>(`/api/mock-data?${search.toString()}`);
}

export function getTimeSeries(params: TimeSeriesParams = {}) {
  const search = new URLSearchParams({
    metric: params.metric ?? 'ingestion',
  });
  return fetchJson<TimeSeriesResponse>(`/api/timeseries?${search.toString()}`);
}

export function getGraph() {
  return fetchJson<GraphResponse>('/api/graph');
}
