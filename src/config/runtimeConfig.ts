const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_COUNT = 1;

export type RuntimeConfig = {
  mode: string;
  apiBaseUrl: string;
  apiTimeoutMs: number;
  apiRetryCount: number;
  enableMocking: boolean;
  enableAuth: boolean;
  enableTelemetry: boolean;
  authRequiredRoles: string[];
  authRequireTenant: boolean;
  authTenantId: string;
};

function resolveMode() {
  if (typeof __APP_MODE__ !== 'undefined' && __APP_MODE__) {
    return __APP_MODE__;
  }

  const nodeEnv = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
    ?.NODE_ENV;

  return nodeEnv ?? 'production';
}

function parseTimeoutMs(value: string | number | undefined, fallback: number) {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseRetryCount(value: string | number | undefined, fallback: number) {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseBoolean(value: string | boolean | undefined, fallback: boolean) {
  if (value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return fallback;
}

function parseRoles(value: string | undefined) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(',')
        .map((role) => role.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeBaseUrl(value: string | undefined) {
  if (!value) {
    return '';
  }

  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function normalizeToken(value: string | undefined) {
  if (!value) {
    return '';
  }

  return value.trim();
}

export function getRuntimeConfig(): RuntimeConfig {
  const mode = resolveMode();

  const apiBaseUrl = normalizeBaseUrl(
    typeof __APP_API_BASE_URL__ !== 'undefined' ? __APP_API_BASE_URL__ : undefined,
  );

  const apiTimeoutMs = parseTimeoutMs(
    typeof __APP_API_TIMEOUT_MS__ !== 'undefined' ? __APP_API_TIMEOUT_MS__ : undefined,
    DEFAULT_TIMEOUT_MS,
  );

  const apiRetryCount = parseRetryCount(
    typeof __APP_API_RETRY_COUNT__ !== 'undefined' ? __APP_API_RETRY_COUNT__ : undefined,
    DEFAULT_RETRY_COUNT,
  );

  const enableMocking = parseBoolean(
    typeof __APP_ENABLE_MSW__ !== 'undefined' ? __APP_ENABLE_MSW__ : undefined,
    mode === 'development',
  );

  const enableAuth = parseBoolean(
    typeof __APP_ENABLE_AUTH__ !== 'undefined' ? __APP_ENABLE_AUTH__ : undefined,
    false,
  );

  const enableTelemetry = parseBoolean(
    typeof __APP_ENABLE_TELEMETRY__ !== 'undefined' ? __APP_ENABLE_TELEMETRY__ : undefined,
    false,
  );

  const authRequiredRoles = parseRoles(
    typeof __APP_AUTH_REQUIRED_ROLES__ !== 'undefined' ? __APP_AUTH_REQUIRED_ROLES__ : undefined,
  );

  const authRequireTenant = parseBoolean(
    typeof __APP_AUTH_REQUIRE_TENANT__ !== 'undefined' ? __APP_AUTH_REQUIRE_TENANT__ : undefined,
    false,
  );

  const authTenantId = normalizeToken(
    typeof __APP_AUTH_TENANT_ID__ !== 'undefined' ? __APP_AUTH_TENANT_ID__ : undefined,
  );

  return {
    mode,
    apiBaseUrl,
    apiTimeoutMs,
    apiRetryCount,
    enableMocking,
    enableAuth,
    enableTelemetry,
    authRequiredRoles,
    authRequireTenant,
    authTenantId,
  };
}
