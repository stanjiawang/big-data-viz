import type { ReactElement } from 'react';
import type { DetailView } from '@/features/dashboard/sections/types';

export type ChartDetailView = Extract<DetailView, 'timeSeries' | 'embedding' | 'graph' | 'd3'>;

export type ChartDefinition = {
  id: ChartDetailView;
  order: number;
  getTitle: () => string;
  render: () => ReactElement;
};

const extensionRegistry = new Map<ChartDefinition['id'], ChartDefinition>();

export function registerChartDefinition(definition: ChartDefinition) {
  extensionRegistry.set(definition.id, definition);
}

export function unregisterChartDefinition(id: ChartDefinition['id']) {
  extensionRegistry.delete(id);
}

export function clearChartDefinitionRegistry() {
  extensionRegistry.clear();
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
