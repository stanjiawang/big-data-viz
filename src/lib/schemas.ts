import { z } from 'zod';

export const trainingRecordSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  source: z.enum(['user', 'sensor', 'system', 'synthetic']),
  label: z.string(),
  features: z.array(z.number()),
  weight: z.number(),
});

export const dataChunkSchema = z.object({
  total: z.number(),
  offset: z.number(),
  limit: z.number(),
  records: z.array(trainingRecordSchema),
});

export const timeSeriesPointSchema = z.object({
  timestamp: z.string(),
  value: z.number(),
});

export const timeSeriesResponseSchema = z.object({
  metric: z.string(),
  points: z.array(timeSeriesPointSchema),
});

export const graphNodeSchema = z.object({
  id: z.string(),
  group: z.string(),
  weight: z.number(),
});

export const graphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  weight: z.number(),
});

export const graphResponseSchema = z.object({
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
});
