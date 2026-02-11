import { getRuntimeConfig } from '@/config/runtimeConfig';

type TelemetryLevel = 'info' | 'warn' | 'error';

type TelemetryPayload = Record<string, unknown>;

function canEmit() {
  const config = getRuntimeConfig();
  return config.enableTelemetry || config.mode === 'development';
}

function getBaseContext() {
  const config = getRuntimeConfig();

  return {
    env: config.mode,
    release: config.appRelease || 'unknown',
    commitSha: config.appCommitSha || 'unknown',
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
  };
}

function stringifyError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

export function emitTelemetry(
  level: TelemetryLevel,
  event: string,
  payload: TelemetryPayload = {},
) {
  if (!canEmit()) {
    return;
  }

  const record = {
    ts: new Date().toISOString(),
    event,
    ...getBaseContext(),
    ...payload,
  };

  if (level === 'error') {
    console.error('[telemetry]', record);
    return;
  }

  if (level === 'warn') {
    console.warn('[telemetry]', record);
    return;
  }

  console.info('[telemetry]', record);
}

export function reportError(event: string, error: unknown, context: TelemetryPayload = {}) {
  emitTelemetry('error', event, {
    ...context,
    error: stringifyError(error),
  });
}

export function recordMetric(name: string, value: number, context: TelemetryPayload = {}) {
  emitTelemetry('info', 'metric', {
    name,
    value,
    ...context,
  });
}

export function initGlobalErrorTracking() {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const onWindowError = (event: ErrorEvent) => {
    const fallbackError = new Error(event.message || 'Unknown uncaught error');
    reportError('frontend.uncaught_error', event.error ?? fallbackError, {
      source: 'window.error',
    });
  };

  const onUnhandledRejection = (event: Event) => {
    const rejectionEvent = event as Event & { reason?: unknown };
    const fallbackError = new Error('Unknown unhandled rejection');

    reportError('frontend.unhandled_rejection', rejectionEvent.reason ?? fallbackError, {
      source: 'window.unhandledrejection',
    });
  };

  window.addEventListener('error', onWindowError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    window.removeEventListener('error', onWindowError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
}
