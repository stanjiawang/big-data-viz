import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { D3EmbeddingScatter } from '@/features/charts/D3EmbeddingScatter';
import type { TrainingRecord } from '@/lib/types';

jest.mock('d3', () => {
  const chain: {
    selectAll: jest.Mock;
    remove: jest.Mock;
    attr: jest.Mock;
    append: jest.Mock;
    call: jest.Mock;
    style: jest.Mock;
    text: jest.Mock;
    on: jest.Mock;
    data: jest.Mock;
    enter: jest.Mock;
  } = {
    selectAll: jest.fn(),
    remove: jest.fn(),
    attr: jest.fn(),
    append: jest.fn(),
    call: jest.fn(),
    style: jest.fn(),
    text: jest.fn(),
    on: jest.fn(),
    data: jest.fn(),
    enter: jest.fn(),
  };
  chain.selectAll.mockImplementation(() => chain);
  chain.remove.mockImplementation(() => chain);
  chain.attr.mockImplementation(() => chain);
  chain.append.mockImplementation(() => chain);
  chain.call.mockImplementation(() => chain);
  chain.style.mockImplementation(() => chain);
  chain.text.mockImplementation(() => chain);
  chain.on.mockImplementation(() => chain);
  chain.data.mockImplementation(() => chain);
  chain.enter.mockImplementation(() => chain);

  const scaleLinear = () => {
    const fn = ((value: number) => value) as unknown as {
      (_value: number): number;
      domain: () => typeof fn;
      clamp: () => typeof fn;
      range: () => typeof fn;
    };
    fn.domain = () => fn;
    fn.clamp = () => fn;
    fn.range = () => fn;
    return fn;
  };

  const scaleOrdinal = () => {
    const fn = ((value: string) => value) as unknown as {
      (_value: string): string;
      domain: () => typeof fn;
      range: () => typeof fn;
    };
    fn.domain = () => fn;
    fn.range = () => fn;
    return fn;
  };

  const zoom: () => any = () => ({
    scaleExtent: () => zoom(),
    wheelDelta: () => zoom(),
    translateExtent: () => zoom(),
    on: () => zoom(),
  });

  const axis = () => {
    const fn = () => undefined;
    (fn as unknown as { ticks: () => typeof fn }).ticks = () => fn;
    (fn as unknown as { tickSizeOuter: () => typeof fn }).tickSizeOuter = () => fn;
    return fn;
  };

  return {
    select: jest.fn(() => chain),
    scaleLinear,
    scaleOrdinal,
    axisBottom: jest.fn(() => axis()),
    axisLeft: jest.fn(() => axis()),
    zoom,
    pointer: jest.fn(() => [0, 0]),
    schemeTableau10: ['#2563eb', '#7c3aed', '#16a34a'],
  };
});

const records: TrainingRecord[] = [
  {
    id: 'rec_1',
    timestamp: '2026-01-01T00:00:00Z',
    source: 'user',
    label: 'class-A',
    features: [0.2, -0.2, 0.4],
    weight: 1.1,
  },
  {
    id: 'rec_2',
    timestamp: '2026-01-02T00:00:00Z',
    source: 'sensor',
    label: 'class-B',
    features: [-0.4, 0.6, 0.1],
    weight: 0.9,
  },
];

describe('D3EmbeddingScatter', () => {
  it('renders loading, error and empty overlays', () => {
    const { rerender } = render(<D3EmbeddingScatter isLoading records={records} />);
    expect(screen.getByText('Loading D3 chart...')).toBeInTheDocument();

    rerender(<D3EmbeddingScatter isError records={records} />);
    expect(screen.getByText('Failed to load D3 chart.')).toBeInTheDocument();

    rerender(<D3EmbeddingScatter records={[]} />);
    expect(screen.getByText('No points for D3 chart.')).toBeInTheDocument();
  });

  it('supports label toggles and reset action', async () => {
    render(<D3EmbeddingScatter records={records} />);

    await userEvent.click(screen.getByRole('button', { name: 'class-A' }));
    await userEvent.click(screen.getByRole('button', { name: 'class-B' }));
    expect(screen.getByText('No points for selected labels.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reset view' }));
    expect(screen.queryByText('No points for selected labels.')).not.toBeInTheDocument();
  });
});
