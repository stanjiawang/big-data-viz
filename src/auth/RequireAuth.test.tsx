import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AUTH_SESSION_STORAGE_KEY } from '@/auth/authClient';
import { AuthProvider } from '@/auth/AuthProvider';
import { RequireAuth } from '@/auth/RequireAuth';

describe('RequireAuth', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  function setSession(roles: string[], tenantId?: string) {
    window.localStorage.setItem(
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
      <AuthProvider enabled={false}>
        <RequireAuth enabled={false}>
          <div>Protected Content</div>
        </RequireAuth>
      </AuthProvider>,
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('requires sign in when auth is enabled and no session exists', async () => {
    render(
      <AuthProvider enabled>
        <RequireAuth enabled>
          <div>Protected Content</div>
        </RequireAuth>
      </AuthProvider>,
    );

    expect(await screen.findByText('Sign in required')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows protected content after signing in', async () => {
    render(
      <AuthProvider enabled>
        <RequireAuth enabled>
          <div>Protected Content</div>
        </RequireAuth>
      </AuthProvider>,
    );

    const signInButton = await screen.findByRole('button', { name: 'Sign in' });
    await userEvent.click(signInButton);

    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
  });

  it('blocks access when required role is missing', async () => {
    setSession(['viewer'], 'tenant-1');

    render(
      <AuthProvider enabled>
        <RequireAuth enabled requiredRoles={['admin']}>
          <div>Protected Content</div>
        </RequireAuth>
      </AuthProvider>,
    );

    expect(await screen.findByText('Insufficient permissions')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('blocks access when tenant is required but session has no tenant', async () => {
    setSession(['admin']);

    render(
      <AuthProvider enabled>
        <RequireAuth enabled requireTenant>
          <div>Protected Content</div>
        </RequireAuth>
      </AuthProvider>,
    );

    expect(await screen.findByText('Tenant context required')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
