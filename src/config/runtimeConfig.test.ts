import { getRuntimeConfig } from '@/config/runtimeConfig';

describe('runtimeConfig', () => {
  it('returns defaults when globals are undefined', () => {
    expect(getRuntimeConfig()).toEqual(
      expect.objectContaining({
        apiBaseUrl: '',
        apiTimeoutMs: 10_000,
        apiRetryCount: 1,
        apiRetryBaseDelayMs: 200,
        apiRetryMaxDelayMs: 2_000,
        apiRetryJitterRatio: 0.2,
        enableAuth: false,
        enableTelemetry: false,
        appRelease: '',
        appCommitSha: '',
        authRequiredRoles: [],
        authRequireTenant: false,
        authTenantId: '',
      }),
    );
  });
});
