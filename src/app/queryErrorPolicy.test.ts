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

  it('does not retry cancellation errors', () => {
    const cancelled = new ApiError({
      message: 'cancelled by caller',
      code: 'CANCELLED_ERROR',
      url: '/api/cancelled',
    });

    expect(shouldAutoRetryQueryError(cancelled)).toBe(false);
    expect(resolveQueryErrorCopy(cancelled)).toEqual({
      title: 'Request cancelled',
      message: 'The request was cancelled before completion.',
    });
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
