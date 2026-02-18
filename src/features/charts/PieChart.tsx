import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import * as echarts from 'echarts/core';
import { PieChart as PieChartImpl } from 'echarts/charts';
import { LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

echarts.use([PieChartImpl, TooltipComponent, LegendComponent, CanvasRenderer]);

type PieChartProps = {
  title: string;
  data: { name: string; value: number }[];
  height?: number;
  isLoading?: boolean;
  isError?: boolean;
  exportTargetRef?: RefObject<HTMLDivElement | null>;
  onItemClick?: (_name: string) => void;
};

export function PieChart({
  title,
  data,
  height = 220,
  isLoading,
  isError,
  exportTargetRef,
  onItemClick,
}: PieChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const option = useMemo<EChartsOption>(() => {
    return {
      animation: false,
      textStyle: {
        fontFamily: 'inherit',
      },
      tooltip: {
        trigger: 'item',
      },
      legend: {
        bottom: 0,
        icon: 'roundRect',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 14,
        textStyle: {
          color: '#475569',
          fontSize: 11,
          fontWeight: 500,
        },
      },
      series: [
        {
          name: title,
          type: 'pie',
          radius: ['42%', '70%'],
          center: ['50%', '43%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
          },
          label: {
            show: false,
          },
          data,
        },
      ],
    } satisfies EChartsOption;
  }, [data, title]);

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
      : data.length === 0
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
