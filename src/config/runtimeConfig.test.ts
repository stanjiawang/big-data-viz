import { getRuntimeConfig } from '@/config/runtimeConfig';

type ProcessEnv = {
  VITE_RUNTIME_PROFILE?: string;
};

function getProcessEnv(): ProcessEnv {
  const processRef = (globalThis as { process?: { env?: ProcessEnv } }).process;
  if (!processRef?.env) {
    return {};
  }
  return processRef.env;
}

describe('runtimeConfig', () => {
  const env = getProcessEnv();
  const originalRuntimeProfile = env.VITE_RUNTIME_PROFILE;

  afterEach(() => {
    if (originalRuntimeProfile === undefined) {
      delete env.VITE_RUNTIME_PROFILE;
    } else {
      env.VITE_RUNTIME_PROFILE = originalRuntimeProfile;
    }
  });

  it('returns defaults when globals are undefined', () => {
    expect(getRuntimeConfig()).toEqual(
      expect.objectContaining({
        runtimeProfile: 'standard',
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
        authProvider: 'mock',
        authSessionStorage: 'session',
        authOidcAuthorizeUrl: '',
        authOidcTokenUrl: '',
        authOidcClientId: '',
        authOidcScope: 'openid profile email',
        authOidcAudience: '',
        authOidcRedirectUri: '',
        authOidcRoleClaim: 'roles',
        authOidcTenantClaim: 'tenant_id',
        authOidcPostLogoutRedirectUri: '',
        authOidcLogoutUrl: '',
      }),
    );
  });

  it('applies demo runtime profile safe defaults when configured', () => {
    env.VITE_RUNTIME_PROFILE = 'demo';

    expect(getRuntimeConfig()).toEqual(
      expect.objectContaining({
        runtimeProfile: 'demo',
        enableMocking: true,
        enableAuth: false,
        enableTelemetry: false,
        authRequiredRoles: ['viewer'],
      }),
    );
  });
});
