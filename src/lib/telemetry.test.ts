let runtimeConfigMock = {
  mode: 'production',
  apiBaseUrl: '',
  apiTimeoutMs: 10_000,
  apiRetryCount: 1,
  apiRetryBaseDelayMs: 200,
  apiRetryMaxDelayMs: 2_000,
  apiRetryJitterRatio: 0.2,
  enableMocking: true,
  enableAuth: false,
  enableTelemetry: true,
  appRelease: '1.2.3',
  appCommitSha: 'abc123',
  authRequiredRoles: [] as string[],
  authRequireTenant: false,
  authTenantId: '',
};

jest.mock('@/config/runtimeConfig', () => ({
  getRuntimeConfig: () => runtimeConfigMock,
}));

import { emitTelemetry, initGlobalErrorTracking, recordMetric } from '@/lib/telemetry';

describe('telemetry', () => {
  const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    infoSpy.mockClear();
    warnSpy.mockClear();
    errorSpy.mockClear();
    window.history.replaceState({}, '', '/');
    runtimeConfigMock = {
      ...runtimeConfigMock,
      enableTelemetry: true,
      mode: 'production',
      appRelease: '1.2.3',
      appCommitSha: 'abc123',
    };
  });

  afterAll(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('emits release metadata with telemetry events', () => {
    emitTelemetry('warn', 'test.event', { sample: true });

    expect(warnSpy).toHaveBeenCalledWith(
      '[telemetry]',
      expect.objectContaining({
        event: 'test.event',
        release: '1.2.3',
        commitSha: 'abc123',
        env: 'production',
        sample: true,
      }),
    );
  });

  it('does not emit in production when telemetry is disabled', () => {
    runtimeConfigMock = {
      ...runtimeConfigMock,
      enableTelemetry: false,
    };

    recordMetric('metric.test', 123);

    expect(infoSpy).not.toHaveBeenCalled();
  });

  it('captures global uncaught errors and unhandled rejections', () => {
    const stop = initGlobalErrorTracking();

    const errorEvent = new Event('error') as Event & {
      message?: string;
      error?: Error;
    };
    errorEvent.message = 'Boom';
    errorEvent.error = new Error('Boom');
    window.dispatchEvent(errorEvent);

    const rejectionEvent = new Event('unhandledrejection') as Event & {
      reason?: unknown;
    };
    rejectionEvent.reason = new Error('Rejected');
    window.dispatchEvent(rejectionEvent);

    expect(errorSpy).toHaveBeenCalledWith(
      '[telemetry]',
      expect.objectContaining({
        event: 'frontend.uncaught_error',
        release: '1.2.3',
      }),
    );

    expect(errorSpy).toHaveBeenCalledWith(
      '[telemetry]',
      expect.objectContaining({
        event: 'frontend.unhandled_rejection',
        commitSha: 'abc123',
      }),
    );

    stop();
  });
});
