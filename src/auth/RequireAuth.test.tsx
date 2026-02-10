import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/auth/AuthProvider';
import { RequireAuth } from '@/auth/RequireAuth';

describe('RequireAuth', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

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
});
