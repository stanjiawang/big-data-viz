import {
  clearChartDefinitionRegistry,
  registerChartDefinition,
  resolveChartDefinitions,
  unregisterChartDefinition,
  type ChartDefinition,
} from '@/features/visualizations/chartRegistry';

function createDefinition(
  id: ChartDefinition['id'],
  order: number,
  title: string,
): ChartDefinition {
  return {
    id,
    order,
    getTitle: () => title,
    render: () => <div>{title}</div>,
  };
}

describe('chartRegistry', () => {
  const core = [
    createDefinition('timeSeries', 20, 'Time Series'),
    createDefinition('embedding', 40, 'Embedding'),
    createDefinition('graph', 30, 'Relationship Graph'),
    createDefinition('d3', 50, 'D3'),
  ] as const;

  afterEach(() => {
    clearChartDefinitionRegistry();
  });

  it('returns core definitions sorted by order', () => {
    const resolved = resolveChartDefinitions(core);
    expect(resolved.map((definition) => definition.id)).toEqual([
      'timeSeries',
      'graph',
      'embedding',
      'd3',
    ]);
  });

  it('allows extension overrides by id', () => {
    registerChartDefinition(createDefinition('embedding', 10, 'Embedding Override'));

    const resolved = resolveChartDefinitions(core);
    const embedding = resolved.find((definition) => definition.id === 'embedding');

    expect(embedding?.getTitle()).toBe('Embedding Override');
    expect(resolved[0]?.id).toBe('embedding');
  });

  it('removes overrides when unregistered', () => {
    registerChartDefinition(createDefinition('graph', 5, 'Graph Override'));
    unregisterChartDefinition('graph');

    const resolved = resolveChartDefinitions(core);
    const graph = resolved.find((definition) => definition.id === 'graph');

    expect(graph?.getTitle()).toBe('Relationship Graph');
  });
});
