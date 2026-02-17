import type { ReactElement } from 'react';
import type { DetailView } from '@/features/dashboard/sections/types';
import type { MessageKey } from '@/i18n/messages';

export type ChartDetailView = Extract<DetailView, 'timeSeries' | 'embedding' | 'graph' | 'd3'>;

export type ChartDefinition = {
  id: ChartDetailView;
  order: number;
  getTitle: () => string;
  render: () => ReactElement;
};

const extensionRegistry = new Map<ChartDefinition['id'], ChartDefinition>();
const CHART_DETAIL_VIEWS = ['timeSeries', 'embedding', 'graph', 'd3'] as const;
const CHART_DETAIL_TITLE_KEYS: Record<ChartDetailView, MessageKey> = {
  timeSeries: 'sectionTimeSeriesTitle',
  embedding: 'sectionEmbeddingTitle',
  graph: 'sectionGraphTitle',
  d3: 'sectionD3Title',
};

export function registerChartDefinition(definition: ChartDefinition) {
  extensionRegistry.set(definition.id, definition);
}

export function registerChartDefinitions(definitions: readonly ChartDefinition[]) {
  definitions.forEach((definition) => {
    registerChartDefinition(definition);
  });
}

export function unregisterChartDefinition(id: ChartDefinition['id']) {
  extensionRegistry.delete(id);
}

export function clearChartDefinitionRegistry() {
  extensionRegistry.clear();
}

export function isChartDetailView(view: DetailView): view is ChartDetailView {
  return (CHART_DETAIL_VIEWS as readonly string[]).includes(view);
}

export function getChartDetailTitleKey(view: ChartDetailView): MessageKey {
  return CHART_DETAIL_TITLE_KEYS[view];
}

function compareByOrderThenId(left: ChartDefinition, right: ChartDefinition) {
  if (left.order !== right.order) {
    return left.order - right.order;
  }
  return left.id.localeCompare(right.id);
}

export function resolveChartDefinitions(core: readonly ChartDefinition[]) {
  const merged = new Map<ChartDefinition['id'], ChartDefinition>();
  core.forEach((definition) => merged.set(definition.id, definition));
  extensionRegistry.forEach((definition, id) => {
    merged.set(id, definition);
  });
  return Array.from(merged.values()).sort(compareByOrderThenId);
}
