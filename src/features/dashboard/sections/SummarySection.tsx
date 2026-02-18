import { useMemo, useState } from 'react';
import type { RefObject } from 'react';
import { AsyncBoundary } from '@/components/ui/AsyncBoundary';
import { UI_BUTTON_GHOST_SM, UI_INPUT_MD, UI_LABEL_CLASS } from '@/components/ui/styleTokens';
import { useI18n } from '@/i18n/useI18n';
import { useMockDataSuspense } from '@/features/data/queries/useMockData';
import { LABEL_OPTIONS, SOURCE_OPTIONS } from '@/features/dashboard/constants/filterOptions';
import { LazyBarChart, LazyPieChart } from '@/features/dashboard/sections/LazyVisualizations';
import { RangeSummary } from '@/features/dashboard/sections/SectionShared';
import type { DashboardSectionProps } from '@/features/dashboard/sections/types';

type SummarySectionProps = DashboardSectionProps & {
  visualizationRef?: RefObject<HTMLDivElement | null>;
};

export function SummarySection({
  datasetSize,
  filters,
  expanded = false,
  visualizationRef,
  onCrossFilter,
}: SummarySectionProps) {
  const { t } = useI18n();
  const { data: chunk } = useMockDataSuspense({
    total: datasetSize.value,
    offset: 0,
    limit: 1000,
    vectorSize: 128,
    filters,
  });

  const labelDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    chunk?.records.forEach((record) => {
      counts.set(record.label, (counts.get(record.label) ?? 0) + 1);
    });
    return LABEL_OPTIONS.map((label) => ({
      name: label,
      value: counts.get(label) ?? 0,
    }));
  }, [chunk]);

  const sourceDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    chunk?.records.forEach((record) => {
      counts.set(record.source, (counts.get(record.source) ?? 0) + 1);
    });

    const categories = SOURCE_OPTIONS.filter((source) => source !== 'all');
    return {
      categories,
      values: categories.map((source) => counts.get(source) ?? 0),
    };
  }, [chunk]);

  const [barXStart, setBarXStart] = useState(0);
  const [barXEnd, setBarXEnd] = useState(100);
  const [barYMin, setBarYMin] = useState<string>('');
  const [barYMax, setBarYMax] = useState<string>('');

  const barYMinValue = barYMin === '' ? undefined : Number(barYMin);
  const barYMaxValue = barYMax === '' ? undefined : Number(barYMax);

  return (
    <div className="space-y-3">
      <div ref={visualizationRef} className="space-y-3">
        <div className="rounded-xl border border-slate-200/90 bg-white/90 p-4">
          <AsyncBoundary fallback={<div className={expanded ? 'h-[280px]' : 'h-[200px]'} />}>
            <LazyPieChart
              title={t('chartLabelDistribution')}
              data={labelDistribution}
              height={expanded ? 280 : 200}
              onItemClick={(label) => {
                onCrossFilter?.({
                  label,
                  labels: [label],
                });
              }}
            />
          </AsyncBoundary>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white/90 p-4">
          <AsyncBoundary fallback={<div className={expanded ? 'h-[280px]' : 'h-[200px]'} />}>
            <LazyBarChart
              title={t('chartSourceVolume')}
              categories={sourceDistribution.categories}
              values={sourceDistribution.values}
              height={expanded ? 280 : 200}
              xStartPercent={barXStart}
              xEndPercent={barXEnd}
              yMin={barYMinValue}
              yMax={barYMaxValue}
              onItemClick={(source) => {
                onCrossFilter?.({
                  source: source as DashboardSectionProps['filters']['source'],
                });
              }}
            />
          </AsyncBoundary>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200/90 bg-white/90 p-4">
        <div className="border-t border-slate-200/80 pt-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <RangeSummary xStart={barXStart} xEnd={barXEnd} yMin={barYMin} yMax={barYMax} />
            <button
              type="button"
              className={`${UI_BUTTON_GHOST_SM} h-9 px-2`}
              onClick={() => {
                setBarXStart(0);
                setBarXEnd(100);
                setBarYMin('');
                setBarYMax('');
              }}
            >
              {t('reset')}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-slate-600">
              <span className={UI_LABEL_CLASS}>{t('xRangeStart')}</span>
              <input
                type="range"
                min={0}
                max={Math.max(0, barXEnd - 1)}
                value={barXStart}
                onChange={(event) => setBarXStart(Number(event.target.value))}
                className="w-full accent-blue-600"
              />
            </label>
            <label className="space-y-1 text-xs text-slate-600">
              <span className={UI_LABEL_CLASS}>{t('xRangeEnd')}</span>
              <input
                type="range"
                min={Math.min(100, barXStart + 1)}
                max={100}
                value={barXEnd}
                onChange={(event) => setBarXEnd(Number(event.target.value))}
                className="w-full accent-blue-600"
              />
            </label>
            <label className="space-y-1 text-xs text-slate-600">
              <span className={UI_LABEL_CLASS}>{t('yMin')}</span>
              <input
                type="number"
                value={barYMin}
                onChange={(event) => setBarYMin(event.target.value)}
                className={`${UI_INPUT_MD} h-9 px-2 py-1`}
              />
            </label>
            <label className="space-y-1 text-xs text-slate-600">
              <span className={UI_LABEL_CLASS}>{t('yMax')}</span>
              <input
                type="number"
                value={barYMax}
                onChange={(event) => setBarYMax(event.target.value)}
                className={`${UI_INPUT_MD} h-9 px-2 py-1`}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
