import { getRuntimeConfig } from '@/config/runtimeConfig';
import type { RuntimeConfig } from '@/config/runtimeConfig';
import type { AuthSession } from '@/auth/types';
import { emitTelemetry, reportError } from '@/lib/telemetry';

type SessionListener = (_session: AuthSession | null) => void;

export type AuthClient = {
  getSession: () => Promise<AuthSession | null>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  subscribe: (_listener: SessionListener) => () => void;
};

export const AUTH_SESSION_STORAGE_KEY = 'bdv.auth.session';
const AUTH_OIDC_TRANSACTION_STORAGE_KEY = 'bdv.auth.oidc.transaction';
const SESSION_REFRESH_SKEW_MS = 30_000;

type OidcTransaction = {
  codeVerifier: string;
  state: string;
  returnTo: string;
};

type OidcTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  id_token?: string;
  token_type?: string;
};

function readSession(): AuthSession | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken || !parsed?.user?.id || !parsed?.expiresAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(session: AuthSession | null) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

function readOidcTransaction(): OidcTransaction | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_OIDC_TRANSACTION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as OidcTransaction;
    if (!parsed.codeVerifier || !parsed.state) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeOidcTransaction(transaction: OidcTransaction | null) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  if (!transaction) {
    window.localStorage.removeItem(AUTH_OIDC_TRANSACTION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_OIDC_TRANSACTION_STORAGE_KEY, JSON.stringify(transaction));
}

function resolveTenantId() {
  if (typeof __APP_AUTH_TENANT_ID__ !== 'undefined' && __APP_AUTH_TENANT_ID__) {
    return __APP_AUTH_TENANT_ID__.trim();
  }

  return 'tenant-demo';
}

function resolveOidcRedirectUri(config: RuntimeConfig) {
  if (config.authOidcRedirectUri) {
    return config.authOidcRedirectUri;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  return `${window.location.origin}${window.location.pathname}`;
}

function resolveOidcPostLogoutRedirectUri(config: RuntimeConfig) {
  if (config.authOidcPostLogoutRedirectUri) {
    return config.authOidcPostLogoutRedirectUri;
  }

  return resolveOidcRedirectUri(config);
}

function parseTokenClaims(token: string | undefined): Record<string, unknown> {
  if (!token) {
    return {};
  }

  const encoded = token.split('.')[1];
  if (!encoded) {
    return {};
  }

  const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');

  try {
    if (typeof atob === 'function') {
      return JSON.parse(atob(padded)) as Record<string, unknown>;
    }
  } catch {
    return {};
  }

  return {};
}

function resolveClaimValue(claims: Record<string, unknown>, claimPath: string): unknown {
  if (!claimPath) {
    return undefined;
  }

  return claimPath
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((value, segment) => {
      if (typeof value !== 'object' || value === null || !(segment in value)) {
        return undefined;
      }

      return (value as Record<string, unknown>)[segment];
    }, claims);
}

function parseRoles(claimValue: unknown): string[] {
  if (Array.isArray(claimValue)) {
    return claimValue
      .map(String)
      .map((role) => role.trim())
      .filter(Boolean);
  }

  if (typeof claimValue === 'string') {
    return claimValue
      .split(/[,\s]+/)
      .map((role) => role.trim())
      .filter(Boolean);
  }

  return [];
}

function parseTenant(claimValue: unknown): string | undefined {
  if (typeof claimValue !== 'string') {
    return undefined;
  }

  const trimmed = claimValue.trim();
  return trimmed || undefined;
}

function sanitizeOidcCallbackParams() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function createRandomUrlSafeString(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function createCodeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const bytes = new Uint8Array(digest);
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function buildOidcSessionFromTokens(
  config: RuntimeConfig,
  tokenResponse: OidcTokenResponse,
  previousSession?: AuthSession | null,
): AuthSession {
  const idClaims = parseTokenClaims(tokenResponse.id_token);
  const accessClaims = parseTokenClaims(tokenResponse.access_token);
  const claims = Object.keys(idClaims).length > 0 ? idClaims : accessClaims;

  const roles = parseRoles(resolveClaimValue(claims, config.authOidcRoleClaim));
  const tenantId = parseTenant(resolveClaimValue(claims, config.authOidcTenantClaim));
  const sub = typeof claims.sub === 'string' ? claims.sub : 'oidc-user';
  const name =
    (typeof claims.name === 'string' && claims.name) ||
    (typeof claims.preferred_username === 'string' && claims.preferred_username) ||
    (typeof claims.email === 'string' && claims.email) ||
    sub;
  const email = typeof claims.email === 'string' ? claims.email : undefined;
  const exp = typeof claims.exp === 'number' ? claims.exp * 1000 : undefined;
  const expiresAt = exp ?? Date.now() + (tokenResponse.expires_in ?? 3600) * 1000;

  return {
    accessToken: tokenResponse.access_token ?? '',
    expiresAt,
    refreshToken: tokenResponse.refresh_token ?? previousSession?.refreshToken,
    idToken: tokenResponse.id_token ?? previousSession?.idToken,
    user: {
      id: sub,
      name,
      email,
      roles,
      tenantId,
    },
  };
}

function isSessionExpired(session: AuthSession, skewMs = 0) {
  return session.expiresAt <= Date.now() + Math.max(0, skewMs);
}

async function exchangeRefreshToken(
  config: RuntimeConfig,
  refreshToken: string,
): Promise<OidcTokenResponse> {
  if (!config.authOidcTokenUrl || !config.authOidcClientId) {
    throw new Error('OIDC refresh requires token URL and client ID.');
  }

  const body = new URLSearchParams();
  body.set('grant_type', 'refresh_token');
  body.set('client_id', config.authOidcClientId);
  body.set('refresh_token', refreshToken);

  const response = await fetch(config.authOidcTokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`OIDC refresh token exchange failed (${response.status}).`);
  }

  const payload = (await response.json()) as OidcTokenResponse;
  if (!payload.access_token) {
    throw new Error('OIDC refresh response did not include an access token.');
  }

  return payload;
}

function createMockSession(): AuthSession {
  return {
    accessToken: 'mock-access-token',
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    user: {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@example.com',
      roles: ['viewer'],
      tenantId: resolveTenantId(),
    },
  };
}

export function createMockAuthClient(): AuthClient {
  const listeners = new Set<SessionListener>();

  const emit = (session: AuthSession | null) => {
    listeners.forEach((listener) => {
      listener(session);
    });
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key === AUTH_SESSION_STORAGE_KEY) {
      emit(readSession());
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  return {
    async getSession() {
      const session = readSession();
      if (!session) {
        return null;
      }

      if (session.expiresAt <= Date.now()) {
        writeSession(null);
        return null;
      }

      return session;
    },
    async signIn() {
      const session = createMockSession();
      writeSession(session);
      emit(session);
    },
    async signOut() {
      writeSession(null);
      emit(null);
    },
    subscribe(listener: SessionListener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function createOidcAuthClient(config: RuntimeConfig): AuthClient {
  const listeners = new Set<SessionListener>();

  const emit = (session: AuthSession | null) => {
    listeners.forEach((listener) => {
      listener(session);
    });
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key === AUTH_SESSION_STORAGE_KEY) {
      emit(readSession());
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  const signIn = async () => {
    if (!config.authOidcAuthorizeUrl || !config.authOidcClientId || !config.authOidcTokenUrl) {
      throw new Error(
        'OIDC is enabled but required auth config is missing (authorize URL, token URL, client ID).',
      );
    }

    if (typeof window === 'undefined') {
      throw new Error('OIDC sign-in can only run in a browser.');
    }

    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('OIDC sign-in requires Web Crypto support.');
    }

    const state = createRandomUrlSafeString(16);
    const codeVerifier = createRandomUrlSafeString(64);
    const codeChallenge = await createCodeChallenge(codeVerifier);
    const redirectUri = resolveOidcRedirectUri(config);

    writeOidcTransaction({
      codeVerifier,
      state,
      returnTo: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    });

    const authorizeUrl = new URL(config.authOidcAuthorizeUrl);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('client_id', config.authOidcClientId);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('scope', config.authOidcScope);
    authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('code_challenge', codeChallenge);
    authorizeUrl.searchParams.set('code_challenge_method', 'S256');
    if (config.authOidcAudience) {
      authorizeUrl.searchParams.set('audience', config.authOidcAudience);
    }

    emitTelemetry('info', 'auth.signin.redirect_started', {
      provider: 'oidc',
      redirectUri,
    });
    window.location.assign(authorizeUrl.toString());
  };

  const signOut = async () => {
    writeSession(null);
    writeOidcTransaction(null);
    emit(null);

    if (!config.authOidcLogoutUrl || typeof window === 'undefined') {
      return;
    }

    const logoutUrl = new URL(config.authOidcLogoutUrl);
    const redirectUri = resolveOidcPostLogoutRedirectUri(config);
    if (redirectUri) {
      logoutUrl.searchParams.set('post_logout_redirect_uri', redirectUri);
    }
    emitTelemetry('info', 'auth.signout.redirect_started', {
      provider: 'oidc',
      redirectUri,
    });
    window.location.assign(logoutUrl.toString());
  };

  const getSession = async () => {
    const session = readSession();
    if (session && !isSessionExpired(session, SESSION_REFRESH_SKEW_MS)) {
      return session;
    }

    if (session?.refreshToken && isSessionExpired(session, SESSION_REFRESH_SKEW_MS)) {
      try {
        const tokenResponse = await exchangeRefreshToken(config, session.refreshToken);
        const refreshedSession = buildOidcSessionFromTokens(config, tokenResponse, session);
        writeSession(refreshedSession);
        emit(refreshedSession);
        emitTelemetry('info', 'auth.session.refresh_succeeded', {
          provider: 'oidc',
          expiresAt: refreshedSession.expiresAt,
        });
        return refreshedSession;
      } catch (error) {
        writeSession(null);
        writeOidcTransaction(null);
        emit(null);
        reportError('auth.session.refresh_failed', error, {
          provider: 'oidc',
        });
        throw new Error('Authentication session expired. Please sign in again.');
      }
    }

    if (session && isSessionExpired(session)) {
      writeSession(null);
    }

    if (typeof window === 'undefined') {
      return null;
    }

    const currentUrl = new URL(window.location.href);
    const code = currentUrl.searchParams.get('code');
    const state = currentUrl.searchParams.get('state');
    const authError = currentUrl.searchParams.get('error');

    if (authError) {
      writeOidcTransaction(null);
      sanitizeOidcCallbackParams();
      const description = currentUrl.searchParams.get('error_description') || authError;
      reportError('auth.callback.failed', new Error(`OIDC sign-in failed: ${description}`), {
        provider: 'oidc',
      });
      throw new Error(`OIDC sign-in failed: ${description}`);
    }

    if (!code || !state) {
      return null;
    }

    if (!config.authOidcTokenUrl || !config.authOidcClientId) {
      sanitizeOidcCallbackParams();
      reportError('auth.callback.failed', new Error('OIDC callback config missing'), {
        provider: 'oidc',
      });
      throw new Error('OIDC callback received, but token exchange config is missing.');
    }

    const transaction = readOidcTransaction();
    if (!transaction || transaction.state !== state) {
      writeOidcTransaction(null);
      sanitizeOidcCallbackParams();
      reportError('auth.callback.failed', new Error('OIDC state validation failed'), {
        provider: 'oidc',
      });
      throw new Error('OIDC state validation failed.');
    }

    const redirectUri = resolveOidcRedirectUri(config);
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('client_id', config.authOidcClientId);
    body.set('code', code);
    body.set('redirect_uri', redirectUri);
    body.set('code_verifier', transaction.codeVerifier);

    const response = await fetch(config.authOidcTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      writeOidcTransaction(null);
      sanitizeOidcCallbackParams();
      reportError(
        'auth.callback.failed',
        new Error(`OIDC token exchange failed (${response.status})`),
        {
          provider: 'oidc',
          httpStatus: response.status,
        },
      );
      throw new Error(`OIDC token exchange failed (${response.status}).`);
    }

    const tokenResponse = (await response.json()) as OidcTokenResponse;
    if (!tokenResponse.access_token) {
      writeOidcTransaction(null);
      sanitizeOidcCallbackParams();
      reportError('auth.callback.failed', new Error('OIDC token response missing access token'), {
        provider: 'oidc',
      });
      throw new Error('OIDC token response did not include an access token.');
    }

    const nextSession = buildOidcSessionFromTokens(config, tokenResponse);
    writeSession(nextSession);
    writeOidcTransaction(null);
    sanitizeOidcCallbackParams();
    emit(nextSession);
    emitTelemetry('info', 'auth.signin.succeeded', {
      provider: 'oidc',
      userId: nextSession.user.id,
      roleCount: nextSession.user.roles.length,
      hasTenant: Boolean(nextSession.user.tenantId),
      expiresAt: nextSession.expiresAt,
    });

    return nextSession;
  };

  return {
    getSession,
    signIn,
    signOut,
    subscribe(listener: SessionListener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function createAuthClient(config = getRuntimeConfig()): AuthClient {
  if (config.authProvider === 'oidc') {
    return createOidcAuthClient(config);
  }

  return createMockAuthClient();
}
