import { getRuntimeConfig } from '@/config/runtimeConfig';
import { ApiError } from '@/lib/errors';

type HttpRequestOptions = {
  timeoutMs?: number;
  retryCount?: number;
  signal?: AbortSignal;
};

type RequestRetryState = {
  attempts: number;
};

function buildUrl(path: string, baseUrl: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  if (!baseUrl) {
    return path;
  }

  if (path.startsWith('/')) {
    return `${baseUrl}${path}`;
  }

  return `${baseUrl}/${path}`;
}

function shouldRetry(error: unknown, status?: number) {
  if (error instanceof ApiError) {
    if (error.code === 'TIMEOUT_ERROR' || error.code === 'NETWORK_ERROR') {
      return true;
    }

    if (error.code === 'HTTP_ERROR' && status && status >= 500) {
      return true;
    }
  }

  return false;
}

function createTimeoutSignal(timeoutMs: number, externalSignal?: AbortSignal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const cleanup = () => {
    clearTimeout(timeoutId);
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup,
  };
}

export async function fetchJson<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
  const config = getRuntimeConfig();
  const timeoutMs = options.timeoutMs ?? config.apiTimeoutMs;
  const retryCount = options.retryCount ?? config.apiRetryCount;
  const url = buildUrl(path, config.apiBaseUrl);
  const retryState: RequestRetryState = { attempts: 0 };

  while (retryState.attempts <= retryCount) {
    retryState.attempts += 1;

    const { signal, cleanup } = createTimeoutSignal(timeoutMs, options.signal);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new ApiError({
          message: `Request failed: ${response.status}`,
          code: 'HTTP_ERROR',
          status: response.status,
          url,
        });
      }

      try {
        return (await response.json()) as T;
      } catch (error) {
        throw new ApiError({
          message: 'Failed to parse API response',
          code: 'PARSE_ERROR',
          url,
          cause: error,
        });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (retryState.attempts <= retryCount && shouldRetry(error, error.status)) {
          continue;
        }
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        const timeoutError = new ApiError({
          message: `Request timed out after ${timeoutMs}ms`,
          code: 'TIMEOUT_ERROR',
          url,
          cause: error,
        });
        if (retryState.attempts <= retryCount) {
          continue;
        }
        throw timeoutError;
      }

      const networkError = new ApiError({
        message: 'Network request failed',
        code: 'NETWORK_ERROR',
        url,
        cause: error,
      });

      if (retryState.attempts <= retryCount && shouldRetry(networkError)) {
        continue;
      }

      throw networkError;
    } finally {
      cleanup();
    }
  }

  throw new ApiError({
    message: 'Request failed after retries',
    code: 'NETWORK_ERROR',
    url,
  });
}
