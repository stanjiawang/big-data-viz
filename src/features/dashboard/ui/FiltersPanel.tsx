import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { UI_INPUT_MD, UI_LABEL_CLASS } from '@/components/ui/styleTokens';
import { ThemedSelect } from '@/components/ui/ThemedSelect';
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
  const [searchInputValue, setSearchInputValue] = useState(filters.search ?? '');
  const searchCommitTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (searchCommitTimer.current !== null) {
        window.clearTimeout(searchCommitTimer.current);
      }
    },
    [],
  );

  const commitSearchInput = useCallback(() => {
    if (searchCommitTimer.current !== null) {
      window.clearTimeout(searchCommitTimer.current);
      searchCommitTimer.current = null;
    }
    setFilters((current) => {
      if ((current.search ?? '') === searchInputValue) {
        return current;
      }
      return {
        ...current,
        search: searchInputValue,
      };
    });
  }, [searchInputValue, setFilters]);

  const commitSearchValue = useCallback(
    (nextValue: string) => {
      setFilters((current) => {
        if ((current.search ?? '') === nextValue) {
          return current;
        }
        return {
          ...current,
          search: nextValue,
        };
      });
    },
    [setFilters],
  );

  const handleDatasetSizeChange = useCallback(
    (nextValue: string) => {
      const nextSize = DATASET_SIZES.find((option) => option.value === Number(nextValue));
      if (nextSize) {
        setDatasetSize(nextSize);
      }
    },
    [setDatasetSize],
  );

  const handleSourceChange = useCallback(
    (nextValue: string) => {
      setFilters((current) => ({
        ...current,
        source: nextValue as MockFilters['source'],
      }));
    },
    [setFilters],
  );

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      setSearchInputValue(nextValue);
      if (searchCommitTimer.current !== null) {
        window.clearTimeout(searchCommitTimer.current);
      }
      searchCommitTimer.current = window.setTimeout(() => {
        commitSearchValue(nextValue);
      }, 250);
    },
    [commitSearchValue],
  );

  const handleWeightMinChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number(event.target.value);
      setFilters((current) => ({
        ...current,
        weightMin: Math.abs(nextValue - defaultWeightMin) < 0.0001 ? undefined : nextValue,
      }));
    },
    [defaultWeightMin, setFilters],
  );

  const handleWeightMaxChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number(event.target.value);
      setFilters((current) => ({
        ...current,
        weightMax: Math.abs(nextValue - defaultWeightMax) < 0.0001 ? undefined : nextValue,
      }));
    },
    [defaultWeightMax, setFilters],
  );

  const toggleLabel = useCallback(
    (label: string) => {
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
    },
    [setFilters],
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={LABEL_CLASS}>
        {t('filtersDatasetSize')}
        <ThemedSelect
          ariaLabel={t('filtersDatasetSize')}
          triggerClassName="h-10 text-sm"
          value={String(datasetSize.value)}
          onChange={handleDatasetSizeChange}
          options={DATASET_SIZES.map((option) => ({
            label: option.label,
            value: String(option.value),
          }))}
        />
      </label>

      <label className={LABEL_CLASS}>
        {t('filtersSource')}
        <ThemedSelect
          ariaLabel={t('filtersSource')}
          triggerClassName="h-10 text-sm"
          value={filters.source ?? 'all'}
          onChange={handleSourceChange}
          options={SOURCE_OPTIONS.map((option) => ({
            label: option,
            value: option,
          }))}
        />
      </label>

      <label className={LABEL_CLASS}>
        {t('filtersSearchPrefix')}
        <input
          id="filters-search-input"
          className={INPUT_CLASS}
          placeholder={t('filtersSearchPlaceholder')}
          value={searchInputValue}
          onChange={handleSearchChange}
          onBlur={commitSearchInput}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commitSearchInput();
            }
          }}
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
          onChange={handleWeightMinChange}
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
          onChange={handleWeightMaxChange}
        />
      </label>

      <fieldset className={`${LABEL_CLASS} sm:col-span-2`}>
        <legend>{t('filtersLabelsMultiSelect')}</legend>
        <div className="liquid-panel-subtle mt-2 grid grid-cols-[repeat(auto-fit,minmax(124px,1fr))] gap-2 rounded-2xl border border-slate-200/90 bg-slate-50/65 p-2.5">
          {LABEL_OPTIONS.map((label) => {
            const checked = selectedLabels.includes(label);
            return (
              <label
                key={label}
                className={`liquid-chip group flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 transition ${
                  checked
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-300/85 bg-white text-slate-600 hover:border-slate-400/90 hover:text-slate-900'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleLabel(label)}
                  className="liquid-checkbox h-4 w-4 rounded border-slate-300 accent-blue-600"
                />
                <span className="text-xs font-semibold uppercase tracking-[0.08em]">{label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
