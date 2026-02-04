import { render, screen } from '@testing-library/react';
import { PageHeader } from '@/components/layout/PageHeader';

describe('PageHeader', () => {
  it('renders title and subtitle', () => {
    render(<PageHeader title="Big Data Viz" subtitle="Analytics" />);
    expect(screen.getByText('Big Data Viz')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });
});
