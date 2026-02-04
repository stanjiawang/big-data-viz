import { getGraph, getMockData, getTimeSeries } from '@/lib/apiClient';

describe('apiClient', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    // @ts-expect-error - mock fetch in test env
    global.fetch = fetchMock;
  });

  it('builds mock data query params', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 0, offset: 0, limit: 0, records: [] }),
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
      json: async () => ({ metric: 'ingestion', points: [] }),
    });

    await getTimeSeries({ metric: 'latency' });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/api/timeseries?metric=latency');
  });

  it('fetches graph data', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ nodes: [], edges: [] }),
    });

    await getGraph();
    expect(fetchMock.mock.calls[0][0]).toBe('/api/graph');
  });
});
