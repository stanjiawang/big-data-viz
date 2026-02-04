import { render, screen } from '@testing-library/react';
import { DashboardHeaderBadges } from '@/features/dashboard/DashboardHeaderBadges';

describe('DashboardHeaderBadges', () => {
  it('renders skeletons when loading', () => {
    const { container } = render(<DashboardHeaderBadges items={['A', 'B']} isLoading={true} />);

    expect(screen.queryByText('A')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders badges when loaded', () => {
    render(<DashboardHeaderBadges items={['A', 'B']} isLoading={false} />);

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});
