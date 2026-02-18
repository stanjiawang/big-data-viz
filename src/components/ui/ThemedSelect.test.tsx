import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemedSelect } from '@/components/ui/ThemedSelect';

describe('ThemedSelect', () => {
  const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'c', label: 'Gamma' },
  ];

  it('opens menu and selects an option', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <ThemedSelect ariaLabel="Example select" value="a" options={options} onChange={onChange} />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Example select' }));
    await user.click(screen.getByRole('option', { name: 'Gamma' }));

    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('closes menu on outside click', async () => {
    const user = userEvent.setup();
    render(
      <ThemedSelect ariaLabel="Outside close" value="a" options={options} onChange={() => {}} />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Outside close' }));
    expect(screen.getByRole('listbox', { name: 'Outside close' })).toBeInTheDocument();

    await user.click(document.body);
    expect(screen.queryByRole('listbox', { name: 'Outside close' })).not.toBeInTheDocument();
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    render(
      <ThemedSelect
        ariaLabel="Disabled select"
        value="a"
        options={options}
        disabled={true}
        onChange={() => {}}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Disabled select' }));
    expect(screen.queryByRole('listbox', { name: 'Disabled select' })).not.toBeInTheDocument();
  });
});
