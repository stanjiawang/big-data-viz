import { useRef } from 'react';
import { Card } from '@/components/ui/Card';
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
  const primaryTableRef = useRef<HTMLDivElement | null>(null);
  const compareTableRef = useRef<HTMLDivElement | null>(null);

  if (compareEnabled) {
    return (
      <section className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Large Table (Primary)"
          description="Virtualized grid for multi-million row browsing."
          subtitle="Tech stack: TanStack Virtual + React Query"
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
          title="Large Table (Compare)"
          description="Virtualized grid for multi-million row browsing."
          subtitle="Tech stack: TanStack Virtual + React Query"
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
      title="Large Table"
      description="Virtualized grid for multi-million row browsing."
      subtitle="Tech stack: TanStack Virtual + React Query"
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
