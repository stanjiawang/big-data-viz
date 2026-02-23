import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AUTH_SESSION_STORAGE_KEY } from '@/auth/authClient';
import { AuthProvider } from '@/auth/AuthProvider';
import { RequireAuth } from '@/auth/RequireAuth';

describe('RequireAuth', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  function setSession(roles: string[], tenantId?: string) {
    window.sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken: 'test-token',
        expiresAt: Date.now() + 60_000,
        user: {
          id: 'demo-user',
          name: 'Demo User',
          roles,
          tenantId,
        },
      }),
    );
  }

  it('renders children when auth is disabled', () => {
    render(
      <MemoryRouter>
        <AuthProvider enabled={false}>
          <RequireAuth enabled={false}>
            <div>Protected Content</div>
          </RequireAuth>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  function renderProtectedRoute(options?: {
    requireTenant?: boolean;
    requiredRoles?: string[];
    authEnabled?: boolean;
  }) {
    const { requireTenant = false, requiredRoles = [], authEnabled = true } = options ?? {};
    return render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider enabled={authEnabled}>
          <Routes>
            <Route
              path="/protected"
              element={
                <RequireAuth
                  enabled={authEnabled}
                  requireTenant={requireTenant}
                  requiredRoles={requiredRoles}
                >
                  <div>Protected Content</div>
                </RequireAuth>
              }
            />
            <Route path="/login" element={<div>Login Route</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
  }

  it('redirects to login route when auth is enabled and no session exists', async () => {
    renderProtectedRoute();

    expect(await screen.findByText('Login Route')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows protected content when a session exists', async () => {
    setSession(['viewer'], 'tenant-1');

    renderProtectedRoute();

    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
  });

  it('blocks access when required role is missing', async () => {
    setSession(['viewer'], 'tenant-1');

    renderProtectedRoute({ requiredRoles: ['admin'] });

    expect(await screen.findByText('Insufficient permissions')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('blocks access when tenant is required but session has no tenant', async () => {
    setSession(['admin']);

    renderProtectedRoute({ requireTenant: true });

    expect(await screen.findByText('Tenant context required')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
