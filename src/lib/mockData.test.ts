import { generateChunk, generateGraph, generateTimeSeries } from '@/lib/mockData';
import { API_SCHEMA_VERSION } from '@/lib/contracts';
import { FIXTURE_NOW_MS, mockDataFixtures } from '@/lib/fixtures/mockDataFixtures';

describe('mockData generators', () => {
  it('generates chunk with correct limit', () => {
    const chunk = generateChunk(
      { total: 100, offset: 0, limit: 10, vectorSize: 8 },
      { nowMs: FIXTURE_NOW_MS },
    );

    expect(chunk.records).toHaveLength(10);
    expect(chunk.limit).toBe(10);
    expect(chunk.schemaVersion).toBe(API_SCHEMA_VERSION);
    expect(chunk.records[0]).toEqual(mockDataFixtures.chunk.records[0]);
  });

  it('respects search filter', () => {
    const chunk = generateChunk(
      {
        total: 100,
        offset: 0,
        limit: 20,
        vectorSize: 8,
        filters: { search: 'batch' },
      },
      { nowMs: FIXTURE_NOW_MS },
    );

    expect(chunk.records.every((record) => record.id.includes('batch'))).toBe(true);
    expect(chunk.records[0]).toEqual(mockDataFixtures.chunkWithSearchFilter.records[0]);
  });

  it('keeps total stable when filters are active', () => {
    const chunk = generateChunk(
      {
        total: 1_000,
        offset: 0,
        limit: 20,
        vectorSize: 8,
        filters: { labels: ['class-A'], source: 'user', search: 'batch' },
      },
      { nowMs: FIXTURE_NOW_MS },
    );

    expect(chunk.total).toBe(1_000);
  });

  it('generates deterministic time series fixtures', () => {
    const series = generateTimeSeries('ingestion', { nowMs: FIXTURE_NOW_MS });

    expect(series.points).toHaveLength(30);
    expect(series.schemaVersion).toBe(API_SCHEMA_VERSION);
    expect(series.points[0]).toEqual(mockDataFixtures.timeSeries.points[0]);
    expect(series.points.at(-1)).toEqual(mockDataFixtures.timeSeries.points.at(-1));
  });

  it('generates graph with nodes and edges', () => {
    const graph = generateGraph();

    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.schemaVersion).toBe(API_SCHEMA_VERSION);
    expect(graph.nodes[0]).toEqual(mockDataFixtures.graph.nodes[0]);
  });
});
