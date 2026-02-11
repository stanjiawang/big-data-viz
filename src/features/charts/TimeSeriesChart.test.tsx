import { render, screen } from '@testing-library/react';
import { API_SCHEMA_VERSION } from '@/lib/contracts';
import { TimeSeriesChart } from '@/features/charts/TimeSeriesChart';

jest.mock('echarts/core', () => ({
  use: jest.fn(),
  init: jest.fn(() => ({
    setOption: jest.fn(),
    resize: jest.fn(),
    dispose: jest.fn(),
  })),
}));

jest.mock('echarts/charts', () => ({
  LineChart: jest.fn(),
}));

jest.mock('echarts/components', () => ({
  GridComponent: jest.fn(),
  TooltipComponent: jest.fn(),
  LegendComponent: jest.fn(),
}));

jest.mock('echarts/renderers', () => ({
  CanvasRenderer: jest.fn(),
}));

describe('TimeSeriesChart', () => {
  it('shows loading overlay', () => {
    render(<TimeSeriesChart data={undefined} isLoading />);
    expect(screen.getByText('Loading time series...')).toBeInTheDocument();
  });

  it('shows empty overlay when no points', () => {
    render(
      <TimeSeriesChart
        data={{ schemaVersion: API_SCHEMA_VERSION, metric: 'ingestion', points: [] }}
      />,
    );
    expect(screen.getByText('No time-series data.')).toBeInTheDocument();
  });
});
