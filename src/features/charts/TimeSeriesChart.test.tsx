import { render, screen } from '@testing-library/react';
import { API_SCHEMA_VERSION } from '@/lib/contracts';
import { TimeSeriesChart } from '@/features/charts/TimeSeriesChart';

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
  beforeEach(() => {
    setOptionMock.mockClear();
  });

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

  it('applies x-range slicing to rendered points', () => {
    render(
      <TimeSeriesChart
        data={{
          schemaVersion: API_SCHEMA_VERSION,
          metric: 'ingestion',
          points: [
            { timestamp: '2026-01-01T00:00:00.000Z', value: 10 },
            { timestamp: '2026-01-02T00:00:00.000Z', value: 20 },
            { timestamp: '2026-01-03T00:00:00.000Z', value: 30 },
            { timestamp: '2026-01-04T00:00:00.000Z', value: 40 },
            { timestamp: '2026-01-05T00:00:00.000Z', value: 50 },
          ],
        }}
        xStartPercent={40}
        xEndPercent={80}
      />,
    );

    const lastCall = setOptionMock.mock.calls.at(-1)?.[0];
    expect(lastCall?.xAxis?.data).toEqual(['2026-01-02', '2026-01-03', '2026-01-04']);
    expect(lastCall?.series?.[0]?.data).toEqual([20, 30, 40]);
  });
});
