import { render, screen } from '@testing-library/react';
import { BarChart } from '@/features/charts/BarChart';

jest.mock('echarts/core', () => ({
  use: jest.fn(),
  init: jest.fn(() => ({
    setOption: jest.fn(),
    resize: jest.fn(),
    dispose: jest.fn(),
  })),
}));

jest.mock('echarts/charts', () => ({
  BarChart: jest.fn(),
}));

jest.mock('echarts/components', () => ({
  GridComponent: jest.fn(),
  TooltipComponent: jest.fn(),
  LegendComponent: jest.fn(),
}));

jest.mock('echarts/renderers', () => ({
  CanvasRenderer: jest.fn(),
}));

describe('BarChart', () => {
  it('shows error overlay', () => {
    render(<BarChart title="Source Volume" categories={['user']} values={[1]} isError />);
    expect(screen.getByText('Failed to load chart.')).toBeInTheDocument();
  });

  it('shows empty overlay when no categories', () => {
    render(<BarChart title="Source Volume" categories={[]} values={[]} />);
    expect(screen.getByText('No chart data.')).toBeInTheDocument();
  });
});
