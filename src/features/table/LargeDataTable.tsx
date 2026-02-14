import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { RefObject } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { UI_BUTTON_GHOST_SM, UI_LABEL_CLASS, UI_STATUS_PILL } from '@/components/ui/styleTokens';
import { useI18n } from '@/i18n/useI18n';
import { getMockData } from '@/lib/apiClient';
import type { DataChunk, MockFilters, TrainingRecord } from '@/lib/types';
import { queryKeys } from '@/features/data/queries/queryKeys';
import { useMockData } from '@/features/data/queries/useMockData';

const PAGE_SIZE = 200;
const VECTOR_SIZE = 128;
const DEFAULT_ROW_HEIGHT = 52;
const COMPACT_ROW_HEIGHT = 24;
const DEFAULT_COL_WIDTHS = [160, 200, 140, 140];
const MIN_COL_WIDTH = 120;
const MAX_COL_WIDTH = 360;
const TABLE_DENSITY_STORAGE_KEY = 'bdv_table_compact_density';

type LargeDataTableProps = {
  total: number;
  filters: MockFilters;
  exportTargetRef?: RefObject<HTMLDivElement | null>;
};

type RowProps = {
  record: TrainingRecord | null;
  style: CSSProperties;
  gridTemplateColumns: string;
  isCompact: boolean;
  loadingText: string;
};

const TableRow = memo(function TableRow({
  record,
  style,
  gridTemplateColumns,
  isCompact,
  loadingText,
}: RowProps) {
  const timestamp = record?.timestamp
    ? record.timestamp.replace('T', ' ').slice(0, 19)
    : loadingText;
  const featurePreviewSize = isCompact ? 2 : 6;

  return (
    <div className="absolute left-0 right-0" style={style}>
      <div
        className={`grid h-full items-center gap-2 border-b border-slate-100 px-4 transition-colors hover:bg-slate-50 ${
          isCompact ? 'text-xs' : 'text-sm'
        }`}
        style={{ gridTemplateColumns }}
      >
        <span className="font-mono text-xs text-slate-500">{record?.id ?? '...'}</span>
        <span className="text-xs text-slate-500">{timestamp}</span>
        <span className="text-xs text-slate-600">{record?.source ?? '—'}</span>
        <span className="text-xs text-slate-600">{record?.label ?? '—'}</span>
        <span className="text-xs text-slate-500">
          {record
            ? record.features
                .slice(0, featurePreviewSize)
                .map((value) => value.toFixed(2))
                .join(', ')
            : '...'}
        </span>
      </div>
    </div>
  );
});

export function LargeDataTable({ total, filters, exportTargetRef }: LargeDataTableProps) {
  const queryClient = useQueryClient();
  const { locale, t } = useI18n();
  const parentRef = useRef<HTMLDivElement | null>(null);
  const resizeState = useRef<{
    index: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  const [isCompact, setIsCompact] = useState(
    () => window.localStorage.getItem(TABLE_DENSITY_STORAGE_KEY) === '1',
  );
  const [columnWidths, setColumnWidths] = useState(DEFAULT_COL_WIDTHS);

  const rowHeight = isCompact ? COMPACT_ROW_HEIGHT : DEFAULT_ROW_HEIGHT;
  const gridTemplateColumns = `${columnWidths[0]}px ${columnWidths[1]}px ${columnWidths[2]}px ${columnWidths[3]}px minmax(220px, 1fr)`;
  const tableHeaders =
    locale === 'zh-CN'
      ? (['ID', '时间戳', '来源', '标签'] as const)
      : (['ID', 'Timestamp', 'Source', 'Label'] as const);

  const {
    data: firstChunk,
    isLoading,
    isError,
  } = useMockData({
    total,
    offset: 0,
    limit: PAGE_SIZE,
    vectorSize: VECTOR_SIZE,
    filters,
  });

  // Mock responses can under-report filtered totals on the first page.
  // Keep virtualization anchored to the selected dataset size so scrolling
  // does not stop at a single chunk.
  const rowCount = Math.max(total, firstChunk?.total ?? 0);
  const serializedFilters = JSON.stringify(filters);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
  });

  const recordsByIndex = useMemo(() => {
    return (index: number): TrainingRecord | null => {
      const offset = Math.floor(index / PAGE_SIZE) * PAGE_SIZE;
      const chunk = queryClient.getQueryData<DataChunk>(
        queryKeys.mockData({
          offset,
          limit: PAGE_SIZE,
          total,
          vectorSize: VECTOR_SIZE,
          filters,
        }),
      );
      const localIndex = index - offset;
      return chunk?.records[localIndex] ?? null;
    };
  }, [queryClient, total, filters]);

  const loadedRowCount = useMemo(() => {
    const queries = queryClient.getQueriesData<DataChunk>({
      queryKey: ['mock-data', 'chunk'],
    });
    const loadedByOffset = new Map<number, number>();

    for (const [key, chunk] of queries) {
      if (!chunk) continue;
      const params = (key as readonly unknown[])[2] as
        | {
            offset?: number;
            total?: number;
            vectorSize?: number;
            filters?: MockFilters;
          }
        | undefined;
      if (!params) continue;
      if (params.total !== total || params.vectorSize !== VECTOR_SIZE) continue;
      if (JSON.stringify(params.filters ?? {}) !== serializedFilters) continue;
      const offset = params.offset ?? 0;
      loadedByOffset.set(offset, Math.max(loadedByOffset.get(offset) ?? 0, chunk.records.length));
    }

    return Array.from(loadedByOffset.values()).reduce((sum, size) => sum + size, 0);
  }, [queryClient, serializedFilters, total]);

  useEffect(() => {
    const items = virtualizer.getVirtualItems();
    if (items.length === 0) return;

    const startIndex = items[0].index;
    const endIndex = items[items.length - 1].index;
    const startOffset = Math.floor(startIndex / PAGE_SIZE) * PAGE_SIZE;
    const endOffset = Math.floor(endIndex / PAGE_SIZE) * PAGE_SIZE;

    for (let offset = startOffset; offset <= endOffset; offset += PAGE_SIZE) {
      const key = queryKeys.mockData({
        offset,
        limit: PAGE_SIZE,
        total,
        vectorSize: VECTOR_SIZE,
        filters,
      });
      if (!queryClient.getQueryData(key)) {
        void queryClient.prefetchQuery({
          queryKey: key,
          queryFn: () =>
            getMockData({
              total,
              offset,
              limit: PAGE_SIZE,
              vectorSize: VECTOR_SIZE,
              filters,
            }),
        });
      }
    }
  }, [queryClient, total, filters, virtualizer]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeState.current) return;
      const { index, startX, startWidth } = resizeState.current;
      const delta = event.clientX - startX;
      setColumnWidths((prev) => {
        const next = [...prev];
        const nextWidth = Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, startWidth + delta));
        next[index] = nextWidth;
        return next;
      });
    };

    const handleMouseUp = () => {
      resizeState.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TABLE_DENSITY_STORAGE_KEY, isCompact ? '1' : '0');
  }, [isCompact]);

  if (isError) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        {t('tableLoadFailed')}
      </div>
    );
  }

  if (rowCount === 0 && !isLoading) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        {t('tableNoRecords')}
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-lg border border-slate-200"
      role="region"
      aria-label={t('sectionTableTitle')}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-2 text-xs text-slate-500">
        <span className={UI_LABEL_CLASS}>{t('tableControls')}</span>
        <span className={`${UI_STATUS_PILL} order-3 w-full sm:order-none sm:w-auto`}>
          {isCompact ? t('tableCompactDensity') : t('tableComfortableDensity')}
        </span>
        <button
          type="button"
          className={`${UI_BUTTON_GHOST_SM} w-full min-w-0 sm:w-40`}
          aria-pressed={isCompact}
          aria-label={isCompact ? t('tableSwitchToComfortable') : t('tableSwitchToCompact')}
          onClick={() => setIsCompact((current) => !current)}
        >
          {t('tableToggleDensity')}
        </button>
      </div>

      <div ref={exportTargetRef} className="h-80 overflow-hidden">
        <div ref={parentRef} className="h-full overflow-auto" tabIndex={0}>
          <div
            className="sticky top-0 z-10 grid h-11 items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm"
            style={{ gridTemplateColumns }}
          >
            {tableHeaders.map((label, index) => (
              <div key={label} className="relative flex items-center">
                <span>{label}</span>
                <span
                  role="presentation"
                  className="absolute -right-1 top-0 h-full w-2 cursor-col-resize"
                  onMouseDown={(event) => {
                    resizeState.current = {
                      index,
                      startX: event.clientX,
                      startWidth: columnWidths[index],
                    };
                  }}
                />
              </div>
            ))}
            <span>{t('tableEmbeddingPreview')}</span>
          </div>

          <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {isLoading && (
              <div className="absolute left-4 top-4 text-sm text-slate-400">
                {t('tableLoadingRecords')}
              </div>
            )}
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const record = recordsByIndex(virtualRow.index);
              return (
                <TableRow
                  key={virtualRow.key}
                  record={record}
                  gridTemplateColumns={gridTemplateColumns}
                  isCompact={isCompact}
                  loadingText={t('tableTimestampLoading')}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                    height: `${virtualRow.size}px`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-xs text-slate-500">
        <span>
          {t('tableRowsLoaded')}: {Math.min(rowCount, loadedRowCount).toLocaleString()}
        </span>
        <span>
          {t('tableTotalRows')}: {rowCount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
