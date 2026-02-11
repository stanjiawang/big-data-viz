const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BASE_DELAY_MS = 200;
const DEFAULT_RETRY_MAX_DELAY_MS = 2_000;
const DEFAULT_RETRY_JITTER_RATIO = 0.2;

export type RuntimeConfig = {
  mode: string;
  apiBaseUrl: string;
  apiTimeoutMs: number;
  apiRetryCount: number;
  apiRetryBaseDelayMs: number;
  apiRetryMaxDelayMs: number;
  apiRetryJitterRatio: number;
  enableMocking: boolean;
  enableAuth: boolean;
  enableTelemetry: boolean;
  appRelease: string;
  appCommitSha: string;
  authRequiredRoles: string[];
  authRequireTenant: boolean;
  authTenantId: string;
  authProvider: 'mock' | 'oidc';
  authOidcAuthorizeUrl: string;
  authOidcTokenUrl: string;
  authOidcClientId: string;
  authOidcScope: string;
  authOidcAudience: string;
  authOidcRedirectUri: string;
  authOidcRoleClaim: string;
  authOidcTenantClaim: string;
  authOidcPostLogoutRedirectUri: string;
  authOidcLogoutUrl: string;
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

function parsePositiveNumber(value: string | number | undefined, fallback: number) {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseJitterRatio(value: string | number | undefined, fallback: number) {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback;
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

function parseAuthProvider(value: string | undefined): 'mock' | 'oidc' {
  if (value === 'oidc') {
    return 'oidc';
  }

  return 'mock';
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

  const apiRetryBaseDelayMs = parsePositiveNumber(
    typeof __APP_API_RETRY_BASE_DELAY_MS__ !== 'undefined'
      ? __APP_API_RETRY_BASE_DELAY_MS__
      : undefined,
    DEFAULT_RETRY_BASE_DELAY_MS,
  );

  const apiRetryMaxDelayMs = parsePositiveNumber(
    typeof __APP_API_RETRY_MAX_DELAY_MS__ !== 'undefined'
      ? __APP_API_RETRY_MAX_DELAY_MS__
      : undefined,
    DEFAULT_RETRY_MAX_DELAY_MS,
  );

  const apiRetryJitterRatio = parseJitterRatio(
    typeof __APP_API_RETRY_JITTER_RATIO__ !== 'undefined'
      ? __APP_API_RETRY_JITTER_RATIO__
      : undefined,
    DEFAULT_RETRY_JITTER_RATIO,
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

  const appRelease = normalizeToken(
    typeof __APP_RELEASE__ !== 'undefined' ? __APP_RELEASE__ : undefined,
  );

  const appCommitSha = normalizeToken(
    typeof __APP_COMMIT_SHA__ !== 'undefined' ? __APP_COMMIT_SHA__ : undefined,
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

  const authProvider = parseAuthProvider(
    typeof __APP_AUTH_PROVIDER__ !== 'undefined' ? __APP_AUTH_PROVIDER__ : undefined,
  );

  const authOidcAuthorizeUrl = normalizeToken(
    typeof __APP_AUTH_OIDC_AUTHORIZE_URL__ !== 'undefined'
      ? __APP_AUTH_OIDC_AUTHORIZE_URL__
      : undefined,
  );

  const authOidcTokenUrl = normalizeToken(
    typeof __APP_AUTH_OIDC_TOKEN_URL__ !== 'undefined' ? __APP_AUTH_OIDC_TOKEN_URL__ : undefined,
  );

  const authOidcClientId = normalizeToken(
    typeof __APP_AUTH_OIDC_CLIENT_ID__ !== 'undefined' ? __APP_AUTH_OIDC_CLIENT_ID__ : undefined,
  );

  const authOidcScope = normalizeToken(
    typeof __APP_AUTH_OIDC_SCOPE__ !== 'undefined' ? __APP_AUTH_OIDC_SCOPE__ : undefined,
  );

  const authOidcAudience = normalizeToken(
    typeof __APP_AUTH_OIDC_AUDIENCE__ !== 'undefined' ? __APP_AUTH_OIDC_AUDIENCE__ : undefined,
  );

  const authOidcRedirectUri = normalizeToken(
    typeof __APP_AUTH_OIDC_REDIRECT_URI__ !== 'undefined'
      ? __APP_AUTH_OIDC_REDIRECT_URI__
      : undefined,
  );

  const authOidcRoleClaim = normalizeToken(
    typeof __APP_AUTH_OIDC_ROLE_CLAIM__ !== 'undefined' ? __APP_AUTH_OIDC_ROLE_CLAIM__ : undefined,
  );

  const authOidcTenantClaim = normalizeToken(
    typeof __APP_AUTH_OIDC_TENANT_CLAIM__ !== 'undefined'
      ? __APP_AUTH_OIDC_TENANT_CLAIM__
      : undefined,
  );

  const authOidcPostLogoutRedirectUri = normalizeToken(
    typeof __APP_AUTH_OIDC_POST_LOGOUT_REDIRECT_URI__ !== 'undefined'
      ? __APP_AUTH_OIDC_POST_LOGOUT_REDIRECT_URI__
      : undefined,
  );

  const authOidcLogoutUrl = normalizeToken(
    typeof __APP_AUTH_OIDC_LOGOUT_URL__ !== 'undefined' ? __APP_AUTH_OIDC_LOGOUT_URL__ : undefined,
  );

  return {
    mode,
    apiBaseUrl,
    apiTimeoutMs,
    apiRetryCount,
    apiRetryBaseDelayMs,
    apiRetryMaxDelayMs,
    apiRetryJitterRatio,
    enableMocking,
    enableAuth,
    enableTelemetry,
    appRelease,
    appCommitSha,
    authRequiredRoles,
    authRequireTenant,
    authTenantId,
    authProvider,
    authOidcAuthorizeUrl,
    authOidcTokenUrl,
    authOidcClientId,
    authOidcScope: authOidcScope || 'openid profile email',
    authOidcAudience,
    authOidcRedirectUri,
    authOidcRoleClaim: authOidcRoleClaim || 'roles',
    authOidcTenantClaim: authOidcTenantClaim || 'tenant_id',
    authOidcPostLogoutRedirectUri,
    authOidcLogoutUrl,
  };
}
