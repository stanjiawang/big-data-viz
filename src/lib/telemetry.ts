import { getRuntimeConfig } from '@/config/runtimeConfig';

type TelemetryLevel = 'info' | 'warn' | 'error';

type TelemetryPayload = Record<string, unknown>;

function canEmit() {
  const config = getRuntimeConfig();
  return config.enableTelemetry || config.mode === 'development';
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
