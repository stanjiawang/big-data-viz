import { http, HttpResponse } from 'msw';
import { generateChunk, generateGraph, generateTimeSeries } from '@/lib/mockData';
import type { MockFilters, TrainingRecord } from '@/lib/types';

export function parseNumber(value: string | null, fallback?: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseFilters(searchParams: URLSearchParams): MockFilters {
  const label = searchParams.get('label') ?? undefined;
  const labels = searchParams.get('labels')
    ? searchParams
        .get('labels')
        ?.split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    : undefined;
  const source =
    (searchParams.get('source') as TrainingRecord['source'] | 'all' | null) ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const weightMin = parseNumber(searchParams.get('weightMin'));
  const weightMax = parseNumber(searchParams.get('weightMax'));

  return {
    label,
    labels,
    source,
    search,
    weightMin,
    weightMax,
  };
}

export const handlers = [
  http.get('/api/mock-data', ({ request }) => {
    const { searchParams } = new URL(request.url);
    const total = parseNumber(searchParams.get('total'), 1_000_000) ?? 1_000_000;
    const offset = parseNumber(searchParams.get('offset'), 0) ?? 0;
    const limit = parseNumber(searchParams.get('limit'), 1000) ?? 1000;
    const vectorSize = parseNumber(searchParams.get('vectorSize'), 64) ?? 64;
    const filters = parseFilters(searchParams);

    const payload = generateChunk({
      total: Math.max(total, 0),
      offset: Math.max(offset, 0),
      limit: Math.min(Math.max(limit, 1), 10_000),
      vectorSize: Math.min(Math.max(vectorSize, 2), 2048),
      filters,
    });

    return HttpResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }),
  http.get('/api/timeseries', ({ request }) => {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') ?? 'ingestion';
    return HttpResponse.json(generateTimeSeries(metric), {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }),
  http.get('/api/graph', () =>
    HttpResponse.json(generateGraph(), {
      headers: {
        'Cache-Control': 'no-store',
      },
    }),
  ),
];
