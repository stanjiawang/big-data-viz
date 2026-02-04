import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FiltersPanel } from '@/features/dashboard/FiltersPanel';
import { DATASET_SIZES } from '@/features/dashboard/dashboardFilters';
import type { MockFilters } from '@/lib/types';

function TestHarness() {
  const [datasetSize, setDatasetSize] = useState(DATASET_SIZES[0]);
  const [filters, setFilters] = useState<MockFilters>({
    source: 'all',
    search: '',
  });

  return (
    <div>
      <FiltersPanel
        datasetSize={datasetSize}
        setDatasetSize={setDatasetSize}
        filters={filters}
        setFilters={setFilters}
        selectedLabels={filters.labels ?? []}
        weightMinValue={filters.weightMin ?? 0.5}
        weightMaxValue={filters.weightMax ?? 2.5}
        defaultWeightMin={0.5}
        defaultWeightMax={2.5}
      />
      <div data-testid="dataset-size">{datasetSize.label}</div>
      <div data-testid="labels">{(filters.labels ?? []).join(',')}</div>
      <div data-testid="source">{filters.source}</div>
      <div data-testid="search">{filters.search}</div>
    </div>
  );
}

describe('FiltersPanel', () => {
  it('updates dataset size', async () => {
    render(<TestHarness />);
    const select = screen.getByLabelText(/Dataset size/i);

    await userEvent.selectOptions(select, String(DATASET_SIZES[1].value));

    expect(screen.getByTestId('dataset-size')).toHaveTextContent('1M');
  });

  it('toggles label filters', async () => {
    render(<TestHarness />);
    const checkbox = screen.getByLabelText('class-A');

    await userEvent.click(checkbox);
    expect(screen.getByTestId('labels')).toHaveTextContent('class-A');

    await userEvent.click(checkbox);
    expect(screen.getByTestId('labels')).toHaveTextContent('');
  });

  it('updates source and search', async () => {
    render(<TestHarness />);

    await userEvent.selectOptions(screen.getByLabelText(/Source/i), 'user');
    await userEvent.type(screen.getByLabelText(/Search ID prefix/i), 'batch-2025');

    expect(screen.getByTestId('source')).toHaveTextContent('user');
    expect(screen.getByTestId('search')).toHaveTextContent('batch-2025');
  });
});
