import { createAuthClient, AUTH_SESSION_STORAGE_KEY, MOCK_AUTH_ACCOUNTS } from '@/auth/authClient';
import type { RuntimeConfig } from '@/config/runtimeConfig';

function createRuntimeConfig(overrides: Partial<RuntimeConfig> = {}): RuntimeConfig {
  return {
    mode: 'test',
    apiBaseUrl: '',
    apiTimeoutMs: 10_000,
    apiRetryCount: 1,
    apiRetryBaseDelayMs: 200,
    apiRetryMaxDelayMs: 2_000,
    apiRetryJitterRatio: 0.2,
    enableMocking: true,
    enableAuth: true,
    enableTelemetry: false,
    appRelease: '',
    appCommitSha: '',
    authRequiredRoles: [],
    authRequireTenant: false,
    authTenantId: '',
    authProvider: 'mock',
    authSessionStorage: 'local',
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
    ...overrides,
  };
}

describe('authClient', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('uses mock auth provider by default', async () => {
    const client = createAuthClient(createRuntimeConfig());
    await client.signIn({
      email: MOCK_AUTH_ACCOUNTS[0].email,
      password: MOCK_AUTH_ACCOUNTS[0].password,
    });

    const session = await client.getSession();
    expect(session).not.toBeNull();
    expect(session?.user.roles).toEqual(['analyst']);
    expect(session?.user.email).toBe(MOCK_AUTH_ACCOUNTS[0].email);
    expect(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeTruthy();
  });

  it('uses sessionStorage when authSessionStorage=session', async () => {
    const client = createAuthClient(
      createRuntimeConfig({
        authSessionStorage: 'session',
      }),
    );
    await client.signIn({
      email: MOCK_AUTH_ACCOUNTS[0].email,
      password: MOCK_AUTH_ACCOUNTS[0].password,
    });

    expect(window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeTruthy();
    expect(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('rejects invalid mock credentials', async () => {
    const client = createAuthClient(createRuntimeConfig());

    await expect(
      client.signIn({
        email: MOCK_AUTH_ACCOUNTS[0].email,
        password: 'wrong-password',
      }),
    ).rejects.toThrow('Invalid mock account credentials.');
  });

  it('fails OIDC sign-in when required config is missing', async () => {
    const client = createAuthClient(
      createRuntimeConfig({
        authProvider: 'oidc',
      }),
    );

    await expect(client.signIn()).rejects.toThrow(
      'OIDC is enabled but required auth config is missing (authorize URL, token URL, client ID).',
    );
  });

  it('stores OIDC transaction when sign-in is started', async () => {
    const originalCrypto = globalThis.crypto;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: {
          getRandomValues: (array: Uint8Array) => {
            for (let index = 0; index < array.length; index += 1) {
              array[index] = (index % 16) + 1;
            }
            return array;
          },
          subtle: {
            digest: async () => new Uint8Array([1, 2, 3, 4]).buffer,
          },
        },
      });

      const client = createAuthClient(
        createRuntimeConfig({
          authProvider: 'oidc',
          authOidcAuthorizeUrl: 'https://id.example.com/authorize',
          authOidcTokenUrl: 'https://id.example.com/oauth/token',
          authOidcClientId: 'client-123',
        }),
      );

      await client.signIn().catch(() => undefined);
      expect(window.sessionStorage.getItem('bdv.auth.oidc.transaction')).toContain('codeVerifier');
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: originalCrypto,
      });
      consoleErrorSpy.mockRestore();
    }
  });

  it('exchanges callback code for tokens and stores mapped OIDC session', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: createJwt({
          sub: 'user-1',
          roles: ['analyst'],
          tenant_id: 'tenant-x',
          email: 'a@example.com',
          name: 'Analyst',
        }),
        expires_in: 300,
      }),
    });
    Object.defineProperty(globalThis, 'fetch', {
      value: fetchMock,
      writable: true,
    });

    window.sessionStorage.setItem(
      'bdv.auth.oidc.transaction',
      JSON.stringify({
        codeVerifier: 'verifier-1',
        state: 'state-1',
        returnTo: '/',
      }),
    );
    window.history.replaceState({}, '', '/?code=code-1&state=state-1');

    const client = createAuthClient(
      createRuntimeConfig({
        authProvider: 'oidc',
        authOidcAuthorizeUrl: 'https://id.example.com/authorize',
        authOidcTokenUrl: 'https://id.example.com/oauth/token',
        authOidcClientId: 'client-123',
      }),
    );

    const session = await client.getSession();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://id.example.com/oauth/token',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(session).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        user: expect.objectContaining({
          id: 'user-1',
          name: 'Analyst',
          email: 'a@example.com',
          roles: ['analyst'],
          tenantId: 'tenant-x',
        }),
      }),
    );
    expect(window.location.search).toBe('');
  });

  it('rejects callback when OIDC state does not match', async () => {
    window.sessionStorage.setItem(
      'bdv.auth.oidc.transaction',
      JSON.stringify({
        codeVerifier: 'verifier-1',
        state: 'state-1',
        returnTo: '/',
      }),
    );
    window.history.replaceState({}, '', '/?code=code-1&state=state-2');

    const client = createAuthClient(
      createRuntimeConfig({
        authProvider: 'oidc',
        authOidcAuthorizeUrl: 'https://id.example.com/authorize',
        authOidcTokenUrl: 'https://id.example.com/oauth/token',
        authOidcClientId: 'client-123',
      }),
    );

    await expect(client.getSession()).rejects.toThrow('OIDC state validation failed.');
  });

  it('clears session when signing out from OIDC provider', async () => {
    window.localStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken: 'token-1',
        expiresAt: Date.now() + 60_000,
        user: {
          id: 'u1',
          name: 'User One',
          roles: ['viewer'],
        },
      }),
    );

    const client = createAuthClient(
      createRuntimeConfig({
        authProvider: 'oidc',
        authOidcAuthorizeUrl: 'https://id.example.com/authorize',
        authOidcTokenUrl: 'https://id.example.com/oauth/token',
        authOidcClientId: 'client-123',
      }),
    );

    await client.signOut();

    expect(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('refreshes expiring OIDC sessions with refresh token', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: createJwt({
          sub: 'user-1',
          roles: ['admin'],
          tenant_id: 'tenant-y',
          email: 'admin@example.com',
          name: 'Admin User',
        }),
        expires_in: 600,
      }),
    });
    Object.defineProperty(globalThis, 'fetch', {
      value: fetchMock,
      writable: true,
    });

    window.localStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken: 'old-token',
        expiresAt: Date.now() - 1,
        refreshToken: 'refresh-123',
        user: {
          id: 'user-1',
          name: 'Admin User',
          roles: ['viewer'],
        },
      }),
    );

    const client = createAuthClient(
      createRuntimeConfig({
        authProvider: 'oidc',
        authOidcTokenUrl: 'https://id.example.com/oauth/token',
        authOidcClientId: 'client-123',
      }),
    );

    const session = await client.getSession();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://id.example.com/oauth/token',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(URLSearchParams),
      }),
    );
    const requestBody = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(requestBody.get('grant_type')).toBe('refresh_token');
    expect(requestBody.get('refresh_token')).toBe('refresh-123');
    expect(session).toEqual(
      expect.objectContaining({
        refreshToken: 'refresh-123',
        user: expect.objectContaining({
          roles: ['admin'],
          tenantId: 'tenant-y',
        }),
      }),
    );
  });

  it('returns null when session is expired and no refresh token exists', async () => {
    window.localStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken: 'expired-token',
        expiresAt: Date.now() - 1,
        user: {
          id: 'u1',
          name: 'User One',
          roles: ['viewer'],
        },
      }),
    );

    const client = createAuthClient(
      createRuntimeConfig({
        authProvider: 'oidc',
        authOidcTokenUrl: 'https://id.example.com/oauth/token',
        authOidcClientId: 'client-123',
      }),
    );

    await expect(client.getSession()).resolves.toBeNull();
    expect(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('clears session when refresh token exchange fails', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    Object.defineProperty(globalThis, 'fetch', {
      value: fetchMock,
      writable: true,
    });

    window.localStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken: 'old-token',
        expiresAt: Date.now() - 1,
        refreshToken: 'refresh-123',
        user: {
          id: 'user-1',
          name: 'Admin User',
          roles: ['viewer'],
        },
      }),
    );

    const client = createAuthClient(
      createRuntimeConfig({
        authProvider: 'oidc',
        authOidcTokenUrl: 'https://id.example.com/oauth/token',
        authOidcClientId: 'client-123',
      }),
    );

    await expect(client.getSession()).rejects.toThrow(
      'Authentication session expired. Please sign in again.',
    );
    expect(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });
});

function createJwt(payload: Record<string, unknown>) {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.signature`;
}
