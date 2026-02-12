import { useEffect, useMemo, useState } from 'react';
import { createAuthClient } from '@/auth/authClient';
import { AuthContext } from '@/auth/AuthContext';
import type { AuthContextValue, AuthSession, AuthSignInInput } from '@/auth/types';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { emitTelemetry, reportError } from '@/lib/telemetry';
const SESSION_REFRESH_SKEW_MS = 30_000;

export function AuthProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const authClient = useMemo(() => createAuthClient(getRuntimeConfig()), []);

  useEffect(() => {
    if (!enabled) {
      setSession(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let active = true;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const nextSession = await authClient.getSession();
        if (active) {
          setSession(nextSession);
        }
      } catch (authError) {
        reportError('auth.session.load_failed', authError, {
          provider: getRuntimeConfig().authProvider,
        });
        if (active) {
          if (authError instanceof Error && authError.message.includes('expired')) {
            setError('Session expired. Sign in again to continue.');
          } else {
            setError('Failed to load authentication session.');
          }
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void run();

    const unsubscribe = authClient.subscribe((nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [enabled, authClient]);

  useEffect(() => {
    if (!enabled || !session) {
      return;
    }

    const refreshInMs = Math.max(0, session.expiresAt - Date.now() - SESSION_REFRESH_SKEW_MS);
    const timer = window.setTimeout(() => {
      void authClient
        .getSession()
        .then((nextSession) => {
          setSession(nextSession);
        })
        .catch((authError: unknown) => {
          reportError('auth.session.refresh_failed', authError, {
            provider: getRuntimeConfig().authProvider,
          });
          if (authError instanceof Error && authError.message.includes('expired')) {
            setError('Session expired. Sign in again to continue.');
          } else {
            setError('Failed to refresh authentication session.');
          }
          setSession(null);
        });
    }, refreshInMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [enabled, session, authClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      error,
      isAuthenticated: Boolean(session),
      signIn: async (credentials?: AuthSignInInput) => {
        setError(null);
        emitTelemetry('info', 'auth.signin.requested', {
          provider: getRuntimeConfig().authProvider,
        });
        try {
          await authClient.signIn(credentials);
        } catch (authError) {
          reportError('auth.signin.failed', authError, {
            provider: getRuntimeConfig().authProvider,
          });
          if (authError instanceof Error) {
            setError(authError.message);
          } else {
            setError('Sign-in failed. Please try again.');
          }
        }
      },
      signOut: async () => {
        setError(null);
        emitTelemetry('info', 'auth.signout.requested', {
          provider: getRuntimeConfig().authProvider,
        });
        try {
          await authClient.signOut();
        } catch (authError) {
          reportError('auth.signout.failed', authError, {
            provider: getRuntimeConfig().authProvider,
          });
          setError('Sign-out failed. Please try again.');
        }
      },
      hasAnyRole: (roles) => {
        if (!session || roles.length === 0) {
          return false;
        }
        return roles.some((role) => session.user.roles.includes(role));
      },
      hasTenantContext: () => Boolean(session?.user.tenantId),
    }),
    [session, isLoading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
