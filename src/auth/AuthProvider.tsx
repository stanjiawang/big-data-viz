import { useEffect, useMemo, useState } from 'react';
import { createAuthClient } from '@/auth/authClient';
import { AuthContext } from '@/auth/AuthContext';
import type { AuthContextValue, AuthSession } from '@/auth/types';
import { getRuntimeConfig } from '@/config/runtimeConfig';

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
      } catch {
        if (active) {
          setError('Failed to load authentication session.');
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
  }, [enabled]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      error,
      isAuthenticated: Boolean(session),
      signIn: async () => {
        setError(null);
        try {
          await authClient.signIn();
        } catch {
          setError('Sign-in failed. Please try again.');
        }
      },
      signOut: async () => {
        setError(null);
        try {
          await authClient.signOut();
        } catch {
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
