const reportErrorMock = jest.fn();

jest.mock('@/lib/telemetry', () => ({
  reportError: (...args: unknown[]) => reportErrorMock(...args),
}));

import { queryClient } from '@/app/queryClient';
import { ApiError } from '@/lib/errors';

describe('queryClient', () => {
  beforeEach(() => {
    reportErrorMock.mockReset();
    queryClient.clear();
  });

  it('sets default query options', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(30000);
    expect(defaults.queries?.throwOnError).toBe(true);
    expect(defaults.queries?.retry).toBeDefined();
    expect(defaults.queries?.retryDelay).toBeDefined();
  });

  it('retries retryable query errors once', async () => {
    const queryFn = jest.fn().mockRejectedValue(
      new ApiError({
        message: 'service down',
        code: 'HTTP_ERROR',
        status: 503,
        url: '/api/retryable',
      }),
    );

    await expect(
      queryClient.fetchQuery({
        queryKey: ['retryable-query'],
        queryFn,
        retryDelay: 0,
      }),
    ).rejects.toThrow('service down');

    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-retryable query errors', async () => {
    const queryFn = jest.fn().mockRejectedValue(
      new ApiError({
        message: 'forbidden',
        code: 'HTTP_ERROR',
        status: 403,
        url: '/api/forbidden',
      }),
    );

    await expect(
      queryClient.fetchQuery({
        queryKey: ['non-retryable-query'],
        queryFn,
        retryDelay: 0,
      }),
    ).rejects.toThrow('forbidden');

    expect(queryFn).toHaveBeenCalledTimes(1);
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
        retryable: true,
      }),
    );
  });
});
