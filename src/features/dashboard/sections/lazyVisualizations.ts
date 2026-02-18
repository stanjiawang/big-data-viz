import { lazy } from 'react';

export const LazyBarChart = lazy(async () => {
  const module = await import('@/features/charts/BarChart');
  return { default: module.BarChart };
});

export const LazyPieChart = lazy(async () => {
  const module = await import('@/features/charts/PieChart');
  return { default: module.PieChart };
});

export const LazyTimeSeriesChart = lazy(async () => {
  const module = await import('@/features/charts/TimeSeriesChart');
  return { default: module.TimeSeriesChart };
});

export const LazyD3EmbeddingScatter = lazy(async () => {
  const module = await import('@/features/charts/D3EmbeddingScatter');
  return { default: module.D3EmbeddingScatter };
});

export const LazyEmbeddingCloud = lazy(async () => {
  const module = await import('@/features/embeddings/EmbeddingCloud');
  return { default: module.EmbeddingCloud };
});

export const LazyRelationshipGraph = lazy(async () => {
  const module = await import('@/features/graph/RelationshipGraph');
  return { default: module.RelationshipGraph };
});

export const LazyLargeDataTable = lazy(async () => {
  const module = await import('@/features/table/LargeDataTable');
  return { default: module.LargeDataTable };
});
