import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  UI_BUTTON_GHOST_SM,
  UI_CHIP_ACTIVE,
  UI_CHIP_INTERACTIVE,
  UI_LABEL_CLASS,
} from '@/components/ui/styleTokens';
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

type HoverState = {
  x: number;
  y: number;
  label: string;
  weight: number;
  px: number;
  py: number;
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
  const [hiddenLabels, setHiddenLabels] = useState<Set<string>>(new Set());
  const [pointScale, setPointScale] = useState(1);
  const [pointOpacity, setPointOpacity] = useState(0.72);
  const [hovered, setHovered] = useState<HoverState | null>(null);
  const [resetNonce, setResetNonce] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  const points = useMemo(() => {
    return records.slice(0, MAX_POINTS).map((record) => ({
      x: record.features[0] ?? 0,
      y: record.features[1] ?? 0,
      weight: record.weight,
      label: record.label,
    }));
  }, [records]);

  const labels = useMemo(() => {
    return Array.from(new Set(points.map((point) => point.label))).sort();
  }, [points]);

  const visiblePoints = useMemo(() => {
    return points.filter((point) => !hiddenLabels.has(point.label));
  }, [hiddenLabels, points]);

  useEffect(() => {
    if (!svgRef.current || visiblePoints.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 640;
    const plotHeight = svgRef.current.clientHeight || height;
    const innerWidth = Math.max(80, width - MARGIN.left - MARGIN.right);
    const innerHeight = Math.max(80, plotHeight - MARGIN.top - MARGIN.bottom);

    const root = svg
      .attr('width', width)
      .attr('height', plotHeight)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const xExtent = d3.extent(visiblePoints, (point: ScatterPoint) => point.x) as [number, number];
    const yExtent = d3.extent(visiblePoints, (point: ScatterPoint) => point.y) as [number, number];

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

    const colorScale = d3.scaleOrdinal<string, string>().domain(labels).range(d3.schemeTableau10);

    const xAxisGroup = root
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5).tickSizeOuter(0))
      .attr('color', '#64748b')
      .attr('font-size', 10);

    const yAxisGroup = root
      .append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickSizeOuter(0))
      .attr('color', '#64748b')
      .attr('font-size', 10);

    const plotLayer = root.append('g');

    const circles = plotLayer
      .append('g')
      .selectAll('circle')
      .data<ScatterPoint>(visiblePoints)
      .enter()
      .append('circle')
      .attr('cx', (point: ScatterPoint) => xScale(point.x))
      .attr('cy', (point: ScatterPoint) => yScale(point.y))
      .attr('r', (point: ScatterPoint) => (3 + point.weight * 2) * pointScale)
      .attr('fill', (point: ScatterPoint) => colorScale(point.label))
      .attr('opacity', pointOpacity)
      .on('mouseenter', (event: MouseEvent, point: ScatterPoint) => {
        const [px, py] = d3.pointer(event, svgRef.current);
        setHovered({
          x: point.x,
          y: point.y,
          label: point.label,
          weight: point.weight,
          px,
          py,
        });
      })
      .on('mousemove', (event: MouseEvent, point: ScatterPoint) => {
        const [px, py] = d3.pointer(event, svgRef.current);
        setHovered({
          x: point.x,
          y: point.y,
          label: point.label,
          weight: point.weight,
          px,
          py,
        });
      })
      .on('mouseleave', () => {
        setHovered(null);
      });

    circles
      .append('title')
      .text((point: ScatterPoint) => `${point.label} | weight ${point.weight.toFixed(2)}`);

    const zoomBehavior = d3
      .zoom<SVGRectElement, unknown>()
      .scaleExtent([1, 12])
      .wheelDelta((event) => -event.deltaY * 0.0035)
      .translateExtent([
        [0, 0],
        [width, plotHeight],
      ])
      .on('zoom', (event) => {
        setZoomLevel(event.transform.k);
        const zx = event.transform.rescaleX(xScale);
        const zy = event.transform.rescaleY(yScale);

        xAxisGroup.call(d3.axisBottom(zx).ticks(5).tickSizeOuter(0));
        yAxisGroup.call(d3.axisLeft(zy).ticks(5).tickSizeOuter(0));

        circles
          .attr('cx', (point: ScatterPoint) => zx(point.x))
          .attr('cy', (point: ScatterPoint) => zy(point.y));
      });

    const zoomTarget = root
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'grab');

    zoomTarget.call(zoomBehavior);

    return () => {
      zoomTarget.on('.zoom', null);
    };
  }, [height, visiblePoints, labels, pointOpacity, pointScale, resetNonce]);

  let overlayMessage: string | null = null;
  if (isError) {
    overlayMessage = 'Failed to load D3 chart.';
  } else if (isLoading) {
    overlayMessage = 'Loading D3 chart...';
  } else if (points.length === 0) {
    overlayMessage = 'No points for D3 chart.';
  } else if (visiblePoints.length === 0) {
    overlayMessage = 'No points for selected labels.';
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 px-2 py-2">
        <span className={`${UI_LABEL_CLASS} mr-1`}>Zoom: {zoomLevel.toFixed(1)}x</span>
        {labels.map((label) => {
          const active = !hiddenLabels.has(label);
          return (
            <button
              key={label}
              type="button"
              className={active ? UI_CHIP_ACTIVE : UI_CHIP_INTERACTIVE}
              onClick={() =>
                setHiddenLabels((current) => {
                  const next = new Set(current);
                  if (active) {
                    next.add(label);
                  } else {
                    next.delete(label);
                  }
                  return next;
                })
              }
            >
              {label}
            </button>
          );
        })}
        <button
          type="button"
          className={`${UI_BUTTON_GHOST_SM} h-8 px-2`}
          onClick={() => {
            setHiddenLabels(new Set());
            setPointScale(1);
            setPointOpacity(0.72);
            setZoomLevel(1);
            setResetNonce((current) => current + 1);
          }}
        >
          Reset view
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <svg ref={svgRef} className="h-full w-full" data-testid="d3-embedding-scatter" />
        {hovered ? (
          <div
            className="pointer-events-none absolute z-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm"
            style={{
              left: hovered.px + 8,
              top: Math.max(8, hovered.py - 30),
            }}
          >
            <div className="font-semibold">{hovered.label}</div>
            <div>x: {hovered.x.toFixed(2)}</div>
            <div>y: {hovered.y.toFixed(2)}</div>
            <div>w: {hovered.weight.toFixed(2)}</div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-2 border-t border-slate-100 px-2 py-2 text-xs uppercase tracking-wide text-slate-500 sm:grid-cols-2">
        <label className="space-y-1">
          <div className="flex items-center justify-between">
            <span className={UI_LABEL_CLASS}>Point size</span>
            <span>{pointScale.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.6}
            max={2}
            step={0.1}
            value={pointScale}
            onChange={(event) => setPointScale(Number(event.target.value))}
            className="w-full"
          />
        </label>
        <label className="space-y-1">
          <div className="flex items-center justify-between">
            <span className={UI_LABEL_CLASS}>Opacity</span>
            <span>{Math.round(pointOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={pointOpacity}
            onChange={(event) => setPointOpacity(Number(event.target.value))}
            className="w-full"
          />
        </label>
      </div>

      {overlayMessage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-sm text-slate-400">
          {overlayMessage}
        </div>
      ) : null}
    </div>
  );
}
