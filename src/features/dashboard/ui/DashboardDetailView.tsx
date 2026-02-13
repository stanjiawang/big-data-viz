import type { RefObject } from 'react';
import { Card } from '@/components/ui/Card';
import { UI_BUTTON_GHOST_SM, UI_LABEL_CLASS } from '@/components/ui/styleTokens';
import { DATASET_SIZES } from '@/features/dashboard/constants/filterOptions';
import type { DetailView } from '@/features/dashboard/sections';
import { SectionCardActions } from '@/features/dashboard/sections/shared';
import { ChartsSection, SummarySection, TableSection } from '@/features/dashboard/ui/lazySections';
import { useI18n } from '@/i18n/useI18n';
import type { MockFilters } from '@/lib/types';

const ACTION_BUTTON_CLASS = UI_BUTTON_GHOST_SM;
type DatasetSizeOption = (typeof DATASET_SIZES)[number];

type DashboardDetailViewProps = {
  detailView: DetailView;
  datasetSize: DatasetSizeOption;
  compareDatasetSize: DatasetSizeOption;
  compareEnabled: boolean;
  filters: MockFilters;
  onBackToDashboard: () => void;
  summaryCardRef: RefObject<HTMLElement | null>;
  summaryVisualizationRef: RefObject<HTMLDivElement | null>;
};

export function DashboardDetailView({
  detailView,
  datasetSize,
  compareDatasetSize,
  compareEnabled,
  filters,
  onBackToDashboard,
  summaryCardRef,
  summaryVisualizationRef,
}: DashboardDetailViewProps) {
  const { t } = useI18n();

  const detailLabelByView: Record<DetailView, string> = {
    summary: t('sectionSummaryTitle'),
    timeSeries: t('sectionTimeSeriesTitle'),
    embedding: t('sectionEmbeddingTitle'),
    graph: t('sectionGraphTitle'),
    d3: t('sectionD3Title'),
    table: t('sectionTableTitle'),
  };

  return (
    <main
      id="app-main"
      className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h2 className={UI_LABEL_CLASS}>
          {t('dashboardDetailedView')}: {detailLabelByView[detailView]}
        </h2>
        <button type="button" className={ACTION_BUTTON_CLASS} onClick={onBackToDashboard}>
          {t('dashboardBackToDashboard')}
        </button>
      </section>

      {detailView === 'summary' ? (
        <Card
          sectionRef={summaryCardRef}
          title={t('sectionSummaryDetailedTitle')}
          description={t('sectionSummaryDetailedDescription')}
          subtitle={t('techEchartsQuery')}
          actions={
            <SectionCardActions
              exportTargetRef={summaryVisualizationRef}
              exportFileName="summary-detailed"
            />
          }
        >
          <SummarySection
            datasetSize={datasetSize}
            compareDatasetSize={compareDatasetSize}
            compareEnabled={compareEnabled}
            filters={filters}
            expanded
            visualizationRef={summaryVisualizationRef}
          />
        </Card>
      ) : null}

      {detailView === 'timeSeries' ? (
        <ChartsSection
          datasetSize={datasetSize}
          compareDatasetSize={compareDatasetSize}
          compareEnabled={compareEnabled}
          filters={filters}
          expanded
          focusView="timeSeries"
        />
      ) : null}

      {detailView === 'embedding' ? (
        <ChartsSection
          datasetSize={datasetSize}
          compareDatasetSize={compareDatasetSize}
          compareEnabled={compareEnabled}
          filters={filters}
          expanded
          focusView="embedding"
        />
      ) : null}

      {detailView === 'graph' ? (
        <ChartsSection
          datasetSize={datasetSize}
          compareDatasetSize={compareDatasetSize}
          compareEnabled={compareEnabled}
          filters={filters}
          expanded
          focusView="graph"
        />
      ) : null}

      {detailView === 'd3' ? (
        <ChartsSection
          datasetSize={datasetSize}
          compareDatasetSize={compareDatasetSize}
          compareEnabled={compareEnabled}
          filters={filters}
          expanded
          focusView="d3"
        />
      ) : null}

      {detailView === 'table' ? (
        <TableSection
          datasetSize={datasetSize}
          compareDatasetSize={compareDatasetSize}
          compareEnabled={compareEnabled}
          filters={filters}
        />
      ) : null}
    </main>
  );
}
