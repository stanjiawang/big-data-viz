const errors = [];

const enableMsw = process.env.VITE_ENABLE_MSW;
const apiBaseUrl = process.env.VITE_API_BASE_URL;
const timeout = process.env.VITE_API_TIMEOUT_MS;
const retryCount = process.env.VITE_API_RETRY_COUNT;
const enableAuth = process.env.VITE_ENABLE_AUTH;
const enableTelemetry = process.env.VITE_ENABLE_TELEMETRY;
const authRequiredRoles = process.env.VITE_AUTH_REQUIRED_ROLES;
const authRequireTenant = process.env.VITE_AUTH_REQUIRE_TENANT;
const authTenantId = process.env.VITE_AUTH_TENANT_ID;

const mocksEnabled = enableMsw === 'true';

if (!mocksEnabled && !apiBaseUrl) {
  errors.push('VITE_API_BASE_URL is required when VITE_ENABLE_MSW is not true.');
}

if (apiBaseUrl) {
  try {
    const parsed = new URL(apiBaseUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      errors.push('VITE_API_BASE_URL must use http or https protocol.');
    }
  } catch {
    errors.push('VITE_API_BASE_URL must be a valid absolute URL.');
  }
}

if (timeout !== undefined && timeout !== '') {
  const value = Number(timeout);
  if (!Number.isFinite(value) || value <= 0) {
    errors.push('VITE_API_TIMEOUT_MS must be a positive number.');
  }
}

if (retryCount !== undefined && retryCount !== '') {
  const value = Number(retryCount);
  if (!Number.isInteger(value) || value < 0) {
    errors.push('VITE_API_RETRY_COUNT must be a non-negative integer.');
  }
}

if (enableAuth !== undefined && enableAuth !== '' && !['true', 'false'].includes(enableAuth)) {
  errors.push('VITE_ENABLE_AUTH must be true or false when set.');
}

if (
  enableTelemetry !== undefined &&
  enableTelemetry !== '' &&
  !['true', 'false'].includes(enableTelemetry)
) {
  errors.push('VITE_ENABLE_TELEMETRY must be true or false when set.');
}

if (
  authRequireTenant !== undefined &&
  authRequireTenant !== '' &&
  !['true', 'false'].includes(authRequireTenant)
) {
  errors.push('VITE_AUTH_REQUIRE_TENANT must be true or false when set.');
}

if (authRequiredRoles) {
  const roles = authRequiredRoles
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const invalidRole = roles.find((role) => !/^[a-zA-Z0-9:_-]+$/.test(role));
  if (invalidRole) {
    errors.push('VITE_AUTH_REQUIRED_ROLES must be a comma-separated list of role tokens.');
  }
}

if (authTenantId !== undefined && authTenantId !== '' && !/^[a-zA-Z0-9:_-]+$/.test(authTenantId)) {
  errors.push(
    'VITE_AUTH_TENANT_ID must contain only letters, numbers, colon, underscore, or dash.',
  );
}

if (authRequireTenant === 'true' && enableAuth !== 'true') {
  errors.push('VITE_AUTH_REQUIRE_TENANT=true requires VITE_ENABLE_AUTH=true.');
}

if (enableAuth === 'true' && authRequireTenant === 'true' && !authTenantId) {
  errors.push('VITE_AUTH_TENANT_ID is required when tenant auth enforcement is enabled.');
}

if (errors.length > 0) {
  console.error('Environment validation failed:');
  for (const message of errors) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log('Environment validation passed.');
