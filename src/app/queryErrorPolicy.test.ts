import {
  getQueryRetryDelayMs,
  resolveQueryErrorCopy,
  shouldAutoRetryQueryError,
} from '@/app/queryErrorPolicy';
import { ApiError } from '@/lib/errors';

describe('queryErrorPolicy', () => {
  it('marks retryable API errors correctly', () => {
    const retryable = new ApiError({
      message: 'rate limit',
      code: 'HTTP_ERROR',
      status: 429,
      url: '/api/retryable',
    });

    const nonRetryable = new ApiError({
      message: 'forbidden',
      code: 'HTTP_ERROR',
      status: 403,
      url: '/api/non-retryable',
    });

    expect(shouldAutoRetryQueryError(retryable)).toBe(true);
    expect(shouldAutoRetryQueryError(nonRetryable)).toBe(false);
  });

  it('caps exponential retry delay at max threshold', () => {
    expect(getQueryRetryDelayMs(1)).toBe(500);
    expect(getQueryRetryDelayMs(2)).toBe(1000);
    expect(getQueryRetryDelayMs(10)).toBe(3000);
  });

  it('resolves standardized user-safe copy for API errors', () => {
    const forbidden = new ApiError({
      message: 'forbidden',
      code: 'HTTP_ERROR',
      status: 403,
      url: '/api/non-retryable',
    });

    expect(resolveQueryErrorCopy(forbidden)).toEqual({
      title: 'Access denied',
      message: 'You do not have permission to view this data.',
    });
  });
});
