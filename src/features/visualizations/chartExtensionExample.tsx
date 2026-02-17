import type { ChartDefinition } from '@/features/visualizations/chartRegistry';
import { registerChartDefinitions } from '@/features/visualizations/chartRegistry';

type RegisterGraphOverrideOptions = {
  getTitle: () => string;
  render: ChartDefinition['render'];
  order?: number;
};

export function registerGraphOverrideExtension({
  getTitle,
  render,
  order = 30,
}: RegisterGraphOverrideOptions) {
  registerChartDefinitions([
    {
      id: 'graph',
      order,
      getTitle,
      render,
    },
  ]);
}
