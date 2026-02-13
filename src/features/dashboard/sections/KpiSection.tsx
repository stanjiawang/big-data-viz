import { useMemo } from 'react';
import { KpiCard } from '@/components/ui/KpiCard';
import type { DataChunk } from '@/lib/types';
import { useMockData, useMockDataSuspense } from '@/features/data/queries/useMockData';
import type { DashboardSectionProps } from '@/features/dashboard/sections/types';
import { useI18n } from '@/i18n/useI18n';

export function KpiSection({
  datasetSize,
  compareDatasetSize,
  compareEnabled,
  filters,
}: DashboardSectionProps) {
  const { t } = useI18n();
  const { data: chunk, isLoading } = useMockDataSuspense({
    total: datasetSize.value,
    offset: 0,
    limit: 1000,
    vectorSize: 128,
    filters,
  });

  const { data: compareChunk, isLoading: isCompareLoading } = useMockData({
    total: compareDatasetSize.value,
    offset: 0,
    limit: 1000,
    vectorSize: 128,
    filters,
    enabled: compareEnabled,
  });

  const labelCount = useMemo(() => {
    if (!chunk) return 0;
    return new Set(chunk.records.map((record) => record.label)).size;
  }, [chunk]);

  const compareLabelCount = useMemo(() => {
    if (!compareChunk) return 0;
    return new Set(compareChunk.records.map((record) => record.label)).size;
  }, [compareChunk]);

  const kpiGrid = (data: DataChunk | undefined, loading: boolean, activeLabels: number) => (
    <div className="grid gap-4 sm:grid-cols-2">
      <KpiCard
        label={t('kpiTotalRecords')}
        value={
          loading
            ? t('tableTimestampLoading')
            : `${(data?.total ?? datasetSize.value).toLocaleString()}`
        }
        trend="+8.2%"
        helper={t('kpiAcrossAllSources')}
      />
      <KpiCard
        label={t('kpiActiveLabels')}
        value={loading ? t('dashboardBadgeEmpty') : `${activeLabels}`}
        trend={t('kpiActiveLabelsTrend')}
        helper={t('kpiTopLabels')}
      />
      <KpiCard
        label={t('kpiAvgFeatureLength')}
        value={loading ? t('dashboardBadgeEmpty') : `${data?.records[0]?.features.length ?? 0}`}
        helper={t('kpiEmbeddingVectorSize')}
      />
      <KpiCard
        label={t('kpiAnomalyRate')}
        value={loading ? t('dashboardBadgeEmpty') : '0.34%'}
        trend="-0.08%"
        helper={t('kpiOutliersFlagged')}
      />
    </div>
  );

  if (compareEnabled) {
    return (
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>{t('kpiPrimaryDataset')}</span>
            <span>{datasetSize.label}</span>
          </div>
          {kpiGrid(chunk, isLoading, labelCount)}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>{t('kpiCompareDataset')}</span>
            <span>{compareDatasetSize.label}</span>
          </div>
          {kpiGrid(compareChunk, isCompareLoading, compareLabelCount)}
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label={t('kpiTotalRecords')}
        value={
          isLoading
            ? t('tableTimestampLoading')
            : `${(chunk?.total ?? datasetSize.value).toLocaleString()}`
        }
        trend="+8.2%"
        helper={t('kpiAcrossAllSources')}
      />
      <KpiCard
        label={t('kpiActiveLabels')}
        value={isLoading ? t('dashboardBadgeEmpty') : `${labelCount}`}
        trend={t('kpiActiveLabelsTrend')}
        helper={t('kpiTopLabels')}
      />
      <KpiCard
        label={t('kpiAvgFeatureLength')}
        value={isLoading ? t('dashboardBadgeEmpty') : `${chunk?.records[0]?.features.length ?? 0}`}
        helper={t('kpiEmbeddingVectorSize')}
      />
      <KpiCard
        label={t('kpiAnomalyRate')}
        value={isLoading ? t('dashboardBadgeEmpty') : '0.34%'}
        trend="-0.08%"
        helper={t('kpiOutliersFlagged')}
      />
    </section>
  );
}
