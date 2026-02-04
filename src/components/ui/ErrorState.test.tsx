import { render, screen } from '@testing-library/react';
import { ErrorState } from '@/components/ui/ErrorState';

describe('ErrorState', () => {
  it('renders default copy', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Please try again.')).toBeInTheDocument();
  });

  it('renders custom copy and retry info', () => {
    render(<ErrorState title="Failed" message="Try later" retryCount={2} nextRetryInSeconds={5} />);

    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Try later')).toBeInTheDocument();
    expect(screen.getByText('Retries: 2')).toBeInTheDocument();
    expect(screen.getByText('Retrying in 5s')).toBeInTheDocument();
  });
});
