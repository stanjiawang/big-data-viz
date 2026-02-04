import { render, screen } from '@testing-library/react';
import App from '@/app/App';

jest.mock('@/features/dashboard/DashboardPage', () => ({
  DashboardPage: () => <div>DashboardPage</div>,
}));

describe('App', () => {
  it('renders dashboard', () => {
    render(<App />);
    expect(screen.getByText('DashboardPage')).toBeInTheDocument();
  });
});
