import { mulberry32, pick, randomInRange } from '@/lib/random';
import type {
  DataChunk,
  GraphResponse,
  MockDataRequest,
  MockFilters,
  TimeSeriesResponse,
  TrainingRecord,
} from '@/lib/types';

const SOURCES: TrainingRecord['source'][] = ['user', 'sensor', 'system', 'synthetic'];
const LABELS = ['class-A', 'class-B', 'class-C', 'class-D', 'class-E'];
const DEFAULT_WEIGHT_MIN = 0.5;
const DEFAULT_WEIGHT_MAX = 2.5;

function resolveSources(filters?: MockFilters) {
  if (!filters?.source || filters.source === 'all') return SOURCES;
  return [filters.source];
}

function resolveLabels(filters?: MockFilters) {
  if (filters?.labels && filters.labels.length > 0) return filters.labels;
  if (!filters?.label || filters.label === 'all') return LABELS;
  return [filters.label];
}

function withinWeightRange(weight: number, filters?: MockFilters) {
  const min = filters?.weightMin ?? DEFAULT_WEIGHT_MIN;
  const max = filters?.weightMax ?? DEFAULT_WEIGHT_MAX;
  return weight >= min && weight <= max;
}

function hasActiveFilters(filters?: MockFilters) {
  if (!filters) return false;
  if (filters.search) return true;
  if (filters.label && filters.label !== 'all') return true;
  if (filters.labels && filters.labels.length > 0) return true;
  if (filters.source && filters.source !== 'all') return true;
  if (
    filters.weightMin !== undefined &&
    Math.abs(filters.weightMin - DEFAULT_WEIGHT_MIN) > 0.0001
  ) {
    return true;
  }
  if (
    filters.weightMax !== undefined &&
    Math.abs(filters.weightMax - DEFAULT_WEIGHT_MAX) > 0.0001
  ) {
    return true;
  }
  return false;
}

function matchesFilters(record: TrainingRecord, filters?: MockFilters) {
  if (!filters) return true;

  const allowedSources = resolveSources(filters);
  const allowedLabels = resolveLabels(filters);

  if (!allowedSources.includes(record.source)) return false;
  if (!allowedLabels.includes(record.label)) return false;
  if (filters.search && !record.id.includes(filters.search)) return false;
  if (!withinWeightRange(record.weight, filters)) return false;

  return true;
}

function generateRecord(
  next: () => number,
  index: number,
  vectorSize: number,
  filters?: MockFilters,
) {
  const features = Array.from({ length: vectorSize }, () =>
    Number(randomInRange(next, -1, 1).toFixed(4)),
  );

  const timestamp = new Date(
    Date.now() - Math.floor(randomInRange(next, 0, 1000 * 60 * 60 * 24 * 30)),
  ).toISOString();

  const idPrefix = filters?.search ? filters.search.replace(/\s+/g, '-') : 'rec';

  return {
    id: `${idPrefix}_${index.toString().padStart(8, '0')}`,
    timestamp,
    source: pick(next, resolveSources(filters)),
    label: pick(next, resolveLabels(filters)),
    features,
    weight: Number(randomInRange(next, DEFAULT_WEIGHT_MIN, DEFAULT_WEIGHT_MAX).toFixed(3)),
  } satisfies TrainingRecord;
}

export function generateChunk({
  total,
  offset,
  limit,
  vectorSize,
  filters,
}: MockDataRequest): DataChunk {
  const safeLimit = Math.min(limit, Math.max(total - offset, 0));
  const next = mulberry32(42 + offset);

  const records: TrainingRecord[] = [];
  let attempts = 0;

  while (records.length < safeLimit && attempts < safeLimit * 5) {
    const record = generateRecord(next, offset + records.length, vectorSize, filters);
    if (matchesFilters(record, filters)) {
      records.push(record);
    }
    attempts += 1;
  }

  const effectiveTotal = hasActiveFilters(filters) ? records.length : total;

  return {
    total: effectiveTotal,
    offset,
    limit: records.length,
    records,
  } satisfies DataChunk;
}

export function generateTimeSeries(
  metric = 'ingestion',
): TimeSeriesResponse | { metric: string; points: [] } {
  const next = mulberry32(7);
  const points = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
    return {
      timestamp: date.toISOString(),
      value: Math.round(randomInRange(next, 800, 1800)),
    };
  });

  return {
    metric,
    points,
  };
}

export function generateGraph(): GraphResponse {
  const next = mulberry32(99);
  const nodes = Array.from({ length: 24 }, (_, i) => ({
    id: `node-${i + 1}`,
    group: `cluster-${(i % 6) + 1}`,
    weight: Number(randomInRange(next, 0.5, 2.5).toFixed(2)),
  }));

  const edges = Array.from({ length: 40 }, () => {
    const source = pick(next, nodes).id;
    const target = pick(next, nodes).id;
    return {
      source,
      target,
      weight: Number(randomInRange(next, 0.2, 1.5).toFixed(2)),
    };
  });

  return { nodes, edges };
}
