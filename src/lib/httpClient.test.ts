const emitTelemetryMock = jest.fn();
const recordMetricMock = jest.fn();
const reportErrorMock = jest.fn();

jest.mock('@/lib/telemetry', () => ({
  emitTelemetry: (...args: unknown[]) => emitTelemetryMock(...args),
  recordMetric: (...args: unknown[]) => recordMetricMock(...args),
  reportError: (...args: unknown[]) => reportErrorMock(...args),
}));

import { fetchJson } from '@/lib/httpClient';
import { ApiError } from '@/lib/errors';

describe('httpClient', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    emitTelemetryMock.mockReset();
    recordMetricMock.mockReset();
    reportErrorMock.mockReset();
    Object.defineProperty(globalThis, 'fetch', {
      value: fetchMock,
      writable: true,
    });
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
    expect(reportErrorMock).toHaveBeenCalled();
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

  it('retries once for rate-limited responses when retryCount is set', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });

    const result = await fetchJson<{ ok: boolean }>('/api/test', { retryCount: 1 });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
