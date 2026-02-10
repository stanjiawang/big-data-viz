import { getRuntimeConfig } from '@/config/runtimeConfig';

describe('runtimeConfig', () => {
  it('returns defaults when globals are undefined', () => {
    expect(getRuntimeConfig()).toEqual(
      expect.objectContaining({
        apiBaseUrl: '',
        apiTimeoutMs: 10_000,
        apiRetryCount: 1,
        enableAuth: false,
      }),
    );
  });
});
