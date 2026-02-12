import { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import type { TrainingRecord } from '@/lib/types';

type D3EmbeddingScatterProps = {
  records?: TrainingRecord[];
  height?: number;
  isLoading?: boolean;
  isError?: boolean;
};

type ScatterPoint = {
  x: number;
  y: number;
  weight: number;
  label: string;
};

const MARGIN = { top: 20, right: 20, bottom: 32, left: 36 };
const MAX_POINTS = 600;

export function D3EmbeddingScatter({
  records = [],
  height = 280,
  isLoading,
  isError,
}: D3EmbeddingScatterProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const points = useMemo(() => {
    return records.slice(0, MAX_POINTS).map((record) => ({
      x: record.features[0] ?? 0,
      y: record.features[1] ?? 0,
      weight: record.weight,
      label: record.label,
    }));
  }, [records]);

  useEffect(() => {
    if (!svgRef.current || points.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 640;
    const innerWidth = Math.max(80, width - MARGIN.left - MARGIN.right);
    const innerHeight = Math.max(80, height - MARGIN.top - MARGIN.bottom);

    const root = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const xExtent = d3.extent(points, (point: ScatterPoint) => point.x) as [number, number];
    const yExtent = d3.extent(points, (point: ScatterPoint) => point.y) as [number, number];

    const xScale = d3
      .scaleLinear()
      .domain(xExtent[0] === xExtent[1] ? [xExtent[0] - 1, xExtent[1] + 1] : xExtent)
      .nice()
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain(yExtent[0] === yExtent[1] ? [yExtent[0] - 1, yExtent[1] + 1] : yExtent)
      .nice()
      .range([innerHeight, 0]);

    const labels = Array.from(new Set(points.map((point) => point.label)));
    const colorScale = d3.scaleOrdinal<string, string>().domain(labels).range(d3.schemeTableau10);

    root
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5).tickSizeOuter(0))
      .attr('color', '#64748b')
      .attr('font-size', 10);

    root
      .append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickSizeOuter(0))
      .attr('color', '#64748b')
      .attr('font-size', 10);

    root
      .append('g')
      .selectAll('circle')
      .data<ScatterPoint>(points)
      .enter()
      .append('circle')
      .attr('cx', (point: ScatterPoint) => xScale(point.x))
      .attr('cy', (point: ScatterPoint) => yScale(point.y))
      .attr('r', (point: ScatterPoint) => 3 + point.weight * 2)
      .attr('fill', (point: ScatterPoint) => colorScale(point.label))
      .attr('opacity', 0.72)
      .append('title')
      .text((point: ScatterPoint) => `${point.label} | weight ${point.weight.toFixed(2)}`);
  }, [height, points]);

  const overlayMessage = isError
    ? 'Failed to load D3 chart.'
    : isLoading
      ? 'Loading D3 chart...'
      : points.length === 0
        ? 'No points for D3 chart.'
        : null;

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-slate-200 bg-white"
      style={{ height }}
    >
      <svg ref={svgRef} className="h-full w-full" data-testid="d3-embedding-scatter" />
      {overlayMessage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-sm text-slate-400">
          {overlayMessage}
        </div>
      ) : null}
    </div>
  );
}
