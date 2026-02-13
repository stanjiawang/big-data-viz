import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { SigmaContainer } from '@react-sigma/core';
import { useCamera, useRegisterEvents, useSetSettings, useSigma } from '@react-sigma/core';
import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import type { GraphResponse } from '@/lib/types';
import {
  UI_BUTTON_GHOST_SM,
  UI_BUTTON_PRIMARY_SM,
  UI_CHIP_ACTIVE,
  UI_CHIP_INTERACTIVE,
  UI_LABEL_CLASS,
} from '@/components/ui/styleTokens';

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
  exportTargetRef?: RefObject<HTMLDivElement | null>;
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
  exportTargetRef,
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
      const theta = index * 2.399963229728653; // Golden-angle distribution
      const radius = 28 + Math.sqrt(index + 1) * 12;
      graphInstance.addNode(node.id, {
        label: node.id,
        x: Math.cos(theta) * radius,
        y: Math.sin(theta) * radius,
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

    if (nodes.length >= 16 && edgeCount >= 10) {
      forceAtlas2.assign(graphInstance, {
        iterations: 110,
        settings: {
          gravity: 1.2,
          scalingRatio: 7,
          strongGravityMode: true,
          slowDown: 1.25,
        },
      });
    }

    return graphInstance;
  }, [data, selectedClusters]);

  const overlayMessage = isError
    ? 'Failed to load graph.'
    : isLoading
      ? 'Loading graph...'
      : !data || data.nodes.length === 0
        ? 'No graph data.'
        : null;

  const sigmaKey = `${data?.nodes.length ?? 0}-${data?.edges.length ?? 0}-${Array.from(
    selectedClusters,
  )
    .sort()
    .join('|')}`;

  return (
    <div
      ref={containerRef}
      className="relative flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white"
      style={{ height }}
      data-testid="relationship-graph"
    >
      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div
          ref={exportTargetRef}
          className="relative min-h-0 overflow-hidden rounded-lg bg-slate-50/60"
        >
          <div className="h-full">
            <SigmaContainer
              key={sigmaKey}
              graph={graph}
              settings={{
                renderEdgeLabels: false,
                labelRenderedSizeThreshold: 12,
                defaultNodeColor: BASE_NODE_COLOR,
                defaultEdgeColor: '#94a3b8',
                allowInvalidContainer: true,
                stagePadding: 28,
                minCameraRatio: 0.35,
                maxCameraRatio: 5,
              }}
              style={{ height: '100%', borderRadius: '0.375rem' }}
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
              <GraphStyling
                hoveredNode={hoveredNode}
                selectedNode={selectedNode}
                showEdges={showEdges}
              />
            </SigmaContainer>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-3 rounded-lg bg-white/70 p-3">
          {clusters.length > 0 ? (
            <div className="flex flex-wrap gap-2 rounded-lg bg-white p-2">
              {clusters.map((cluster) => {
                const active = selectedClusters.has(cluster);
                return (
                  <button
                    key={cluster}
                    type="button"
                    className={active ? UI_CHIP_ACTIVE : UI_CHIP_INTERACTIVE}
                    onClick={() => {
                      setSelectedNode(null);
                      setHoveredNode(null);
                      setTooltip(null);
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
                  className={`${UI_BUTTON_GHOST_SM} h-8 px-2 text-xs`}
                  onClick={() => {
                    setSelectedNode(null);
                    setHoveredNode(null);
                    setTooltip(null);
                    setSelectedClusters(new Set());
                  }}
                >
                  Clear
                </button>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            className={showEdges ? UI_BUTTON_PRIMARY_SM : UI_BUTTON_GHOST_SM}
            onClick={() => setShowEdges((current) => !current)}
          >
            {showEdges ? 'Hide edges' : 'Show edges'}
          </button>

          {selectedNodeData ? (
            <div className="rounded-lg bg-white px-3 py-2 text-xs text-slate-700">
              <div className="font-semibold">{selectedNodeData.id}</div>
              <div>Cluster: {selectedNodeData.group}</div>
              <div>Weight: {selectedNodeData.weight}</div>
            </div>
          ) : (
            <div className="rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
              Select a node to inspect details.
            </div>
          )}

          {legendItems.length > 0 ? (
            <div
              className="min-h-0 flex-1 space-y-1 overflow-y-auto rounded-lg bg-white p-2 text-xs text-slate-600"
              tabIndex={0}
              aria-label="Graph legend"
            >
              <div className={UI_LABEL_CLASS}>Legend</div>
              {legendItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </aside>
      </div>

      {overlayMessage ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
          {overlayMessage}
        </div>
      ) : null}

      {tooltip ? (
        <div
          className="pointer-events-none absolute z-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm"
          style={{
            left: tooltip.x + TOOLTIP_OFFSET,
            top: tooltip.y + TOOLTIP_OFFSET,
          }}
        >
          {tooltip.id}
        </div>
      ) : null}
    </div>
  );
}
