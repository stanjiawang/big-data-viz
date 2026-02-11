import { ApiError } from '@/lib/errors';

export const QUERY_DEFAULT_STALE_TIME_MS = 30_000;
export const QUERY_MAX_RETRY_ATTEMPTS = 1;
export const QUERY_RETRY_BASE_DELAY_MS = 500;
export const QUERY_RETRY_MAX_DELAY_MS = 3_000;

export const QUERY_BOUNDARY_DEFAULTS = {
  maxRetries: 3,
  baseDelayMs: 1_000,
} as const;

type QueryErrorCopy = {
  title: string;
  message: string;
};

const DEFAULT_QUERY_ERROR_COPY: QueryErrorCopy = {
  title: 'Data request failed',
  message: 'Please retry in a moment.',
};

export function shouldAutoRetryQueryError(error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.code === 'PARSE_ERROR' || error.code === 'CANCELLED_ERROR') {
      return false;
    }

    if (error.code === 'HTTP_ERROR') {
      if (!error.status) {
        return true;
      }

      return error.status >= 500 || error.status === 429;
    }

    return error.code === 'TIMEOUT_ERROR' || error.code === 'NETWORK_ERROR';
  }

  return true;
}

export function getQueryRetryDelayMs(attempt: number): number {
  const normalizedAttempt = Math.max(1, attempt);
  return Math.min(
    QUERY_RETRY_MAX_DELAY_MS,
    QUERY_RETRY_BASE_DELAY_MS * 2 ** (normalizedAttempt - 1),
  );
}

export function resolveQueryErrorCopy(
  error: unknown,
  titleOverride?: string,
  messageOverride?: string,
): QueryErrorCopy {
  if (titleOverride || messageOverride) {
    return {
      title: titleOverride ?? DEFAULT_QUERY_ERROR_COPY.title,
      message: messageOverride ?? DEFAULT_QUERY_ERROR_COPY.message,
    };
  }

  if (!(error instanceof ApiError)) {
    return DEFAULT_QUERY_ERROR_COPY;
  }

  if (error.code === 'TIMEOUT_ERROR') {
    return {
      title: 'Request timed out',
      message: 'The service took too long to respond.',
    };
  }

  if (error.code === 'CANCELLED_ERROR') {
    return {
      title: 'Request cancelled',
      message: 'The request was cancelled before completion.',
    };
  }

  if (error.code === 'NETWORK_ERROR') {
    return {
      title: 'Network issue',
      message: 'We could not reach the data service.',
    };
  }

  if (error.code === 'PARSE_ERROR') {
    return {
      title: 'Unexpected data format',
      message: 'The response payload could not be processed.',
    };
  }

  if (error.code === 'HTTP_ERROR') {
    if (error.status === 401 || error.status === 403) {
      return {
        title: 'Access denied',
        message: 'You do not have permission to view this data.',
      };
    }

    if (error.status === 404) {
      return {
        title: 'Data not found',
        message: 'The requested data was not available.',
      };
    }

    if (error.status === 429) {
      return {
        title: 'Rate limited',
        message: 'Too many requests were sent. Please retry shortly.',
      };
    }

    if (error.status && error.status >= 500) {
      return {
        title: 'Service unavailable',
        message: 'The backend service is temporarily unavailable.',
      };
    }
  }

  return DEFAULT_QUERY_ERROR_COPY;
}
