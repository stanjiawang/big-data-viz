import { generateChunk, generateGraph, generateTimeSeries } from '@/lib/mockData';

describe('mockData generators', () => {
  it('generates chunk with correct limit', () => {
    const chunk = generateChunk({ total: 100, offset: 0, limit: 10, vectorSize: 8 });
    expect(chunk.records).toHaveLength(10);
    expect(chunk.limit).toBe(10);
  });

  it('respects search filter', () => {
    const chunk = generateChunk({
      total: 100,
      offset: 0,
      limit: 20,
      vectorSize: 8,
      filters: { search: 'batch' },
    });
    expect(chunk.records.every((record) => record.id.includes('batch'))).toBe(true);
  });

  it('generates time series with 30 points', () => {
    const series = generateTimeSeries();
    expect(series.points).toHaveLength(30);
  });

  it('generates graph with nodes and edges', () => {
    const graph = generateGraph();
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
  });
});
