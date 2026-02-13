import { useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/i18n/useI18n';
import { LargeDataTable } from '@/features/table/LargeDataTable';
import { SectionCardActions } from '@/features/dashboard/sections/shared';
import type { DashboardSectionProps } from '@/features/dashboard/sections/types';

export function TableSection({
  datasetSize,
  compareDatasetSize,
  compareEnabled,
  filters,
  onOpenDetail,
}: DashboardSectionProps) {
  const { t } = useI18n();
  const primaryTableRef = useRef<HTMLDivElement | null>(null);
  const compareTableRef = useRef<HTMLDivElement | null>(null);

  if (compareEnabled) {
    return (
      <section className="grid gap-6 lg:grid-cols-2">
        <Card
          title={t('sectionTablePrimaryTitle')}
          description={t('sectionTableDescription')}
          subtitle={t('techVirtual')}
          actions={
            <SectionCardActions
              onOpenDetail={onOpenDetail ? () => onOpenDetail('table') : undefined}
              exportTargetRef={primaryTableRef}
              exportFileName="large-table-primary"
            />
          }
        >
          <LargeDataTable
            total={datasetSize.value}
            filters={filters}
            exportTargetRef={primaryTableRef}
          />
        </Card>
        <Card
          title={t('sectionTableCompareTitle')}
          description={t('sectionTableDescription')}
          subtitle={t('techVirtual')}
          actions={
            <SectionCardActions
              exportTargetRef={compareTableRef}
              exportFileName="large-table-compare"
            />
          }
        >
          <LargeDataTable
            total={compareDatasetSize.value}
            filters={filters}
            exportTargetRef={compareTableRef}
          />
        </Card>
      </section>
    );
  }

  return (
    <Card
      title={t('sectionTableTitle')}
      description={t('sectionTableDescription')}
      subtitle={t('techVirtual')}
      actions={
        <SectionCardActions
          onOpenDetail={onOpenDetail ? () => onOpenDetail('table') : undefined}
          exportTargetRef={primaryTableRef}
          exportFileName="large-table"
        />
      }
    >
      <LargeDataTable
        total={datasetSize.value}
        filters={filters}
        exportTargetRef={primaryTableRef}
      />
    </Card>
  );
}
