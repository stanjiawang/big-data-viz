import { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart as BarChartImpl } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

echarts.use([BarChartImpl, GridComponent, TooltipComponent, CanvasRenderer]);

type BarChartProps = {
  title: string;
  categories: string[];
  values: number[];
  height?: number;
  isLoading?: boolean;
  isError?: boolean;
};

export function BarChart({
  title,
  categories,
  values,
  height = 220,
  isLoading,
  isError,
}: BarChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const option = useMemo<EChartsOption>(() => {
    return {
      animation: false,
      title: {
        text: title,
        left: 'left',
        textStyle: {
          fontSize: 12,
          fontWeight: 600,
          color: '#475569',
        },
      },
      tooltip: {
        trigger: 'axis',
      },
      grid: {
        left: 12,
        right: 12,
        top: 32,
        bottom: 16,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: categories,
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          type: 'bar',
          data: values,
          itemStyle: {
            color: '#2563eb',
          },
          barWidth: 24,
        },
      ],
    } satisfies EChartsOption;
  }, [categories, values, title]);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);

      const resizeObserver = new ResizeObserver(() => chartInstance.current?.resize());
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
    ? 'Failed to load chart.'
    : isLoading
      ? 'Loading chart...'
      : categories.length === 0
        ? 'No chart data.'
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
