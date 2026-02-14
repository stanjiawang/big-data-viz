import type { Dispatch, SetStateAction } from 'react';
import { UI_INPUT_MD, UI_LABEL_CLASS, UI_SELECT_MD } from '@/components/ui/styleTokens';
import { useI18n } from '@/i18n/useI18n';
import type { MockFilters } from '@/lib/types';
import {
  DATASET_SIZES,
  LABEL_OPTIONS,
  SOURCE_OPTIONS,
} from '@/features/dashboard/constants/filterOptions';

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

const LABEL_CLASS = `space-y-2 ${UI_LABEL_CLASS}`;
const INPUT_CLASS = `${UI_INPUT_MD} h-10`;
const SELECT_CLASS = `${UI_SELECT_MD} h-10`;

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
  const { t } = useI18n();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={LABEL_CLASS}>
        {t('filtersDatasetSize')}
        <span className="relative block">
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
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          >
            <path
              d="M5.25 7.75 10 12.25l4.75-4.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
            />
          </svg>
        </span>
      </label>

      <label className={LABEL_CLASS}>
        {t('filtersSource')}
        <span className="relative block">
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
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          >
            <path
              d="M5.25 7.75 10 12.25l4.75-4.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
            />
          </svg>
        </span>
      </label>

      <label className={LABEL_CLASS}>
        {t('filtersSearchPrefix')}
        <input
          id="filters-search-input"
          className={INPUT_CLASS}
          placeholder={t('filtersSearchPlaceholder')}
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
        {t('filtersWeightMin')}
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
        {t('filtersWeightMax')}
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

      <fieldset className={`${LABEL_CLASS} sm:col-span-2`}>
        <legend>{t('filtersLabelsMultiSelect')}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-3">
          {LABEL_OPTIONS.map((label) => {
            const checked = selectedLabels.includes(label);
            return (
              <label
                key={label}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
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
      </fieldset>
    </div>
  );
}
