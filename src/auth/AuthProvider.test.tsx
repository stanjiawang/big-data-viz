import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/auth/AuthProvider';
import type { AuthSession } from '@/auth/types';
import { useAuth } from '@/auth/useAuth';

const mockGetSession = jest.fn<Promise<AuthSession | null>, []>();
const mockSignIn = jest.fn<Promise<void>, []>();
const mockSignOut = jest.fn<Promise<void>, []>();
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();

let subscriptionListener: ((_session: AuthSession | null) => void) | undefined;
let consoleErrorSpy: jest.SpyInstance;

jest.mock('@/auth/authClient', () => ({
  createAuthClient: () => ({
    getSession: mockGetSession,
    signIn: mockSignIn,
    signOut: mockSignOut,
    subscribe: mockSubscribe,
  }),
}));

jest.mock('@/config/runtimeConfig', () => ({
  getRuntimeConfig: () => ({
    authProvider: 'mock',
  }),
}));

jest.mock('@/lib/telemetry', () => ({
  emitTelemetry: jest.fn(),
  reportError: jest.fn(),
}));

function createSession(overrides?: Partial<AuthSession>): AuthSession {
  return {
    accessToken: 'token-1',
    expiresAt: Date.now() + 60_000,
    user: {
      id: 'user-1',
      name: 'Analyst User',
      email: 'analyst@example.com',
      roles: ['analyst'],
      tenantId: 'tenant-1',
    },
    ...overrides,
  };
}

function AuthProbe() {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="is-loading">{String(auth.isLoading)}</div>
      <div data-testid="is-authenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="error">{auth.error ?? ''}</div>
      <div data-testid="has-analyst">{String(auth.hasAnyRole(['analyst']))}</div>
      <div data-testid="has-tenant">{String(auth.hasTenantContext())}</div>
      <button
        type="button"
        onClick={() => void auth.signIn({ email: 'analyst@example.com', password: 'bad' })}
      >
        Trigger sign in
      </button>
      <button type="button" onClick={() => void auth.signOut()}>
        Trigger sign out
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const originalConsoleError = console.error;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const message = String(args[0] ?? '');
      if (message.includes('not wrapped in act')) {
        return;
      }

      originalConsoleError(...(args as Parameters<typeof console.error>));
    });
    subscriptionListener = undefined;
    mockSubscribe.mockImplementation((listener: (_session: AuthSession | null) => void) => {
      subscriptionListener = listener;
      return mockUnsubscribe;
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.useRealTimers();
  });

  it('stays unauthenticated when auth is disabled', async () => {
    render(
      <AuthProvider enabled={false}>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it('loads session and exposes role and tenant helpers', async () => {
    mockGetSession.mockResolvedValue(createSession());

    render(
      <AuthProvider enabled>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });
    expect(screen.getByTestId('has-analyst')).toHaveTextContent('true');
    expect(screen.getByTestId('has-tenant')).toHaveTextContent('true');
  });

  it('updates session from auth subscription listener', async () => {
    mockGetSession.mockResolvedValue(null);

    render(
      <AuthProvider enabled>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    await act(async () => {
      subscriptionListener?.(createSession());
    });

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
  });

  it('shows expired-session error when session load fails with expired message', async () => {
    mockGetSession.mockRejectedValue(new Error('session expired'));

    render(
      <AuthProvider enabled>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Session expired. Sign in again to continue.',
      );
    });
  });

  it('shows error when sign-in fails', async () => {
    const user = userEvent.setup();
    mockGetSession.mockResolvedValue(null);
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <AuthProvider enabled>
        <AuthProbe />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Trigger sign in' }));

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
    });
  });

  it('shows fallback error when sign-out fails', async () => {
    const user = userEvent.setup();
    mockGetSession.mockResolvedValue(createSession());
    mockSignOut.mockRejectedValue(new Error('network down'));

    render(
      <AuthProvider enabled>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    await user.click(screen.getByRole('button', { name: 'Trigger sign out' }));

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Sign-out failed. Please try again.');
    });
  });

  it('clears session when refresh fails due to expiry', async () => {
    jest.useFakeTimers();
    mockGetSession
      .mockResolvedValueOnce(createSession({ expiresAt: Date.now() + 1_000 }))
      .mockRejectedValueOnce(new Error('token expired'));

    render(
      <AuthProvider enabled>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Session expired. Sign in again to continue.',
      );
    });
  });
});
