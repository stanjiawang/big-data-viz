import { useEffect, useMemo, useRef, useState } from 'react';
import { SigmaContainer } from '@react-sigma/core';
import { useCamera, useRegisterEvents, useSetSettings, useSigma } from '@react-sigma/core';
import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import type { GraphResponse } from '@/lib/types';

const NODE_COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#f97316', '#0ea5e9', '#a855f7'];

const BASE_NODE_COLOR = '#2563eb';
const DIM_NODE_COLOR = '#cbd5f5';
const DIM_EDGE_COLOR = '#e2e8f0';
const HIGHLIGHT_EDGE_COLOR = '#475569';

const TOOLTIP_OFFSET = 12;

type TooltipState = {
  id: string;
  x: number;
  y: number;
};

type RelationshipGraphProps = {
  data?: GraphResponse;
  isLoading?: boolean;
  isError?: boolean;
  height?: number;
};

type SigmaNodeEvent = {
  node: string;
  event: {
    x: number;
    y: number;
    original?: MouseEvent | TouchEvent;
  };
};

function getClientPosition(event: SigmaNodeEvent, container: HTMLDivElement | null) {
  const rect = container?.getBoundingClientRect();
  if (!rect) return { x: 0, y: 0 };

  const original = event.event.original;

  if (original && 'clientX' in original && 'clientY' in original) {
    return {
      x: original.clientX - rect.left,
      y: original.clientY - rect.top,
    };
  }

  return {
    x: event.event.x - rect.left,
    y: event.event.y - rect.top,
  };
}

function GraphInteractions({
  containerRef,
  onHover,
  onLeave,
  onSelect,
  onClear,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onHover: (_payload: { id: string; x: number; y: number }) => void;
  onLeave: () => void;
  onSelect: (_id: string) => void;
  onClear: () => void;
}) {
  const registerEvents = useRegisterEvents();
  const { gotoNode } = useCamera();

  useEffect(() => {
    registerEvents({
      enterNode: (event: SigmaNodeEvent) => {
        const position = getClientPosition(event, containerRef.current);
        onHover({
          id: event.node,
          x: position.x,
          y: position.y,
        });
      },
      leaveNode: () => onLeave(),
      clickNode: (event: SigmaNodeEvent) => {
        onSelect(event.node);
        gotoNode(event.node, { duration: 600 });
      },
      clickStage: () => onClear(),
    });
  }, [containerRef, gotoNode, onClear, onHover, onLeave, onSelect, registerEvents]);

  return null;
}

function GraphStyling({
  hoveredNode,
  selectedNode,
  showEdges,
}: {
  hoveredNode: string | null;
  selectedNode: string | null;
  showEdges: boolean;
}) {
  const sigma = useSigma();
  const setSettings = useSetSettings();

  useEffect(() => {
    const activeNode = selectedNode ?? hoveredNode;

    setSettings({
      nodeReducer: (node, data) => {
        const isActive = activeNode === node;
        const isNeighbor =
          activeNode && sigma.getGraph().hasEdge(node, activeNode)
            ? true
            : activeNode && sigma.getGraph().hasEdge(activeNode, node);

        if (!activeNode) return data;

        return {
          ...data,
          color: isActive ? BASE_NODE_COLOR : isNeighbor ? data.color : DIM_NODE_COLOR,
          zIndex: isActive ? 2 : 0,
          label: isActive || isNeighbor ? data.label : '',
        };
      },
      edgeReducer: (edge, data) => {
        if (!showEdges) {
          return {
            ...data,
            color: 'rgba(0,0,0,0)',
            size: 0,
          };
        }

        const isActiveEdge =
          activeNode &&
          (sigma.getGraph().source(edge) === activeNode ||
            sigma.getGraph().target(edge) === activeNode);

        if (!activeNode) return data;

        return {
          ...data,
          color: isActiveEdge ? HIGHLIGHT_EDGE_COLOR : DIM_EDGE_COLOR,
          size: isActiveEdge ? Math.max((data.size as number) ?? 1, 1.5) : 0.5,
        };
      },
    });
  }, [hoveredNode, selectedNode, setSettings, sigma, showEdges]);

  return null;
}

function buildLegend(nodes: GraphResponse['nodes']) {
  const clusters = new Map<string, string>();
  nodes.forEach((node, index) => {
    if (!clusters.has(node.group)) {
      clusters.set(node.group, NODE_COLORS[index % NODE_COLORS.length]);
    }
  });
  return Array.from(clusters.entries()).map(([label, color]) => ({ label, color }));
}

export function RelationshipGraph({
  data,
  isLoading,
  isError,
  height = 220,
}: RelationshipGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [selectedClusters, setSelectedClusters] = useState<Set<string>>(new Set());
  const [showEdges, setShowEdges] = useState(true);

  const clusters = useMemo(() => {
    const clusterSet = new Set<string>();
    data?.nodes.forEach((node) => clusterSet.add(node.group));
    return Array.from(clusterSet).sort();
  }, [data]);

  const legendItems = useMemo(() => (data ? buildLegend(data.nodes) : []), [data]);

  const selectedNodeData = useMemo(() => {
    if (!data || !selectedNode) return null;
    return data.nodes.find((node) => node.id === selectedNode) ?? null;
  }, [data, selectedNode]);

  const graph = useMemo(() => {
    const graphInstance = new Graph();

    if (!data) {
      return graphInstance;
    }

    const activeClusters = selectedClusters.size > 0 ? selectedClusters : null;
    const nodes = activeClusters
      ? data.nodes.filter((node) => activeClusters.has(node.group))
      : data.nodes;

    const edgeLimit = Math.max(24, Math.floor(nodes.length * 1.5));
    let edgeCount = 0;

    nodes.forEach((node, index) => {
      graphInstance.addNode(node.id, {
        label: node.id,
        x: Math.cos(index) * 10,
        y: Math.sin(index) * 10,
        size: 6 + node.weight * 2,
        color: NODE_COLORS[index % NODE_COLORS.length],
      });
    });

    data.edges.forEach((edge, index) => {
      if (edgeCount >= edgeLimit) return;
      if (!graphInstance.hasNode(edge.source) || !graphInstance.hasNode(edge.target)) return;
      const key = `${edge.source}-${edge.target}-${index}`;
      if (!graphInstance.hasEdge(key)) {
        graphInstance.addEdgeWithKey(key, edge.source, edge.target, {
          size: edge.weight,
          color: '#94a3b8',
        });
        edgeCount += 1;
      }
    });

    forceAtlas2.assign(graphInstance, {
      iterations: 160,
      settings: {
        gravity: 1.4,
        scalingRatio: 6,
        strongGravityMode: true,
        slowDown: 1,
      },
    });

    return graphInstance;
  }, [data, selectedClusters]);

  const overlayMessage = isError
    ? 'Failed to load graph.'
    : isLoading
      ? 'Loading graph...'
      : !data || data.nodes.length === 0
        ? 'No graph data.'
        : null;

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height }}
      data-testid="relationship-graph"
    >
      <SigmaContainer
        graph={graph}
        settings={{
          renderEdgeLabels: false,
          labelRenderedSizeThreshold: 12,
          defaultNodeColor: BASE_NODE_COLOR,
          defaultEdgeColor: '#94a3b8',
          allowInvalidContainer: true,
        }}
        style={{ height: '100%', borderRadius: '0.5rem' }}
      >
        <GraphInteractions
          containerRef={containerRef}
          onHover={({ id, x, y }) => {
            setHoveredNode(id);
            setTooltip({ id, x, y });
          }}
          onLeave={() => {
            setHoveredNode(null);
            setTooltip(null);
          }}
          onSelect={(id) => {
            setSelectedNode(id);
          }}
          onClear={() => {
            setSelectedNode(null);
            setHoveredNode(null);
            setTooltip(null);
          }}
        />
        <GraphStyling hoveredNode={hoveredNode} selectedNode={selectedNode} showEdges={showEdges} />
      </SigmaContainer>

      {overlayMessage ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
          {overlayMessage}
        </div>
      ) : null}

      {legendItems.length > 0 ? (
        <div className="absolute left-3 top-3 space-y-1 rounded-lg bg-white/90 p-2 text-xs text-slate-600 shadow-sm backdrop-blur">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Legend</div>
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      ) : null}

      {clusters.length > 0 ? (
        <div className="absolute right-3 top-3 flex flex-wrap gap-2 rounded-lg bg-white/90 p-2 backdrop-blur">
          {clusters.map((cluster) => {
            const active = selectedClusters.has(cluster);
            return (
              <button
                key={cluster}
                type="button"
                className={`rounded-full border px-2 py-1 text-xs font-medium ${
                  active
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
                onClick={() => {
                  setSelectedClusters((current) => {
                    const next = new Set(current);
                    if (next.has(cluster)) {
                      next.delete(cluster);
                    } else {
                      next.add(cluster);
                    }
                    return next;
                  });
                }}
              >
                {cluster}
              </button>
            );
          })}
          {selectedClusters.size > 0 ? (
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500"
              onClick={() => setSelectedClusters(new Set())}
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="absolute left-3 bottom-3 flex items-center gap-2 rounded-lg bg-white/90 px-2 py-1 text-xs text-slate-600 shadow-sm backdrop-blur">
        <button
          type="button"
          className={`rounded-full border px-2 py-1 ${
            showEdges
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-500'
          }`}
          onClick={() => setShowEdges((current) => !current)}
        >
          {showEdges ? 'Hide edges' : 'Show edges'}
        </button>
      </div>

      {tooltip ? (
        <div
          className="pointer-events-none absolute rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm"
          style={{
            left: tooltip.x + TOOLTIP_OFFSET,
            top: tooltip.y + TOOLTIP_OFFSET,
          }}
        >
          {tooltip.id}
        </div>
      ) : null}

      {selectedNodeData ? (
        <div className="absolute bottom-3 right-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
          <div className="font-semibold">{selectedNodeData.id}</div>
          <div>Cluster: {selectedNodeData.group}</div>
          <div>Weight: {selectedNodeData.weight}</div>
        </div>
      ) : null}
    </div>
  );
}
