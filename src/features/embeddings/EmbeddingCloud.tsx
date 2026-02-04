import { useMemo, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { OrthographicView } from '@deck.gl/core';
import { ScatterplotLayer } from '@deck.gl/layers';
import type { TrainingRecord } from '@/lib/types';

type EmbeddingCloudProps = {
  records?: TrainingRecord[];
  isLoading?: boolean;
  isError?: boolean;
};

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export function EmbeddingCloud({ records = [], isLoading, isError }: EmbeddingCloudProps) {
  const [webglOk] = useState(() => isWebGLAvailable());

  const points = useMemo(() => {
    return records.map((record) => ({
      id: record.id,
      position: [record.features[0] ?? 0, record.features[1] ?? 0],
      weight: record.weight,
      label: record.label,
    }));
  }, [records]);

  const view = useMemo(() => new OrthographicView(), []);

  const viewState = useMemo(
    () => ({
      target: [0, 0, 0] as [number, number, number],
      zoom: 0.8,
      minZoom: -2,
      maxZoom: 4,
    }),
    [],
  );

  const layer = useMemo(
    () =>
      new ScatterplotLayer({
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
        pickable: false,
      }),
    [points],
  );

  if (isError) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        Failed to load embedding cloud.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        Loading embeddings...
      </div>
    );
  }

  if (!webglOk) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        WebGL is not available in this browser.
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        No embedding data.
      </div>
    );
  }

  return (
    <div className="relative h-48 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <DeckGL
        views={view}
        viewState={viewState}
        controller={false}
        layers={[layer]}
        style={{ position: 'absolute', inset: '0' }}
      />
    </div>
  );
}
