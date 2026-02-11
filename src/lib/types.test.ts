import type {
  DataChunk,
  GraphResponse,
  MockDataRequest,
  MockFilters,
  TimeSeriesResponse,
  TrainingRecord,
} from '@/lib/types';
import { API_SCHEMA_VERSION } from '@/lib/contracts';

describe('types', () => {
  it('compiles type usage', () => {
    const record: TrainingRecord = {
      id: 'rec_1',
      timestamp: '2024-01-01T00:00:00Z',
      source: 'user',
      label: 'class-A',
      features: [0.1],
      weight: 1,
    };

    const chunk: DataChunk = {
      schemaVersion: API_SCHEMA_VERSION,
      total: 1,
      offset: 0,
      limit: 1,
      records: [record],
    };

    const filters: MockFilters = { source: 'all' };

    const request: MockDataRequest = {
      total: 1,
      offset: 0,
      limit: 1,
      vectorSize: 2,
      filters,
    };

    const series: TimeSeriesResponse = {
      schemaVersion: API_SCHEMA_VERSION,
      metric: 'ingestion',
      points: [{ timestamp: '2024-01-01', value: 10 }],
    };

    const graph: GraphResponse = {
      schemaVersion: API_SCHEMA_VERSION,
      nodes: [{ id: 'node-1', group: 'cluster-1', weight: 1 }],
      edges: [{ source: 'node-1', target: 'node-1', weight: 1 }],
    };

    expect(chunk.records[0].id).toBe(record.id);
    expect(request.filters).toBe(filters);
    expect(series.metric).toBe('ingestion');
    expect(graph.nodes[0].id).toBe('node-1');
  });
});
