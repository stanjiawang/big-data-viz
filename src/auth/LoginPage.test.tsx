import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '@/app/providers/AppProviders';
import { LoginPage } from '@/auth/LoginPage';
import { useAuth } from '@/auth/useAuth';

jest.mock('@/auth/useAuth');
jest.mock('@/components/ui/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));
jest.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

describe('LoginPage', () => {
  const signInMock = jest.fn().mockResolvedValue(undefined);

  function renderPage() {
    return render(
      <MemoryRouter>
        <AppProviders>
          <LoginPage />
        </AppProviders>
      </MemoryRouter>,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    signInMock.mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      signIn: signInMock,
      error: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('renders provider buttons and triggers federated sign in', async () => {
    const user = userEvent.setup();
    renderPage();

    const oktaButton = await screen.findByRole('button', { name: /Okta/i });
    await user.click(oktaButton);

    expect(signInMock).toHaveBeenCalledWith();
  });

  it('submits email credentials when form is submitted', async () => {
    const user = userEvent.setup();
    renderPage();

    const emailInput = await screen.findByLabelText('Email');
    const passwordInput = await screen.findByLabelText('Password');
    await user.clear(emailInput);
    await user.type(emailInput, 'tester@example.com');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'Secret123!');

    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(signInMock).toHaveBeenCalledWith({
      email: 'tester@example.com',
      password: 'Secret123!',
    });
  });
});
