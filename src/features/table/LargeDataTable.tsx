import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { getMockData } from '@/lib/apiClient';
import type { DataChunk, MockFilters, TrainingRecord } from '@/lib/types';
import { queryKeys } from '@/features/data/queries/queryKeys';
import { useMockData } from '@/features/data/queries/useMockData';

const PAGE_SIZE = 200;
const DEFAULT_ROW_HEIGHT = 44;
const COMPACT_ROW_HEIGHT = 34;
const DEFAULT_COL_WIDTHS = [160, 200, 140, 140];
const MIN_COL_WIDTH = 120;
const MAX_COL_WIDTH = 360;

type LargeDataTableProps = {
  total: number;
  filters: MockFilters;
};

type RowProps = {
  record: TrainingRecord | null;
  style: CSSProperties;
  gridTemplateColumns: string;
};

const TableRow = memo(function TableRow({ record, style, gridTemplateColumns }: RowProps) {
  return (
    <div className="absolute left-0 right-0" style={style}>
      <div
        className="grid h-full items-center gap-2 border-b border-slate-100 px-4 text-sm transition-colors hover:bg-slate-50"
        style={{ gridTemplateColumns }}
      >
        <span className="font-mono text-xs text-slate-500">{record?.id ?? '...'}</span>
        <span className="text-xs text-slate-500">{record?.timestamp ?? 'Loading'}</span>
        <span className="text-xs text-slate-600">{record?.source ?? '—'}</span>
        <span className="text-xs text-slate-600">{record?.label ?? '—'}</span>
        <span className="text-xs text-slate-500">
          {record
            ? record.features
                .slice(0, 6)
                .map((value) => value.toFixed(2))
                .join(', ')
            : '...'}
        </span>
      </div>
    </div>
  );
});

export function LargeDataTable({ total, filters }: LargeDataTableProps) {
  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement | null>(null);
  const resizeState = useRef<{
    index: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  const [isCompact, setIsCompact] = useState(false);
  const [columnWidths, setColumnWidths] = useState(DEFAULT_COL_WIDTHS);

  const rowHeight = isCompact ? COMPACT_ROW_HEIGHT : DEFAULT_ROW_HEIGHT;
  const gridTemplateColumns = `${columnWidths[0]}px ${columnWidths[1]}px ${columnWidths[2]}px ${columnWidths[3]}px minmax(220px, 1fr)`;

  const {
    data: firstChunk,
    isLoading,
    isError,
  } = useMockData({
    total,
    offset: 0,
    limit: PAGE_SIZE,
    vectorSize: 128,
    filters,
  });

  const rowCount = firstChunk?.total ?? total;

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
          filters,
        }),
      );
      const localIndex = index - offset;
      return chunk?.records[localIndex] ?? null;
    };
  }, [queryClient, total, filters]);

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
              vectorSize: 128,
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

  if (isError) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        Failed to load table data.
      </div>
    );
  }

  if (rowCount === 0 && !isLoading) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        No records match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-2 text-xs text-slate-500">
        <span className="font-semibold uppercase tracking-wide">Table controls</span>
        <button
          type="button"
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus-visible:border-blue-500 focus-visible:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-200"
          aria-pressed={isCompact}
          onClick={() => setIsCompact((current) => !current)}
        >
          {isCompact ? 'Comfortable view' : 'Compact view'}
        </button>
      </div>

      <div ref={parentRef} className="h-80 overflow-auto">
        <div
          className="sticky top-0 z-10 grid items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm"
          style={{ gridTemplateColumns }}
        >
          {['ID', 'Timestamp', 'Source', 'Label'].map((label, index) => (
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
          <span>Embedding (first 6)</span>
        </div>

        <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          {isLoading && (
            <div className="absolute left-4 top-4 text-sm text-slate-400">Loading records...</div>
          )}
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const record = recordsByIndex(virtualRow.index);
            return (
              <TableRow
                key={virtualRow.key}
                record={record}
                gridTemplateColumns={gridTemplateColumns}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  height: `${virtualRow.size}px`,
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-xs text-slate-500">
        <span>Rows loaded: {Math.min(rowCount, PAGE_SIZE * 5).toLocaleString()}</span>
        <span>Total rows: {rowCount.toLocaleString()}</span>
      </div>
    </div>
  );
}
