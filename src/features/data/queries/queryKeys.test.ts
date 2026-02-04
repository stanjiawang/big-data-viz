import { queryKeys } from '@/features/data/queries/queryKeys';

describe('queryKeys', () => {
  it('creates mock data key', () => {
    const key = queryKeys.mockData({
      offset: 0,
      limit: 10,
      total: 100,
      filters: { source: 'all' },
    });

    expect(key[0]).toBe('mock-data');
    expect(key[1]).toBe('chunk');
  });

  it('creates time series key', () => {
    expect(queryKeys.timeSeries('ingestion')).toEqual(['timeseries', 'ingestion']);
  });

  it('creates graph key', () => {
    expect(queryKeys.graph()).toEqual(['graph']);
  });
});
