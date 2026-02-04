import { render, screen } from '@testing-library/react';
import { KpiCard } from '@/components/ui/KpiCard';

describe('KpiCard', () => {
  it('renders label, value, and helper', () => {
    render(<KpiCard label="Total Records" value="1,000,000" helper="Across sources" />);
    expect(screen.getByText('Total Records')).toBeInTheDocument();
    expect(screen.getByText('1,000,000')).toBeInTheDocument();
    expect(screen.getByText('Across sources')).toBeInTheDocument();
  });

  it('renders trend when provided', () => {
    render(<KpiCard label="Anomaly Rate" value="0.34%" trend="-0.08%" />);
    expect(screen.getByText('-0.08%')).toBeInTheDocument();
  });
});
