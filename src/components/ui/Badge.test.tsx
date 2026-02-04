import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders label', () => {
    render(<Badge label="Dataset Size: 1M" />);
    expect(screen.getByText('Dataset Size: 1M')).toBeInTheDocument();
  });
});
