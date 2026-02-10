import type { AuthSession } from '@/auth/types';

type SessionListener = (_session: AuthSession | null) => void;

export type AuthClient = {
  getSession: () => Promise<AuthSession | null>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  subscribe: (_listener: SessionListener) => () => void;
};

export const AUTH_SESSION_STORAGE_KEY = 'bdv.auth.session';

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

function resolveTenantId() {
  if (typeof __APP_AUTH_TENANT_ID__ !== 'undefined' && __APP_AUTH_TENANT_ID__) {
    return __APP_AUTH_TENANT_ID__.trim();
  }

  return 'tenant-demo';
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
