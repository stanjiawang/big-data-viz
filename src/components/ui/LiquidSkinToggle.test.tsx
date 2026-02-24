import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LiquidSkinToggle } from '@/components/ui/LiquidSkinToggle';

describe('LiquidSkinToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.liquid;
  });

  it('defaults to off and toggles on', async () => {
    const user = userEvent.setup();

    render(<LiquidSkinToggle />);

    const button = screen.getByRole('button', { name: 'Toggle liquid glass styling' });
    expect(button).toHaveTextContent('Liquid skin: Off');

    await user.click(button);

    expect(button).toHaveTextContent('Liquid skin: On');
    expect(document.documentElement.dataset.liquid).toBe('on');
    expect(window.localStorage.getItem('bdv_liquid_skin')).toBe('on');
  });
});
