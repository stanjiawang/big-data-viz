import { useAuth } from '@/auth/useAuth';

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
        <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Sign in required</h1>
          <p className="text-sm text-slate-600">
            Authentication is enabled for this environment. Sign in to access the dashboard.
          </p>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button
            type="button"
            className="rounded-full border border-blue-500 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            onClick={() => void signIn()}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (requireTenant && !hasTenantContext()) {
    return (
      <div className={PANEL_CLASS}>
        <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Tenant context required</h1>
          <p className="text-sm text-slate-600">
            Signed in as <span className="font-medium">{session?.user.name ?? 'unknown user'}</span>
            , but no tenant is attached to this session.
          </p>
          <button
            type="button"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={() => void signOut()}
          >
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
          <h1 className="text-lg font-semibold text-slate-900">Insufficient permissions</h1>
          <p className="text-sm text-slate-600">
            Signed in as <span className="font-medium">{session?.user.name ?? 'unknown user'}</span>
            , but required roles are missing.
          </p>
          <button
            type="button"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
