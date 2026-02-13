import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = 'light';
  });

  it('defaults to light and switches to dark', async () => {
    const user = userEvent.setup();

    render(<ThemeToggle />);

    expect(screen.getByRole('button', { name: 'Switch color theme' })).toHaveTextContent(
      'Theme: Light',
    );

    await user.click(screen.getByRole('button', { name: 'Switch color theme' }));

    expect(screen.getByRole('button', { name: 'Switch color theme' })).toHaveTextContent(
      'Theme: Dark',
    );
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('bdv_theme')).toBe('dark');
  });
});
