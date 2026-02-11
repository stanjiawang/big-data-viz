import { generateChunk, generateGraph, generateTimeSeries } from '@/lib/mockData';

export const FIXTURE_NOW_MS = Date.UTC(2025, 0, 1, 12, 0, 0);

export const mockDataFixtures = {
  chunk: generateChunk(
    {
      total: 100,
      offset: 0,
      limit: 10,
      vectorSize: 8,
    },
    { nowMs: FIXTURE_NOW_MS },
  ),
  chunkWithSearchFilter: generateChunk(
    {
      total: 100,
      offset: 0,
      limit: 20,
      vectorSize: 8,
      filters: { search: 'batch' },
    },
    { nowMs: FIXTURE_NOW_MS },
  ),
  timeSeries: generateTimeSeries('ingestion', { nowMs: FIXTURE_NOW_MS }),
  graph: generateGraph(),
} as const;
