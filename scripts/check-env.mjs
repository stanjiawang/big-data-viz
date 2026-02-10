const errors = [];

const enableMsw = process.env.VITE_ENABLE_MSW;
const apiBaseUrl = process.env.VITE_API_BASE_URL;
const timeout = process.env.VITE_API_TIMEOUT_MS;
const retryCount = process.env.VITE_API_RETRY_COUNT;
const enableAuth = process.env.VITE_ENABLE_AUTH;
const enableTelemetry = process.env.VITE_ENABLE_TELEMETRY;

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

if (errors.length > 0) {
  console.error('Environment validation failed:');
  for (const message of errors) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log('Environment validation passed.');
