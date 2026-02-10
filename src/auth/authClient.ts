import type { AuthSession } from '@/auth/types';

type SessionListener = (_session: AuthSession | null) => void;

export type AuthClient = {
  getSession: () => Promise<AuthSession | null>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  subscribe: (_listener: SessionListener) => () => void;
};

const SESSION_KEY = 'bdv.auth.session';

function readSession(): AuthSession | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
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
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
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
    if (event.key === SESSION_KEY) {
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
