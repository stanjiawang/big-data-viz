import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DetailButton, RangeSummary } from '@/features/dashboard/sections/shared';

describe('dashboard/sections/shared', () => {
  it('renders detail button and invokes callback', async () => {
    const onClick = jest.fn();
    render(<DetailButton onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Open detail' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders range summary with explicit values', () => {
    render(<RangeSummary xStart={10} xEnd={85} yMin="5" yMax="100" />);
    expect(screen.getByText('X: 10% - 85% | Y: 5 - 100')).toBeInTheDocument();
  });

  it('renders auto placeholders when y bounds are empty', () => {
    render(<RangeSummary xStart={0} xEnd={100} yMin="" yMax="" />);
    expect(screen.getByText('X: 0% - 100% | Y: auto - auto')).toBeInTheDocument();
  });
});
