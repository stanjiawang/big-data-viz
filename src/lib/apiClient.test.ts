import { getGraph, getMockData, getTimeSeries } from '@/lib/apiClient';
import { API_SCHEMA_VERSION } from '@/lib/contracts';
import { ApiError } from '@/lib/errors';

describe('apiClient', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    Object.defineProperty(globalThis, 'fetch', {
      value: fetchMock,
      writable: true,
    });
    window.history.replaceState({}, '', '/');
  });

  it('builds mock data query params', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        schemaVersion: API_SCHEMA_VERSION,
        total: 0,
        offset: 0,
        limit: 0,
        records: [],
      }),
    });

    await getMockData({
      total: 10,
      offset: 1,
      limit: 2,
      vectorSize: 4,
      filters: { source: 'user', labels: ['class-A'], weightMin: 0.1 },
    });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/api/mock-data?');
    expect(url).toContain('total=10');
    expect(url).toContain('offset=1');
    expect(url).toContain('limit=2');
    expect(url).toContain('vectorSize=4');
    expect(url).toContain('source=user');
    expect(url).toContain('labels=class-A');
    expect(url).toContain('weightMin=0.1');
  });

  it('fetches time series with metric', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ schemaVersion: API_SCHEMA_VERSION, metric: 'ingestion', points: [] }),
    });

    await getTimeSeries({ metric: 'latency' });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/api/timeseries?metric=latency');
  });

  it('fetches graph data', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ schemaVersion: API_SCHEMA_VERSION, nodes: [], edges: [] }),
    });

    await getGraph();
    expect(fetchMock.mock.calls[0][0]).toBe('/api/graph');
  });

  it('throws parse error when response schema is invalid', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 'wrong-type', records: [] }),
    });

    try {
      await getMockData();
      throw new Error('Expected getMockData to fail for invalid schema');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe('PARSE_ERROR');
    }
  });

  it('forwards mock control params from location search', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        schemaVersion: API_SCHEMA_VERSION,
        total: 0,
        offset: 0,
        limit: 0,
        records: [],
      }),
    });

    window.history.replaceState(
      {},
      '',
      '/?mockFailure=server-error&mockDelayMs=100&mockTenantId=tenant-x',
    );

    await getMockData({
      total: 10,
      offset: 0,
      limit: 1,
      vectorSize: 8,
      filters: { source: 'all' },
    });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('mockFailure=server-error');
    expect(url).toContain('mockDelayMs=100');
    expect(url).toContain('mockTenantId=tenant-x');
  });

  it('throws parse error when schema version mismatches', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        schemaVersion: '1999-01-01',
        total: 0,
        offset: 0,
        limit: 0,
        records: [],
      }),
    });

    try {
      await getMockData();
      throw new Error('Expected getMockData to fail for schema version mismatch');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe('PARSE_ERROR');
    }
  });
});
