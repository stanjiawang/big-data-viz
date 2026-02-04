import { render, screen } from '@testing-library/react';
import { PieChart } from '@/features/charts/PieChart';

jest.mock('echarts/core', () => ({
  use: jest.fn(),
  init: jest.fn(() => ({
    setOption: jest.fn(),
    resize: jest.fn(),
    dispose: jest.fn(),
  })),
}));

jest.mock('echarts/charts', () => ({
  PieChart: jest.fn(),
}));

jest.mock('echarts/components', () => ({
  LegendComponent: jest.fn(),
  TooltipComponent: jest.fn(),
}));

jest.mock('echarts/renderers', () => ({
  CanvasRenderer: jest.fn(),
}));

describe('PieChart', () => {
  it('shows loading overlay', () => {
    render(<PieChart title="Labels" data={[]} isLoading />);
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('shows empty overlay when no data', () => {
    render(<PieChart title="Labels" data={[]} />);
    expect(screen.getByText('No chart data.')).toBeInTheDocument();
  });

  it('hides overlay when data exists', () => {
    render(<PieChart title="Labels" data={[{ name: 'A', value: 1 }]} />);
    expect(screen.queryByText('No chart data.')).not.toBeInTheDocument();
  });
});
