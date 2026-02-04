import type { Dispatch, SetStateAction } from 'react';
import type { MockFilters } from '@/lib/types';
import {
  DATASET_SIZES,
  LABEL_OPTIONS,
  SOURCE_OPTIONS,
} from '@/features/dashboard/dashboardFilters';

export type FiltersPanelProps = {
  datasetSize: (typeof DATASET_SIZES)[number];
  setDatasetSize: Dispatch<SetStateAction<(typeof DATASET_SIZES)[number]>>;
  filters: MockFilters;
  setFilters: Dispatch<SetStateAction<MockFilters>>;
  selectedLabels: string[];
  weightMinValue: number;
  weightMaxValue: number;
  defaultWeightMin: number;
  defaultWeightMax: number;
};

const LABEL_CLASS = 'space-y-2 text-xs font-semibold uppercase tracking-wide text-slate-500';
const INPUT_CLASS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-200';
const SELECT_CLASS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-200';

export function FiltersPanel({
  datasetSize,
  setDatasetSize,
  filters,
  setFilters,
  selectedLabels,
  weightMinValue,
  weightMaxValue,
  defaultWeightMin,
  defaultWeightMax,
}: FiltersPanelProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={LABEL_CLASS}>
        Dataset size
        <select
          className={SELECT_CLASS}
          value={datasetSize.value}
          onChange={(event) => {
            const nextSize = DATASET_SIZES.find(
              (option) => option.value === Number(event.target.value),
            );
            if (nextSize) {
              setDatasetSize(nextSize);
            }
          }}
        >
          {DATASET_SIZES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className={LABEL_CLASS}>
        Labels (multi-select)
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-2">
          {LABEL_OPTIONS.map((label) => {
            const checked = selectedLabels.includes(label);
            return (
              <label key={label} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setFilters((current) => {
                      const nextLabels = new Set(current.labels ?? []);
                      if (nextLabels.has(label)) {
                        nextLabels.delete(label);
                      } else {
                        nextLabels.add(label);
                      }
                      return {
                        ...current,
                        labels: Array.from(nextLabels),
                      };
                    });
                  }}
                />
                {label}
              </label>
            );
          })}
        </div>
      </div>

      <label className={LABEL_CLASS}>
        Source
        <select
          className={SELECT_CLASS}
          value={filters.source ?? 'all'}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              source: event.target.value as MockFilters['source'],
            }))
          }
        >
          {SOURCE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className={LABEL_CLASS}>
        Search ID prefix
        <input
          className={INPUT_CLASS}
          placeholder="e.g. batch-2025"
          value={filters.search ?? ''}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              search: event.target.value,
            }))
          }
        />
      </label>

      <label className={LABEL_CLASS}>
        Weight min
        <input
          type="number"
          step="0.1"
          min="0"
          max="5"
          className={INPUT_CLASS}
          value={weightMinValue}
          onChange={(event) => {
            const nextValue = Number(event.target.value);
            setFilters((current) => ({
              ...current,
              weightMin: Math.abs(nextValue - defaultWeightMin) < 0.0001 ? undefined : nextValue,
            }));
          }}
        />
      </label>

      <label className={LABEL_CLASS}>
        Weight max
        <input
          type="number"
          step="0.1"
          min="0"
          max="5"
          className={INPUT_CLASS}
          value={weightMaxValue}
          onChange={(event) => {
            const nextValue = Number(event.target.value);
            setFilters((current) => ({
              ...current,
              weightMax: Math.abs(nextValue - defaultWeightMax) < 0.0001 ? undefined : nextValue,
            }));
          }}
        />
      </label>
    </div>
  );
}
