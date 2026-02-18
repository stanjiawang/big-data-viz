import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
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
  xStartPercent?: number;
  xEndPercent?: number;
  yMin?: number;
  yMax?: number;
  exportTargetRef?: RefObject<HTMLDivElement | null>;
  onItemClick?: (_name: string) => void;
};

export function BarChart({
  title,
  categories,
  values,
  height = 220,
  isLoading,
  isError,
  xStartPercent = 0,
  xEndPercent = 100,
  yMin,
  yMax,
  exportTargetRef,
  onItemClick,
}: BarChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const option = useMemo<EChartsOption>(() => {
    const safeStart = Math.max(0, Math.min(99, xStartPercent));
    const safeEnd = Math.max(safeStart + 1, Math.min(100, xEndPercent));
    const pointCount = categories.length;
    const startIndex = pointCount <= 1 ? 0 : Math.floor((safeStart / 100) * (pointCount - 1));
    const endIndexExclusive =
      pointCount <= 1
        ? pointCount
        : Math.max(startIndex + 1, Math.ceil((safeEnd / 100) * pointCount));
    const zoomedCategories = categories.slice(startIndex, endIndexExclusive);
    const zoomedValues = values.slice(startIndex, endIndexExclusive);

    return {
      animation: false,
      textStyle: {
        fontFamily: 'inherit',
      },
      title: {
        text: title,
        left: 'left',
        top: 0,
        textStyle: {
          fontSize: 13,
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
        bottom: 20,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: zoomedCategories,
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          margin: 10,
        },
        axisLine: {
          lineStyle: {
            color: '#cbd5e1',
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        min: yMin,
        max: yMax,
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: '#e2e8f0',
          },
        },
      },
      series: [
        {
          type: 'bar',
          data: zoomedValues,
          itemStyle: {
            color: '#2563eb',
          },
          barWidth: 24,
        },
      ],
    } satisfies EChartsOption;
  }, [categories, values, title, xStartPercent, xEndPercent, yMin, yMax]);

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

  useEffect(() => {
    if (!chartInstance.current || !onItemClick) {
      return;
    }

    const handleClick = (params: { name?: string }) => {
      if (typeof params.name === 'string' && params.name.length > 0) {
        onItemClick(params.name);
      }
    };

    chartInstance.current.on('click', handleClick);
    return () => {
      chartInstance.current?.off('click', handleClick);
    };
  }, [onItemClick]);

  const overlayMessage = isError
    ? 'Failed to load chart.'
    : isLoading
      ? 'Loading chart...'
      : categories.length === 0
        ? 'No chart data.'
        : null;

  return (
    <div ref={exportTargetRef} className="relative" style={{ height }}>
      <div ref={chartRef} className="h-full w-full" />
      {overlayMessage ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
          {overlayMessage}
        </div>
      ) : null}
    </div>
  );
}
