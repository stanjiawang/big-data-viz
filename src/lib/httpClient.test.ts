const emitTelemetryMock = jest.fn();
const recordMetricMock = jest.fn();
const reportErrorMock = jest.fn();

jest.mock('@/lib/telemetry', () => ({
  emitTelemetry: (...args: unknown[]) => emitTelemetryMock(...args),
  recordMetric: (...args: unknown[]) => recordMetricMock(...args),
  reportError: (...args: unknown[]) => reportErrorMock(...args),
}));

import { AUTH_SESSION_STORAGE_KEY } from '@/auth/authClient';
import { fetchJson } from '@/lib/httpClient';
import { ApiError } from '@/lib/errors';

describe('httpClient', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    emitTelemetryMock.mockReset();
    recordMetricMock.mockReset();
    reportErrorMock.mockReset();
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
    Object.defineProperty(globalThis, 'fetch', {
      value: fetchMock,
      writable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns parsed JSON on success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    await expect(fetchJson<{ ok: boolean }>('/api/test')).resolves.toEqual({ ok: true });
    expect(recordMetricMock).toHaveBeenCalledWith(
      'http.request.duration_ms',
      expect.any(Number),
      expect.objectContaining({
        url: '/api/test',
        status: undefined,
      }),
    );
  });

  it('adds auth and tenant headers from session context', async () => {
    window.localStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken: 'token-123',
        expiresAt: Date.now() + 60_000,
        user: {
          id: 'demo',
          name: 'Demo',
          roles: ['viewer'],
          tenantId: 'tenant-a',
        },
      }),
    );

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    await fetchJson<{ ok: boolean }>('/api/test');

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer token-123',
        'X-Tenant-Id': 'tenant-a',
      }),
    );
  });

  it('prefers tenant override from URL search params', async () => {
    window.localStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken: 'token-123',
        expiresAt: Date.now() + 60_000,
        user: {
          id: 'demo',
          name: 'Demo',
          roles: ['viewer'],
          tenantId: 'tenant-a',
        },
      }),
    );
    window.history.replaceState({}, '', '/?mockTenantId=tenant-b');

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    await fetchJson<{ ok: boolean }>('/api/test');

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toEqual(
      expect.objectContaining({
        'X-Tenant-Id': 'tenant-b',
      }),
    );
  });

  it('throws ApiError for non-2xx responses', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    await expect(fetchJson('/api/test', { retryCount: 0 })).rejects.toMatchObject({
      name: 'ApiError',
      code: 'HTTP_ERROR',
      status: 503,
    });
    expect(reportErrorMock).toHaveBeenCalledWith(
      'http.request.failed',
      expect.any(ApiError),
      expect.objectContaining({
        url: '/api/test',
        errorCode: 'HTTP_ERROR',
        httpStatus: 503,
        requestId: expect.any(String),
      }),
    );
  });

  it('retries once for server errors when retryCount is set', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });

    const result = await fetchJson<{ ok: boolean }>('/api/test', { retryCount: 1 });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(emitTelemetryMock).toHaveBeenCalledWith(
      'warn',
      'http.retry',
      expect.objectContaining({
        url: '/api/test',
        status: 500,
        code: 'HTTP_ERROR',
      }),
    );
  });

  it('waits for computed retry delay before next attempt', async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });

    const requestPromise = fetchJson<{ ok: boolean }>('/api/test', { retryCount: 1 });

    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(emitTelemetryMock).toHaveBeenCalledWith(
      'warn',
      'http.retry',
      expect.objectContaining({
        url: '/api/test',
        status: 500,
        code: 'HTTP_ERROR',
        retryDelayMs: 200,
      }),
    );

    await jest.advanceTimersByTimeAsync(199);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    await expect(requestPromise).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries once for rate-limited responses when retryCount is set', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });

    const result = await fetchJson<{ ok: boolean }>('/api/test', { retryCount: 1 });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry requests cancelled by caller', async () => {
    const controller = new AbortController();
    controller.abort();

    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'));

    await expect(
      fetchJson('/api/test', {
        retryCount: 2,
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      code: 'CANCELLED_ERROR',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(emitTelemetryMock).toHaveBeenCalledWith(
      'info',
      'http.cancelled',
      expect.objectContaining({
        code: 'CANCELLED_ERROR',
        requestId: expect.any(String),
      }),
    );
    expect(reportErrorMock).not.toHaveBeenCalled();
  });

  it('wraps network failures as ApiError', async () => {
    fetchMock.mockRejectedValue(new Error('socket closed'));

    try {
      await fetchJson('/api/test', { retryCount: 0 });
      throw new Error('Expected fetchJson to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe('NETWORK_ERROR');
    }
  });
});
