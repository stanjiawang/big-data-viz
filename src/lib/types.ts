export type TrainingRecord = {
  id: string;
  timestamp: string;
  source: 'user' | 'sensor' | 'system' | 'synthetic';
  label: string;
  features: number[];
  weight: number;
};

export type DataChunk = {
  total: number;
  offset: number;
  limit: number;
  records: TrainingRecord[];
};

export type MockFilters = {
  label?: string;
  labels?: string[];
  source?: TrainingRecord['source'] | 'all';
  search?: string;
  weightMin?: number;
  weightMax?: number;
};

export type MockDataRequest = {
  total: number;
  offset: number;
  limit: number;
  vectorSize: number;
  filters?: MockFilters;
};

export type TimeSeriesPoint = {
  timestamp: string;
  value: number;
};

export type TimeSeriesResponse = {
  metric: string;
  points: TimeSeriesPoint[];
};

export type GraphNode = {
  id: string;
  group: string;
  weight: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  weight: number;
};

export type GraphResponse = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
