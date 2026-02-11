import { AUTH_SESSION_STORAGE_KEY } from '@/auth/authClient';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { ApiError } from '@/lib/errors';
import { emitTelemetry, recordMetric, reportError } from '@/lib/telemetry';

type HttpRequestOptions = {
  timeoutMs?: number;
  retryCount?: number;
  signal?: AbortSignal;
  requestId?: string;
};

type RequestRetryState = {
  attempts: number;
};

type SessionShape = {
  accessToken?: string;
  user?: {
    tenantId?: string;
  };
};

function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }

  return Date.now();
}

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

    if (error.code === 'HTTP_ERROR' && status && (status >= 500 || status === 429)) {
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

function generateRequestId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readAuthHeaders() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {} as Record<string, string>;
  }

  const authHeaders: Record<string, string> = {};
  const sessionRaw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);

  if (sessionRaw) {
    try {
      const session = JSON.parse(sessionRaw) as SessionShape;

      if (session.accessToken) {
        authHeaders.Authorization = `Bearer ${session.accessToken}`;
      }

      if (session.user?.tenantId) {
        authHeaders['X-Tenant-Id'] = session.user.tenantId;
      }
    } catch {
      // Ignore bad session payloads and send request without auth context.
    }
  }

  const search = new URLSearchParams(window.location.search);
  const tenantOverride = search.get('mockTenantId');
  if (tenantOverride) {
    authHeaders['X-Tenant-Id'] = tenantOverride;
  }

  return authHeaders;
}

function computeRetryDelayMs(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitterRatio: number,
): number {
  const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** Math.max(0, attempt - 1));
  const jitterRange = exponentialDelay * jitterRatio;
  const jitterOffset = (Math.random() * 2 - 1) * jitterRange;

  return Math.max(0, Math.round(exponentialDelay + jitterOffset));
}

function sleep(delayMs: number) {
  if (delayMs <= 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), delayMs);
  });
}

export async function fetchJson<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
  const config = getRuntimeConfig();
  const timeoutMs = options.timeoutMs ?? config.apiTimeoutMs;
  const retryCount = options.retryCount ?? config.apiRetryCount;
  const url = buildUrl(path, config.apiBaseUrl);
  const requestId = options.requestId ?? generateRequestId();
  const retryState: RequestRetryState = { attempts: 0 };

  while (retryState.attempts <= retryCount) {
    retryState.attempts += 1;
    const attemptStart = nowMs();

    const { signal, cleanup } = createTimeoutSignal(timeoutMs, options.signal);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal,
        headers: {
          Accept: 'application/json',
          'X-Request-Id': requestId,
          ...readAuthHeaders(),
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
        const payload = (await response.json()) as T;
        recordMetric('http.request.duration_ms', Math.round(nowMs() - attemptStart), {
          url,
          status: response.status,
          attempt: retryState.attempts,
          requestId,
        });
        return payload;
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
          const retryDelayMs = computeRetryDelayMs(
            retryState.attempts,
            config.apiRetryBaseDelayMs,
            config.apiRetryMaxDelayMs,
            config.apiRetryJitterRatio,
          );

          emitTelemetry('warn', 'http.retry', {
            url,
            code: error.code,
            status: error.status,
            attempt: retryState.attempts,
            requestId,
            retryDelayMs,
          });

          await sleep(retryDelayMs);
          continue;
        }

        reportError('http.request.failed', error, {
          url,
          attempt: retryState.attempts,
          requestId,
          errorCode: error.code,
          httpStatus: error.status,
        });
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
          const retryDelayMs = computeRetryDelayMs(
            retryState.attempts,
            config.apiRetryBaseDelayMs,
            config.apiRetryMaxDelayMs,
            config.apiRetryJitterRatio,
          );

          emitTelemetry('warn', 'http.retry', {
            url,
            code: timeoutError.code,
            attempt: retryState.attempts,
            requestId,
            retryDelayMs,
          });

          await sleep(retryDelayMs);
          continue;
        }

        reportError('http.request.failed', timeoutError, {
          url,
          attempt: retryState.attempts,
          requestId,
          errorCode: timeoutError.code,
          httpStatus: timeoutError.status,
        });
        throw timeoutError;
      }

      const networkError = new ApiError({
        message: 'Network request failed',
        code: 'NETWORK_ERROR',
        url,
        cause: error,
      });

      if (retryState.attempts <= retryCount && shouldRetry(networkError)) {
        const retryDelayMs = computeRetryDelayMs(
          retryState.attempts,
          config.apiRetryBaseDelayMs,
          config.apiRetryMaxDelayMs,
          config.apiRetryJitterRatio,
        );

        emitTelemetry('warn', 'http.retry', {
          url,
          code: networkError.code,
          attempt: retryState.attempts,
          requestId,
          retryDelayMs,
        });

        await sleep(retryDelayMs);
        continue;
      }

      reportError('http.request.failed', networkError, {
        url,
        attempt: retryState.attempts,
        requestId,
        errorCode: networkError.code,
        httpStatus: networkError.status,
      });
      throw networkError;
    } finally {
      cleanup();
    }
  }

  const finalError = new ApiError({
    message: 'Request failed after retries',
    code: 'NETWORK_ERROR',
    url,
  });

  reportError('http.request.failed', finalError, {
    url,
    attempt: retryState.attempts,
    requestId,
    errorCode: finalError.code,
    httpStatus: finalError.status,
  });

  throw finalError;
}
