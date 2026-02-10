import type { ZodType } from 'zod';
import { ApiError } from '@/lib/errors';
import { fetchJson } from '@/lib/httpClient';
import { dataChunkSchema, graphResponseSchema, timeSeriesResponseSchema } from '@/lib/schemas';
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

const MOCK_CONTROL_KEYS = ['mockFailure', 'mockDelayMs', 'mockRequireAuth', 'mockRequireTenant'];

function applyMockControls(search: URLSearchParams) {
  if (typeof window === 'undefined') {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  MOCK_CONTROL_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value !== null && !search.has(key)) {
      search.set(key, value);
    }
  });
}

function validateResponse<T>(payload: unknown, schema: ZodType<T>, url: string): T {
  const result = schema.safeParse(payload);

  if (!result.success) {
    throw new ApiError({
      message: 'API response does not match expected schema',
      code: 'PARSE_ERROR',
      url,
      cause: result.error,
    });
  }

  return result.data;
}

export async function getMockData(params: ChunkParams = {}): Promise<DataChunk> {
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

  applyMockControls(search);

  const url = `/api/mock-data?${search.toString()}`;
  const payload = await fetchJson<unknown>(url);
  return validateResponse(payload, dataChunkSchema, url);
}

export async function getTimeSeries(params: TimeSeriesParams = {}): Promise<TimeSeriesResponse> {
  const search = new URLSearchParams({
    metric: params.metric ?? 'ingestion',
  });

  applyMockControls(search);

  const url = `/api/timeseries?${search.toString()}`;
  const payload = await fetchJson<unknown>(url);
  return validateResponse(payload, timeSeriesResponseSchema, url);
}

export async function getGraph(): Promise<GraphResponse> {
  const search = new URLSearchParams();
  applyMockControls(search);
  const url = search.toString() ? `/api/graph?${search.toString()}` : '/api/graph';
  const payload = await fetchJson<unknown>(url);
  return validateResponse(payload, graphResponseSchema, url);
}
