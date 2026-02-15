import { useMemo, useState } from 'react';
import type { RefObject } from 'react';
import DeckGL from '@deck.gl/react';
import { OrthographicView } from '@deck.gl/core';
import { ScatterplotLayer } from '@deck.gl/layers';
import { UI_BUTTON_GHOST_SM } from '@/components/ui/styleTokens';
import { useI18n } from '@/i18n/useI18n';
import type { TrainingRecord } from '@/lib/types';

type EmbeddingPoint = {
  id: string;
  position: [number, number];
  weight: number;
  label: string;
  source: TrainingRecord['source'];
};

type EmbeddingCloudProps = {
  records?: TrainingRecord[];
  isLoading?: boolean;
  isError?: boolean;
  height?: number;
  exportTargetRef?: RefObject<HTMLDivElement | null>;
  onPointClick?: (_point: { id: string; label: string; source: TrainingRecord['source'] }) => void;
};

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export function EmbeddingCloud({
  records = [],
  isLoading,
  isError,
  height = 224,
  exportTargetRef,
  onPointClick,
}: EmbeddingCloudProps) {
  const { t } = useI18n();
  const [webglOk] = useState(() => isWebGLAvailable());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [viewState, setViewState] = useState({
    target: [0, 0, 0] as [number, number, number],
    zoom: 1.8,
    minZoom: -1,
    maxZoom: 6,
  });

  const points = useMemo<EmbeddingPoint[]>(() => {
    return records.map((record) => ({
      id: record.id,
      position: [record.features[0] ?? 0, record.features[1] ?? 0],
      weight: record.weight,
      label: record.label,
      source: record.source,
    }));
  }, [records]);

  const view = useMemo(() => new OrthographicView(), []);

  const layer = useMemo(
    () =>
      new ScatterplotLayer<EmbeddingPoint>({
        id: 'embedding-cloud',
        data: points,
        getPosition: (point) => point.position,
        getRadius: (point) => 6 + point.weight * 4,
        radiusUnits: 'pixels',
        getFillColor: (point) =>
          point.label === 'class-A'
            ? [37, 99, 235]
            : point.label === 'class-B'
              ? [14, 116, 144]
              : point.label === 'class-C'
                ? [21, 128, 61]
                : [124, 58, 237],
        opacity: 0.8,
        pickable: true,
      }),
    [points],
  );

  if (isError) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400"
        style={{ height }}
      >
        Failed to load embedding cloud.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400"
        style={{ height }}
      >
        Loading embeddings...
      </div>
    );
  }

  if (!webglOk) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400"
        style={{ height }}
      >
        WebGL is not available in this browser.
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400"
        style={{ height }}
      >
        No embedding data.
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-b from-slate-50 to-white"
      style={{ height }}
    >
      <div className="absolute left-2 top-2 z-10 rounded-md bg-white px-2 py-1 text-[10px] uppercase tracking-wide text-slate-500 shadow-sm">
        Zoom: scroll | Pan: drag
      </div>
      <button
        type="button"
        className={`absolute left-2 top-9 z-10 ${UI_BUTTON_GHOST_SM} h-9 bg-white px-2 shadow-sm`}
        onClick={() =>
          setViewState({
            target: [0, 0, 0],
            zoom: 1.8,
            minZoom: -1,
            maxZoom: 6,
          })
        }
      >
        {t('d3ResetView')}
      </button>
      {hoveredId ? (
        <div className="absolute right-2 top-2 z-10 rounded-md bg-white px-2 py-1 text-xs text-slate-600 shadow-sm">
          Node: {hoveredId}
        </div>
      ) : null}
      <div ref={exportTargetRef} className="absolute inset-0">
        <DeckGL
          views={view}
          viewState={viewState}
          controller={true}
          onViewStateChange={({ viewState: nextViewState }) =>
            setViewState((current) => ({
              ...current,
              target:
                Array.isArray(nextViewState.target) && nextViewState.target.length === 3
                  ? (nextViewState.target as [number, number, number])
                  : current.target,
              zoom: typeof nextViewState.zoom === 'number' ? nextViewState.zoom : current.zoom,
            }))
          }
          layers={[layer]}
          getTooltip={({ object }) => {
            if (!object) return null;
            const point = object as { id: string; label: string; weight: number };
            return {
              text: `${point.id}\n${point.label}\nweight: ${point.weight.toFixed(2)}`,
            };
          }}
          onHover={({ object }) => {
            if (!object) return setHoveredId(null);
            const point = object as { id: string };
            setHoveredId(point.id);
          }}
          onClick={({ object }) => {
            if (!object || !onPointClick) {
              return;
            }
            const point = object as EmbeddingPoint;
            onPointClick({
              id: point.id,
              label: point.label,
              source: point.source,
            });
          }}
          style={{ position: 'absolute', inset: '0', background: 'transparent' }}
        />
      </div>
    </div>
  );
}
