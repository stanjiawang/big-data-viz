import type { RefObject } from 'react';
import { Card } from '@/components/ui/Card';
import { UI_BUTTON_GHOST_SM, UI_LABEL_CLASS } from '@/components/ui/styleTokens';
import { DATASET_SIZES } from '@/features/dashboard/constants/filterOptions';
import type { DetailView } from '@/features/dashboard/sections';
import { SectionCardActions } from '@/features/dashboard/sections/SectionShared';
import { ChartsSection, SummarySection, TableSection } from '@/features/dashboard/ui/LazySections';
import { getChartDetailTitleKey, isChartDetailView } from '@/features/visualizations/chartRegistry';
import type { MessageKey } from '@/i18n/messages';
import { useI18n } from '@/i18n/useI18n';
import type { MockFilters } from '@/lib/types';

const ACTION_BUTTON_CLASS = UI_BUTTON_GHOST_SM;
type DatasetSizeOption = (typeof DATASET_SIZES)[number];
type TranslateFn = (_key: MessageKey) => string;

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

function getDetailTitle(detailView: DetailView, t: TranslateFn) {
  if (detailView === 'summary') {
    return t('sectionSummaryTitle');
  }
  if (detailView === 'table') {
    return t('sectionTableTitle');
  }
  return t(getChartDetailTitleKey(detailView));
}

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

  return (
    <main
      id="app-main"
      className="mx-auto grid w-full max-w-[1480px] gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex min-h-10 flex-wrap items-center justify-between gap-3">
          <h2 className={UI_LABEL_CLASS}>
            {t('dashboardDetailedView')}: {getDetailTitle(detailView, t)}
          </h2>
          <div className="flex flex-wrap items-center justify-end gap-2 lg:flex-nowrap">
            <button
              type="button"
              className={`${ACTION_BUTTON_CLASS} h-9 min-w-0 gap-2 px-3 normal-case`}
              onClick={onBackToDashboard}
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
                <path
                  d="M11.75 4.75 6.5 10l5.25 5.25"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
              {t('dashboardBackToDashboard')}
            </button>
          </div>
        </div>
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

      {isChartDetailView(detailView) ? (
        <ChartsSection
          datasetSize={datasetSize}
          compareDatasetSize={compareDatasetSize}
          compareEnabled={compareEnabled}
          filters={filters}
          expanded
          focusView={detailView}
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
