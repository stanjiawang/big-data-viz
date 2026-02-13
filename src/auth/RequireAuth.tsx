import { useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { MOCK_AUTH_ACCOUNTS } from '@/auth/authClient';
import {
  UI_BUTTON_GHOST_SM,
  UI_BUTTON_PRIMARY_SM,
  UI_INPUT_MD,
  UI_LABEL_CLASS,
  UI_TEXT_BODY_SM,
  UI_TEXT_SUBTITLE,
  UI_TEXT_TITLE_MD,
} from '@/components/ui/styleTokens';
import { getRuntimeConfig } from '@/config/runtimeConfig';

const PANEL_CLASS =
  'mx-auto flex min-h-[50vh] w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8';

export function RequireAuth({
  enabled,
  requiredRoles = [],
  requireTenant = false,
  children,
}: {
  enabled: boolean;
  requiredRoles?: string[];
  requireTenant?: boolean;
  children: React.ReactNode;
}) {
  const {
    isLoading,
    isAuthenticated,
    hasAnyRole,
    hasTenantContext,
    signIn,
    signOut,
    error,
    session,
  } = useAuth();
  const [email, setEmail] = useState(MOCK_AUTH_ACCOUNTS[0]?.email ?? '');
  const [password, setPassword] = useState(MOCK_AUTH_ACCOUNTS[0]?.password ?? '');
  const authProvider = getRuntimeConfig().authProvider;

  if (!enabled) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className={PANEL_CLASS}>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading authentication...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={PANEL_CLASS}>
        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-6 py-5 text-white">
            <h1 className="text-lg font-semibold text-white">Sign in required</h1>
            <p className="mt-1 text-sm text-blue-100">
              Authentication is enabled for this environment. Sign in to access the dashboard.
            </p>
          </div>
          <div className="space-y-4 p-6">
            {authProvider === 'mock' ? (
              <>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                  Mock account:
                  <span className="ml-2 font-semibold">{MOCK_AUTH_ACCOUNTS[0]?.email}</span>
                  <span className="ml-2 font-semibold">{MOCK_AUTH_ACCOUNTS[0]?.password}</span>
                </div>
                <label className="block space-y-1 text-sm text-slate-700">
                  <span className={UI_LABEL_CLASS}>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={UI_INPUT_MD}
                    autoComplete="username"
                  />
                </label>
                <label className="block space-y-1 text-sm text-slate-700">
                  <span className={UI_LABEL_CLASS}>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={UI_INPUT_MD}
                    autoComplete="current-password"
                  />
                </label>
                <button
                  type="button"
                  className={`${UI_BUTTON_PRIMARY_SM} w-full`}
                  onClick={() =>
                    void signIn({
                      email,
                      password,
                    })
                  }
                >
                  Sign in
                </button>
              </>
            ) : (
              <button
                type="button"
                className={`${UI_BUTTON_PRIMARY_SM} w-full`}
                onClick={() => void signIn()}
              >
                Continue with SSO
              </button>
            )}
            {error ? <p className={`${UI_TEXT_BODY_SM} text-rose-600`}>{error}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  if (requireTenant && !hasTenantContext()) {
    return (
      <div className={PANEL_CLASS}>
        <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className={UI_TEXT_TITLE_MD}>Tenant context required</h1>
          <p className={UI_TEXT_SUBTITLE}>
            Signed in as <span className="font-medium">{session?.user.name ?? 'unknown user'}</span>
            , but no tenant is attached to this session.
          </p>
          <button type="button" className={UI_BUTTON_GHOST_SM} onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <div className={PANEL_CLASS}>
        <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className={UI_TEXT_TITLE_MD}>Insufficient permissions</h1>
          <p className={UI_TEXT_SUBTITLE}>
            Signed in as <span className="font-medium">{session?.user.name ?? 'unknown user'}</span>
            , but required roles are missing.
          </p>
          <button type="button" className={UI_BUTTON_GHOST_SM} onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
