import { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import type { TimeSeriesResponse } from '@/lib/types';

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
]);

type TimeSeriesChartProps = {
  data?: TimeSeriesResponse;
  height?: number;
  isLoading?: boolean;
  isError?: boolean;
};

export function TimeSeriesChart({ data, height = 280, isLoading, isError }: TimeSeriesChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const option = useMemo<EChartsOption>(() => {
    const points = data?.points ?? [];

    return {
      animation: false,
      tooltip: {
        trigger: 'axis',
      },
      grid: {
        left: 16,
        right: 16,
        top: 24,
        bottom: 24,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: points.map((point) => point.timestamp.slice(0, 10)),
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: data?.metric ?? 'ingestion',
          type: 'line',
          smooth: true,
          data: points.map((point) => point.value),
          lineStyle: {
            width: 2,
            color: '#2563eb',
          },
          itemStyle: {
            color: '#2563eb',
          },
          areaStyle: {
            color: 'rgba(37, 99, 235, 0.12)',
          },
        },
      ],
    } satisfies EChartsOption;
  }, [data]);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);

      const resizeObserver = new ResizeObserver(() => {
        chartInstance.current?.resize();
      });

      resizeObserver.observe(chartRef.current);

      return () => {
        resizeObserver.disconnect();
        chartInstance.current?.dispose();
        chartInstance.current = null;
      };
    }
  }, []);

  useEffect(() => {
    chartInstance.current?.setOption(option, { notMerge: true });
  }, [option]);

  const overlayMessage = isError
    ? 'Failed to load time series.'
    : isLoading
      ? 'Loading time series...'
      : !data || data.points.length === 0
        ? 'No time-series data.'
        : null;

  return (
    <div className="relative" style={{ height }}>
      <div ref={chartRef} className="h-full w-full" />
      {overlayMessage ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
          {overlayMessage}
        </div>
      ) : null}
    </div>
  );
}
