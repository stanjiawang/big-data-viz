import { z } from 'zod';
import { API_SCHEMA_VERSION } from '@/lib/contracts';

export const trainingRecordSchema = z
  .object({
    id: z.string(),
    timestamp: z.string(),
    source: z.enum(['user', 'sensor', 'system', 'synthetic']),
    label: z.string(),
    features: z.array(z.number()),
    weight: z.number(),
  })
  .strict();

export const dataChunkSchema = z
  .object({
    schemaVersion: z.literal(API_SCHEMA_VERSION),
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
    records: z.array(trainingRecordSchema),
  })
  .strict();

export const timeSeriesPointSchema = z
  .object({
    timestamp: z.string(),
    value: z.number(),
  })
  .strict();

export const timeSeriesResponseSchema = z
  .object({
    schemaVersion: z.literal(API_SCHEMA_VERSION),
    metric: z.string(),
    points: z.array(timeSeriesPointSchema),
  })
  .strict();

export const graphNodeSchema = z
  .object({
    id: z.string(),
    group: z.string(),
    weight: z.number(),
  })
  .strict();

export const graphEdgeSchema = z
  .object({
    source: z.string(),
    target: z.string(),
    weight: z.number(),
  })
  .strict();

export const graphResponseSchema = z
  .object({
    schemaVersion: z.literal(API_SCHEMA_VERSION),
    nodes: z.array(graphNodeSchema),
    edges: z.array(graphEdgeSchema),
  })
  .strict();
