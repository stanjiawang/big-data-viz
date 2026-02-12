import { render, screen } from '@testing-library/react';
import { BarChart } from '@/features/charts/BarChart';

const setOptionMock = jest.fn();

jest.mock('echarts/core', () => ({
  use: jest.fn(),
  init: jest.fn(() => ({
    setOption: setOptionMock,
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
  beforeEach(() => {
    setOptionMock.mockClear();
  });

  it('shows error overlay', () => {
    render(<BarChart title="Source Volume" categories={['user']} values={[1]} isError />);
    expect(screen.getByText('Failed to load chart.')).toBeInTheDocument();
  });

  it('shows empty overlay when no categories', () => {
    render(<BarChart title="Source Volume" categories={[]} values={[]} />);
    expect(screen.getByText('No chart data.')).toBeInTheDocument();
  });

  it('applies x-range slicing to visible categories and values', () => {
    render(
      <BarChart
        title="Source Volume"
        categories={['A', 'B', 'C', 'D', 'E']}
        values={[10, 20, 30, 40, 50]}
        xStartPercent={40}
        xEndPercent={80}
      />,
    );

    const lastCall = setOptionMock.mock.calls.at(-1)?.[0];
    expect(lastCall?.xAxis?.data).toEqual(['B', 'C', 'D']);
    expect(lastCall?.series?.[0]?.data).toEqual([20, 30, 40]);
  });
});
