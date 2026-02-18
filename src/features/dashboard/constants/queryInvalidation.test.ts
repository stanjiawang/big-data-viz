import { DASHBOARD_QUERY_KEY_PREFIXES, invalidateDashboardQueries } from './queryInvalidation';

describe('queryInvalidation', () => {
  it('defines dashboard query key prefixes', () => {
    expect(DASHBOARD_QUERY_KEY_PREFIXES).toEqual([['mock-data'], ['timeseries'], ['graph']]);
  });

  it('invalidates each dashboard query prefix', async () => {
    const invalidateQueries = jest.fn().mockResolvedValue(undefined);
    const queryClient = {
      invalidateQueries,
    } as unknown as Parameters<typeof invalidateDashboardQueries>[0];

    await invalidateDashboardQueries(queryClient);

    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    expect(invalidateQueries).toHaveBeenNthCalledWith(1, { queryKey: ['mock-data'] });
    expect(invalidateQueries).toHaveBeenNthCalledWith(2, { queryKey: ['timeseries'] });
    expect(invalidateQueries).toHaveBeenNthCalledWith(3, { queryKey: ['graph'] });
  });
});
