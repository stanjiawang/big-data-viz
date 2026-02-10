const reportErrorMock = jest.fn();

jest.mock('@/lib/telemetry', () => ({
  reportError: (...args: unknown[]) => reportErrorMock(...args),
}));

import { queryClient } from '@/app/queryClient';

describe('queryClient', () => {
  beforeEach(() => {
    reportErrorMock.mockReset();
    queryClient.clear();
  });

  it('sets default query options', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(30000);
    expect(defaults.queries?.retry).toBe(1);
  });

  it('reports query errors through telemetry', async () => {
    await expect(
      queryClient.fetchQuery({
        queryKey: ['query-failure-demo'],
        queryFn: async () => {
          throw new Error('query failed');
        },
      }),
    ).rejects.toThrow('query failed');

    expect(reportErrorMock).toHaveBeenCalledWith(
      'query.error',
      expect.any(Error),
      expect.objectContaining({
        queryKey: '["query-failure-demo"]',
      }),
    );
  });
});
